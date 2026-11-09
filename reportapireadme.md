# LillyAI

**LillyAI** is an automated Health Technology Assessment (HTA) and clinical intelligence pipeline. Given a drug, disease, and evidence filters, it downloads regulatory and peer-reviewed sources, runs a multi-agent LangGraph workflow, and produces a cited **multi-section reimbursement dossier** as Markdown and PDF.

The reference test case is **Metformin for Type 2 Diabetes** (`main_local.py`).

---

## What it produces

Each run generates:

| Output | Path | Description |
|---|---|---|
| Full report (Markdown) | `test_outputs/{Drug}_Full_Report.md` | CDA-style dossier with executive summary, built-in sections, references |
| Full report (PDF) | `test_outputs/{Drug}_Full_Report.pdf` | Styled PDF via Playwright/Chromium |
| Master state (JSON) | `test_outputs/{Drug}_Master_State.json` | All agent outputs + citation registry |
| Downloaded sources | `test_data/{Drug}/` | Raw labels, PubMed articles, HTA docs, disease data |

### Report structure

1. **Background** — disease context, label overview, place in therapy  
2. **Clinical review** — trial characteristics, GRADE table, safety, CASP/GRADE appraisal embedded in clinical tables  
3. **Drug details** — structured regulatory extraction from FDA/EMA labels  
4. **Comparator analysis** — cross-drug matrix from labels  
5. **Economic evidence** — pharmacoeconomic publications  
6. **Critical Appraisal** *(optional built-in)* — source-level internal/external validity narrative for downloaded clinical, economic, and HTA files (see [Critical Appraisal](#critical-appraisal))  
7. **HTA agency decisions** — NICE, SMC, NCPE summaries  
8. **Evidence scope & filter alignment** — retrieval warnings and filter notes  

---

## How it works (pipeline)

```
Phase 1: Downloaders          Phase 2: LangGraph agents        Phase 3–4: Report
─────────────────────         ─────────────────────────        ─────────────────
PubMed / PMC articles    →    Disease Agent
DailyMed / EMA labels    →    Clinical Agent → Clinical Appraisal (CASP/GRADE in clinical section)
HTA (NICE/SMC/NCPE)      →    Economic Agent → Economic Appraisal (Drummond in economic section)
Disease APIs (NLM/WHO)   →    Critical Appraisal Agent (standalone validity section)
                              Drug Agent
                              HTA Agent
                              Comparator Agent
                              Compliance Agent
                              Executive Agent
                                    ↓
                              Citation registry + compiler → PDF renderer
```

1. **Discovery** — suggest standard-of-care comparators and return PubMed metadata, including whether each paper has PMC full text or only an abstract.
2. **Upload (API, optional)** — users may attach a PDF to a PMID/PMCID. LillyAI verifies title, year, and authors without AI, reports any warning, and lets the user decide whether to use it.
3. **Download** — fetch literature, labels, HTA documents, and disease reference data. A selected user PDF fills an abstract-only/paywalled gap, or explicitly replaces PMC text when requested.
4. **Extract & appraise** — specialized agents use RAG over downloaded files to populate structured JSON schemas.
5. **Compile** — `report_compiler.py` assembles sections, splits wide tables, and inserts superscript citations.
6. **Render** — `report_renderer.py` converts Markdown to HTML and prints PDF (Playwright preferred on macOS).

---

## Data sources

| Platform | Module | Content |
|---|---|---|
| **PubMed / PMC** | `downloaders/pubmed.py` | Clinical/economic literature metadata, abstracts, and available PMC full text; selected IDs may be PMIDs or PMCIDs |
| **User article PDFs** | `app/services/article_upload_service.py`, `utils/pdf_article_fields.py` | User-supplied full text tied to a PMID/PMCID; deterministic metadata matching, then clinical/economic ingestion as `user_upload` |
| **DailyMed (FDA)** | `downloaders/dailymed.py` | US prescribing information (HTML search + SPL API; gpt-4o-mini tie-break for ambiguous labels) |
| **EMA** | `downloaders/ema.py` | European SmPC labels (direct PDF URL + EPAR scrape fallback; when geography filter includes Europe/GCC) |
| **NICE (UK)** | `downloaders/hta.py` | Technology appraisal PDFs |
| **SMC (Scotland)** | `downloaders/hta.py` | Medicines advice PDFs |
| **NCPE (Ireland)** | `downloaders/hta.py` | HTA assessment HTML |
| **NLM Clinical Tables** | `downloaders/disease_api.py` | ICD-11 disease codes |
| **WHO ICD API** | `downloaders/disease_api.py` | Disease definitions |

CLI downloads are cached under `test_data/{Drug}/`. API report sources live under
`{DATA_ROOT}/reports/{report_id}/data/`; original user PDFs live under
`{DATA_ROOT}/reports/{report_id}/uploads/{upload_id}/`. At generation time, an accepted PDF is
converted to the same Markdown + metadata layout consumed by agents, citation generation, critical
appraisal, and the evidence index used by grounded inline rewrites.

---

## Agents

All agents live in `agents/` and share `ReportState` (`agents/state.py`).

| Agent | Role |
|---|---|
| **Disease Agent** | Epidemiology, pathophysiology, management context from disease JSON + systematic reviews |
| **Clinical Agent** | Extracts trial design, endpoints, demographics from PubMed RAG; respects population filters |
| **Clinical Appraisal Agent** | GRADE/CASP quality scoring for extracted trials; runs immediately after clinical extraction; feeds the **Clinical Evidence** section |
| **Economic Agent** | Pharmacoeconomic studies from `economic/` PubMed downloads |
| **Economic Appraisal Agent** | Drummond quality scoring for economic studies; runs immediately after economic extraction; feeds the **Economic Evidence** section |
| **Critical Appraisal Agent** | Standalone source-level validity/applicability appraisal of downloaded files (`pubmed/`, `economic/`, `hta/` including PDFs); does not re-extract clinical/economic JSON or emit checklist tables |
| **Drug Agent** | Structured label extraction (dosing, contraindications, PK, special populations); **sparse retry** re-queries the label for any fields still missing after pass 1 |
| **HTA Agent** | Summarizes NICE/SMC/NCPE decisions from downloaded HTA documents |
| **Comparator Agent** | Builds drug-vs-comparator matrix from `drug_details` + per-comparator label RAG |
| **Compliance Agent** | Audits extracted evidence against user filters; surfaces pipeline gaps |
| **Executive Agent** | Key messages and formulary assessment synthesis |

Shared utilities: `agents/rag_utils.py` (Chroma retrievers, source-tagged context; reads `.md`, `.html`, `.pdf` via `utils/source_text.py`), `agents/label_utils.py` (label HTML cleaning).

### Critical Appraisal

Optional built-in section (`critical_appraisal`). It answers whether each **downloaded source file** can be trusted and applied to the reimbursement question—without repeating efficacy/cost results from Clinical or Economic Evidence.

| Topic | Detail |
|---|---|
| **Selection rule** | `critical_appraisal` requires **clinical and/or economic** in `section_types` (API validation). It does not trigger its own downloads. |
| **Source pools** | `pubmed/` when clinical is selected; `economic/` and `hta/` (`.md`, `.html`, `.pdf`) when economic is selected. Disease-background folders are excluded. |
| **Agents** | `agents/critical_appraisal_agent.py` (per-source RAG + structured validity fields), `agents/critical_appraisal_layout.py` (expanded / condensed / table-only display), `pipeline/critical_appraisal_render.py` (shared Markdown renderer). |
| **Output shape** | Methods note, cross-study opening synthesis, summary table, per-source Internal/External Validity prose (or condensed appraisal), key evidence gaps, overall conclusion. |
| **vs Clinical/Economic appraisal** | Clinical/Economic agents score extracted trial rows (CASP, Drummond) inside those sections. Critical Appraisal reads **raw downloaded files** and judges document-level methodology. |

**Environment overrides:** `CRITICAL_APPRAISAL_MODEL` (default `gpt-5.4`), `CRITICAL_APPRAISAL_LAYOUT_MODEL` (default `gpt-4o-mini`).

**Offline tests:** `pytest tests/test_critical_appraisal_section.py tests/test_critical_appraisal_layout.py -v`

**Integration test (Spinraza fixture, needs `OPENAI_API_KEY`):**

```bash
pytest tests/test_critical_appraisal_integration.py -m integration -v
```

**Render from an existing download without re-running the full pipeline:**

```bash
python scripts/render_critical_appraisal.py \
  --master-state downloaded_report/exports/spinraza_Master_State.json \
  --data-dir downloaded_report/data \
  --model gpt-4o \
  --skip-abstract-only
```

Output: `downloaded_report/exports/spinraza_Critical_Appraisal.md`. Use `--update-master` to merge into master state, or `--recompile-full-report` to refresh the full dossier markdown.

---

## Evidence verification

Verification is an explainable, fail-open audit layer. It does not delete evidence, rewrite extracted
content, or block report generation when a verifier is unavailable. Verification metadata is
returned in section `content.raw` for frontend use and retained in master state JSON, but is not
inserted into report blocks, Markdown, PDF, or PPTX.

### Implemented layers

1. **PubMed paper relevance reranking** — scores every discovery candidate against the target drug,
   disease/subtype, and active study type, population, and outcome filters. It preserves all
   candidates and their original PubMed rank.
2. **Clinical, economic, and BIA claim verification** — extracts numeric claims from evidence rows
   and narratives, retrieves passages from assigned source files, then checks values and their
   clinical/economic context in batches.
3. **HTA claim verification** — verifies numeric and text claims for agency recommendations,
   decision dates, ICERs, budget impact, access schemes, reimbursement conditions, committee
   concerns, and the HTA synthesis. Each decision result includes `decision_index` for direct UI
   mapping.

### Planned layers

- **Drug/comparator label identity** — ensure each downloaded regulatory label belongs to the
  intended product before extraction or comparison.
- **GRADE/appraisal audit** — sample appraisal outputs for inconsistent certainty judgments or
  boilerplate reasoning.
- **Executive-summary lineage** — ensure summary statements are present and verified upstream.
- **Compliance verification** — compare requested evidence filters with retrieved and extracted
  evidence, and identify pipeline gaps.

### Claim status meanings

- `supported` — all material values and context are explicitly supported by the selected passage.
- `partially_supported` — some elements match, but another value or material context is missing or
  mismatched.
- `contradicted` — the selected source explicitly provides an incompatible value or context.
- `not_found` — the assigned readable source does not contain matching evidence for the claim.
- `unverifiable` — missing/unreadable evidence, ambiguity, limited evidence depth, or verifier
  failure prevents a responsible decision.

`suggested_value` and `suggested_claim` are advisory and appear only for partially supported or
contradicted claims when the replacement is grounded in the selected passage.

### Frontend pattern

- Render normal report content from `content.blocks`; verification does not change those blocks.
- Read verification metadata from `content.raw`.
- Show section-level counts as a summary badge and map individual claims to cells/fields using
  `location + field`; for HTA decision rows, use `decision_index + field`.
- Use a status icon beside the existing value. On click, show `reason`, `confidence`,
  `source_file`, `source_section`, `source_passage`, and any grounded suggestion.
- Treat `not_found` and `unverifiable` as audit states, not automatic proof that the report value is
  false. Never silently apply `suggested_value`.

Implementation: `verification/`, `agents/claim_verifier_agents.py`,
`pipeline/graph_runner.py`, and `app/constants.py`. Offline tests:
`pytest tests/test_paper_relevance.py tests/test_claim_verification.py -v`.

---

## Quick start

### Prerequisites

- Python 3.11+
- OpenAI API key
- Optional: `NCBI_API_KEY` and `ENTREZ_EMAIL` for faster PubMed access

### Install

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium   # required for PDF generation on macOS
```

### Environment (`.env`)

```env
OPENAI_API_KEY=sk-...
ENTREZ_EMAIL=your@email.com
NCBI_API_KEY=optional_but_recommended
WHO_ID=optional
WHO_SECRET=optional
```

For the HTTP API and Docker stack, see [Backend API](#backend-api-fastapi--celery--mongodb) and `.env.example`.

### Run

```bash
python main_local.py
```

Outputs land in `test_outputs/`. Source files accumulate in `test_data/`.

---

## Backend API (FastAPI + Celery + MongoDB)

The repository exposes the same pipeline over HTTP. The API splits the workflow into **validate → configure → discover → select → generate → poll → export** so a frontend can drive each step.

**Base URL:** `http://localhost:8000/api/v1`  
**Interactive docs:** http://localhost:8000/docs  
**Auth:** none — this service is an unauthenticated microservice; access control is handled by the gateway / managed backend. Reports are keyed by `report_id` only.

### Local development (Docker)

```bash
cp .env.example .env          # set OPENAI_API_KEY, ENTREZ_EMAIL
docker compose up --build     # starts mongo, redis, web, worker
curl http://localhost:8000/api/v1/health
```

| Service | Role |
|---------|------|
| `web` | FastAPI HTTP API |
| `worker` | Celery — runs report generation and export jobs; standalone calculator requests run synchronously in `web` |
| `mongo` | Report/section/job persistence |
| `redis` | Celery broker |

Restart after `.env` changes:

```bash
docker compose down && docker compose up -d
```

### API lifecycle (mental model)

```
POST /drugs/validate       → optional typo check while user types drug name (before create)
POST /reports              → save config shell (draft) — no AI, no downloads
POST /discovery/*          → optional lookups (comparators, PubMed metadata/full-text availability)
POST /reports/{id}/articles/upload → optional PDF verification; returns upload_id + match status
POST /custom-sections      → optional AI custom sections (prompt and/or PDF/DOCX → guidelines)
PATCH /reports/{id}/inputs     → update dosage, cost analysis, or other stored inputs
PUT  /reports/{id}/selections → lock in IDs + selected upload_id/flags + sections (ready)
POST /reports/{id}/generate  → enqueue Celery job (queued → processing → completed/failed)
GET  /reports/{id}/status    → poll progress + per-section status
GET  /reports/{id}/sections/{section_id} → fetch section JSON when completed
GET  /sections/{id}/editable-document → load versioned blocks for inline editing
PUT  /sections/{id}/editable-document → save edits / accept rewrite (new client_op_id each time)
POST /sections/{id}/rewrite-previews  → AI rewrite suggestion (non-mutating)
POST /reports/{id}/export/pdf  → always rebuild PDF; optionally attach a premium PNG logo
POST /reports/{id}/export/pptx → always rebuild PPTX from latest content (poll status, then download)

POST /calculators/dosing               → synchronous dosing and annual acquisition-cost arithmetic
POST /calculators/cost-analysis        → synchronous per-patient/programme cost analysis
POST /calculators/budget-impact        → synchronous 3- or 5-year BIA
POST /calculators/dailymed-suggestions → optional synchronous label suggestions
```

**Report statuses:** `draft` → `ready` → `queued` → `processing` → `completed` | `failed`

### Understanding Docker logs

When generation fails, the **API and Mongo keep running** — only the Celery **task** failed.

| Log source | What it means |
|------------|----------------|
| `web-1` | HTTP requests (create report, status polls) — normal 200s after failure |
| `worker-1` | Pipeline execution. `ERROR/ForkPoolWorker` = job failed (e.g. OpenAI 429 quota) |
| `mongo-1` `WTCHKPT` / `saving checkpoint` | Routine MongoDB disk checkpoints every ~60s — **not errors**, safe to ignore |

Example worker failure (OpenAI quota exhausted during disease agent embeddings):

```
worker-1 | ERROR/ForkPoolWorker-1] Task ... generate_report_job ... raised unexpected: OpenAIError("... 429 ... insufficient_quota")
worker-1 |   File "agents/disease_agent.py", line 50, in build_local_retriever
worker-1 |     return Chroma.from_documents(...)  # calls OpenAI embeddings API
```

The API correctly returns `report_status: "failed"` with `status_reason` on `GET /status`. Fix billing/key, restart Docker, then retry with `POST /generate` (see below).

### Retry after a failed generation

You do **not** need to re-create the report or re-run discovery. Selections are already saved.

**POST** `/api/v1/reports/{report_id}/generate`

```json
{
  "force_regenerate": true,
  "idempotency_key": "metformin-retry-2"
}
```

Poll `GET /status` until `report_status` is `completed`. Use **new** `section_id` values from the retry response (old failed sections may still appear in status — filter by `active_job_id` in the frontend).

---

### Endpoint reference

#### Health

**GET** `/api/v1/health/live` — liveness probe (no Mongo/Redis check)

```json
{ "status": "ok" }
```

**GET** `/api/v1/health` — readiness with dependency checks

```json
{
  "status": "ok",
  "mongo": { "ok": true, "error": null },
  "redis": { "ok": true, "error": null }
}
```

---

#### Drug name validation

Fast typo / spelling check while the user enters a drug name on the create-report form. Uses **gpt-4o-mini** with structured output (~300–800 ms). Call **before** `POST /reports`; it does not create or modify reports.

**POST** `/api/v1/drugs/validate`

```json
{
  "drug": "Spnraza",
  "disease": "Spinal muscular atrophy"
}
```

`disease` is optional but helps disambiguation. `drug` must be at least 2 characters after trimming.

Response `200` when the name is already valid (INN or established brand):

```json
{
  "input": "Nusinersen",
  "accepted": true,
  "suggestion": null
}
```

Response `200` when a correction is suggested (at most one name; INN preferred over brand):

```json
{
  "input": "Spnraza",
  "accepted": false,
  "suggestion": "Nusinersen"
}
```

Response `200` when the name is unrecognized and no confident correction exists:

```json
{
  "input": "xyzfoo",
  "accepted": false,
  "suggestion": null
}
```

| Status | When |
|--------|------|
| `422` | `drug` too short after trim |
| `502` | OpenAI unavailable — frontend should allow the user to continue without blocking |

**Frontend guidance:** debounce input (400–500 ms) or call on blur; use `AbortController` to ignore stale responses; show “Did you mean {suggestion}?” only when `accepted` is `false` and `suggestion` is set. Validation is advisory — `POST /reports` stores whatever string the user confirms.

Implementation: `pipeline/drug_validation.py` (in-memory cache per normalized drug + disease).

---

#### Reports

**POST** `/api/v1/reports` — create report shell (does **not** run pipeline)

Report calculator inputs are saved later with `PUT /reports/{report_id}/selections`.
See [Pharmaceutical calculators → Report calculator integration](#report-calculator-integration).

```json
{
  "drug": "Metformin",
  "disease": "Type 2 Diabetes",
  "inputs": {
    "pubmed_top_k_clinical": 10,
    "pubmed_top_k_economic": 10,
    "advanced_filters": {
      "time_range": "Last 5 Years",
      "species_filter": "human",
      "clinical_types": [
        "Randomized Controlled Trials (RCTs)",
        "Meta-Analyses",
        "Clinical Trials"
      ],
      "economic_types": [
        "Cost-Effectiveness",
        "Budget Impact",
        "Cost-Utility",
        "Pharmacoeconomic Studies"
      ]
    }
  }
}
```

Response `201` (abbreviated):

```json
{
  "report_id": "f7e03378-0f0b-42b1-acc1-c947c6ed55fb",
  "drug": "Metformin",
  "disease": "Type 2 Diabetes",
  "status": "draft",
  "inputs": { "advanced_filters": { "...": "..." }, "pubmed_top_k_clinical": 10, "pubmed_top_k_economic": 10 },
  "discovery": {
    "comparator_recommendations": [],
    "clinical_candidates": [],
    "economic_candidates": []
  },
  "selections": {
    "comparators": [],
    "clinical_pmcids": [],
    "economic_pmcids": [],
    "section_types": ["disease", "drug", "clinical", "economic", "critical_appraisal", "comparator", "environmental", "hta", "compliance", "executive"]
  },
  "storage_root": "/data/reports/{report_id}"
}
```

**PATCH** `/api/v1/reports/{report_id}/inputs` — update stored inputs without creating a new report

Unset fields keep their stored values. After the merge, `dosage` and `cost_analysis` must still both be present or both be absent. Returns the full report detail (`200`). Returns `409` while the report is `queued` or `processing`, and `422` if the merged pair is incomplete.

To clear the structured calculation, explicitly send both fields as `null`:

```json
{ "dosage": null, "cost_analysis": null }
```

Omitting either key preserves its stored value. Clearing only one field returns `422`. Clearing the pair prevents the calculation on the next generation; it does not remove an already-generated economic section until the report is generated again.

```json
{
  "dosage": {
    "category": "Infant",
    "frequency": "once every 4 months",
    "duration": "12 months",
    "currency": "USD",
    "unit_price": 75000,
    "patient_volume": 30
  },
  "cost_analysis": {
    "annual_costs": {
      "administration": 100,
      "monitoring": 50,
      "lab_diagnostics": 25,
      "outpatient_visits": 75,
      "ae_management": 200,
      "ae_rate_percent": 10,
      "hospitalizations": 300,
      "other_direct_costs": 40
    },
    "offsets": {"hospitalization_avoidance": 150, "other_offsets": 50},
    "comparator": {
      "name": "Standard of care",
      "annual_drug_cost": 5000,
      "administration_and_monitoring": 200,
      "offsets": 100
    },
    "population": {
      "eligible_patients": 1000,
      "uptake_year_1_percent": 10,
      "uptake_year_2_percent": 30,
      "uptake_year_3_percent": 50
    }
  }
}
```

`dosage` does not repeat `drug` or `disease`. `cost_analysis.comparator.name` is optional on a report: set it when more than one comparator will be selected; if it is omitted, generate requires exactly one selected comparator.

**GET** `/api/v1/reports` — list reports (`?page=1&page_size=20`)

**GET** `/api/v1/reports/{report_id}` — full report detail + artifacts when complete. Saved `selections.dosing`, `selections.cost_analysis`, and `selections.budget_impact` are returned for form reload and audit.

---

#### Discovery (optional)

Discovery is **fast metadata lookup** — it does not download full papers or run agents.

| Endpoint | Backend | Speed |
|----------|---------|-------|
| `POST .../discovery/comparators` | OpenAI gpt-4o-mini | ~1–3s (fails silently to `[]` if quota exceeded) |
| `POST .../discovery/clinical-articles` | PubMed esearch + efetch metadata | ~1–3s |
| `POST .../discovery/economic-articles` | PubMed esearch + efetch metadata | ~1–3s |

**POST** `/api/v1/reports/{report_id}/discovery/comparators` — no body

```json
{
  "report_id": "f7e03378-0f0b-42b1-acc1-c947c6ed55fb",
  "suggestions": ["Glipizide", "Sitagliptin"]
}
```

Empty `suggestions: []` usually means OpenAI quota/key issue — you can skip this and set comparators manually in selections.

**Important:** Discovery only **suggests** comparators — it does not auto-run generation. The frontend must copy accepted suggestions into `PUT /selections` → `comparators`. Suggestions must be **specific drug names** (e.g. `Glipizide`), not drug classes (e.g. `Sulfonylureas`), because label download searches EMA/DailyMed by exact drug name. If the model returns classes, edit them in the UI before saving selections.

**POST** `/api/v1/reports/{report_id}/discovery/clinical-articles` — no body

```json
{
  "report_id": "f7e03378-0f0b-42b1-acc1-c947c6ed55fb",
  "total": 8,
  "candidates": [
    {
      "pmid": "35133415",
      "pmcid": "PMC8826179",
      "title": "Effect of Subcutaneous Tirzepatide vs Placebo...",
      "authors": ["Dahl D", "Onishi Y"],
      "journal": "JAMA",
      "year": "2022",
      "doi": "10.1001/jama.2022.0078",
      "abstract": "...",
      "original_rank": 3,
      "relevance_score": 94.4,
      "relevance_confidence": 0.96,
      "relevance_breakdown": {
        "drug": 100.0,
        "disease": 95.0,
        "study_type": 85.0
      },
      "relevance_criteria": {
        "drug": {
          "match_percent": 100.0,
          "label": "Exact",
          "points": 30.0,
          "max_points": 30.0
        },
        "disease": {
          "match_percent": 95.0,
          "label": "Strong",
          "points": 28.5,
          "max_points": 30.0
        },
        "study_type": {
          "match_percent": 85.0,
          "label": "Strong",
          "points": 17.0,
          "max_points": 20.0
        }
      },
      "relevance_reason": "Direct study of the target drug and disease in the requested study type.",
      "relevance_model": "gpt-4o-mini",
      "relevance_version": "3"
    }
  ]
}
```

**POST** `/api/v1/reports/{report_id}/discovery/economic-articles` — same shape as clinical.

Candidates are returned in descending `relevance_score`; ties retain PubMed order. `original_rank`
is the pre-reranking PubMed position. The breakdown contains only active criteria and each value is
an independent 0–100 match percentage; breakdown values are not additive. `relevance_criteria`
provides the same match percentage with an `Exact`, `Strong`, `Partial`, `Weak`, or `Mismatch`
label plus weighted `points` / `max_points`. The final score is the earned points divided by the
maximum points across active criteria, normalized to 100. A scorer failure keeps the candidate,
sets relevance fields such as `relevance_score` to `null`, and places it after scored candidates.

**Frontend use:** show the normalized score and reason in article cards. In expanded details, show
each criterion as, for example, `Disease: Strong — 28.5/30 points (95% match)`. Use `original_rank`
for traceability. Do not hide a candidate solely because its score is low or missing; selection
remains a user decision.

#### Upload and verify an article

After discovery and before saving selections, a user can attach a PDF to any PMID or PMCID,
including an abstract-only discovery result or an ID that was not returned by discovery.
Verification is deterministic (title, publication year, and author overlap); it does not use AI
and never prevents the user from selecting the upload. Uploading verifies and stores the file; it
does **not** select it. The later `PUT /selections` request must include both the article ID and the
returned `upload_id`.

**POST** `/api/v1/reports/{report_id}/articles/upload` — multipart form-data

| Field | Type | Notes |
|-------|------|-------|
| `file` | file | Required; PDF only, max 20 MB |
| `bucket` | text | Required; `clinical` or `economic` |
| `pmid` | text | Optional when `pmcid` is supplied |
| `pmcid` | text | Optional when `pmid` is supplied |

Use the exact path segment **`articles`** (plural). In Postman choose **Body → form-data**, change
the `file` row type from **Text** to **File**, and select the PDF. Leave the `bucket`, `pmid`, and
`pmcid` rows as Text. Do not manually set `Content-Type`; Postman must generate the multipart
boundary.

The response has an `upload_id`, resolved IDs, extracted PubMed/PDF fields, field scores, and one
of four statuses: `match_good`, `match_poor`, `not_found`, or `low_quality`. A scanned or
image-only file normally returns `low_quality` with `PDF quality too low to evaluate`. The PDF is
retained in every status so the user may accept the warning and use it.

| Status | Meaning | Frontend behavior |
|--------|---------|-------------------|
| `match_good` | PDF title, year, and authors adequately match PubMed | Show verified; warning acceptance is not required |
| `match_poor` | PubMed exists, but one or more PDF fields do not match sufficiently | Show fields/scores and require explicit “use anyway” confirmation |
| `not_found` | The supplied PMID/PMCID did not resolve to a PubMed paper | Warn and require explicit “use anyway” confirmation |
| `low_quality` | PDF has too little extractable text for evaluation (often image-only) | Warn that generation may receive little/no text; require explicit confirmation |

```json
{
  "upload_id": "59cb5123-cedd-4497-b8c1-60e87ce55e0b",
  "pmid": "31535829",
  "pmcid": "",
  "bucket": "clinical",
  "status": "match_good",
  "message": "The uploaded PDF matches the PubMed record.",
  "scores": {"title": 0.98, "year": 1.0, "authors": 0.75, "abstract": null}
}
```

The original PDF and verification record are stored under the report. Re-uploading creates a new
`upload_id`; use the newest desired upload in selections. Uploads are rejected with `409` while the
report is queued or processing. Invalid/missing multipart fields return `400`; oversized files
return `413`.

---

#### Custom sections (optional)

Users can add one or more AI-written dossier sections beyond the built-in set. On Continue/Upload, the backend calls a lightweight model (`gpt-4o-mini` by default) to turn the prompt and/or template into **generation guidelines**. Only **ready** customs are stored and listed. Failed guideline attempts are **not persisted** (HTTP error only).

At generate time, a single `custom_sections_agent` node writes each selected custom section **sequentially**, using the full report context plus those guidelines.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/reports/{report_id}/custom-sections` | Create or replace; runs guideline generation (sync) |
| `GET` | `/api/v1/reports/{report_id}/custom-sections` | List ready specs only (no file bytes) |
| `PATCH` | `/api/v1/reports/{report_id}/custom-sections/{custom_id}` | Rename / enable / sort order (no LLM) |
| `DELETE` | `/api/v1/reports/{report_id}/custom-sections/{custom_id}` | Remove spec + template files; strip from `section_types` |

**Header (required on POST):** `X-Custom-Section-Mode: prompt | file | both`

**Prompt mode** — JSON body:

```http
POST /api/v1/reports/{report_id}/custom-sections
X-Custom-Section-Mode: prompt
Content-Type: application/json
```

```json
{
  "title": "GCC Reimbursement Landscape",
  "prompt": "Create guidelines for an HTA dossier section on tirzepatide in GCC markets.\n\nRequired outline:\n1. Scope and market definition\n2. National formulary / reimbursement pathways\n3. Payer/HTA evidence expectations\n4. Access barriers\n5. Implications for hospital P&T\n6. Evidence gaps\n\nTone: payer-focused, neutral. Do not invent listing decisions.",
  "custom_id": null
}
```

Omit `custom_id` to create; pass an existing id to replace.

**File mode** — multipart form-data (`title`, `file`; optional `prompt` is treated as both):

```http
POST /api/v1/reports/{report_id}/custom-sections
X-Custom-Section-Mode: file
```

| Field | Type | Notes |
|-------|------|--------|
| `title` | text | Required |
| `file` | file | `.pdf` or `.docx` only (max 20 MB) |
| `custom_id` | text | Optional; replace existing |
| `prompt` | text | Optional analyst notes |

**Both mode** — same multipart fields; `title`, `file`, and non-empty `prompt` are all required. Header: `X-Custom-Section-Mode: both`.

**Success `200`** (abbreviated):

```json
{
  "section": {
    "custom_id": "532cc119-a115-4ea8-8145-df44a3174a2a",
    "title": "GCC Reimbursement Landscape",
    "source_mode": "prompt",
    "guidelines_status": "ready",
    "guidelines": {
      "objective": "...",
      "outline": ["Scope and market definition", "..."],
      "style_notes": "...",
      "must_include": ["..."],
      "must_avoid": ["..."]
    },
    "enabled": true
  }
}
```

**Insufficient input `422`:** if the model judges the prompt/template too vague, the API returns a short AI reason in `detail` and **does not store** the section. Example:

```json
{
  "detail": "The given template cannot be used to create this custom section due to a lack of structured outline or format to organize the information appropriately."
}
```

Give a concrete subsection outline in the prompt (or a structured DOCX/PDF) to get `ready` guidelines.

**PATCH** (metadata only — no guideline regeneration):

```json
{ "title": "GCC Payer Landscape", "enabled": true, "sort_order": 2 }
```

Setting `enabled: false` also removes `custom:<id>` from `section_types`; re-enabling appends it if missing.

**Include customs in the report outline** via `PUT /selections` using tokens `custom:<custom_id>` in `section_types` (order = report order). Every such token must exist as a **ready** custom on the report. Client-supplied `custom_sections` in the selections body are **ignored** — specs are owned by the custom-sections CRUD APIs.

---

#### Selections

**PUT** `/api/v1/reports/{report_id}/selections`

```json
{
  "comparators": ["Glipizide", "Sitagliptin"],
  "custom_comparators": ["Empagliflozin"],
  "clinical_pmcids": ["PMC8826179", "PMC9829320"],
  "economic_pmcids": ["PMC10742594", "PMC10396055"],
  "article_uploads": [
    {
      "upload_id": "59cb5123-cedd-4497-b8c1-60e87ce55e0b",
      "pmid": "",
      "pmcid": "PMC8826179",
      "bucket": "clinical",
      "match_status": "match_good",
      "accepted_warning": false,
      "replace_existing": false
    }
  ],
  "section_types": [
    "disease", "clinical", "economic", "critical_appraisal", "drug", "hta",
    "comparator", "environmental", "compliance",
    "custom:532cc119-a115-4ea8-8145-df44a3174a2a",
    "executive"
  ]
}
```

`comparators` and `custom_comparators` are merged into one comparator list for label download and the comparator agent. Use `custom_comparators` for free-text drug names the user types that were not in discovery suggestions.

Custom section tokens look like `custom:<uuid>` and must already exist with `guidelines_status: "ready"` (create them with `POST .../custom-sections` first). Unknown or missing custom tokens return `400`.

**PubMed PMCID behavior (API):**

| `clinical_pmcids` / `economic_pmcids` | Download phase behavior |
|---------------------------------------|-------------------------|
| Non-empty list | Download **only** those PMCIDs into `pubmed/` or `economic/` |
| Empty list `[]` | **Skip** PubMed download for that section |
| *(CLI only)* omitted / `null` | Legacy filter-based PubMed search (`main_local.py`) |

The API always stores PMCID arrays on the report (default `[]`), so the typical flow is: run discovery → let the user pick papers → `PUT /selections` with chosen PMCIDs. If you save empty PMCID arrays, generate will not fall back to filter search.

Each `article_uploads` entry must reference an upload created on the same report, and its resolved
PMCID (or PMID when no PMCID exists) must appear in the matching selection list. Set
`accepted_warning: true` for `match_poor`, `not_found`, or `low_quality` uploads. Repository full
text is retained by default; set `replace_existing: true` to explicitly use the uploaded PDF
instead. When repository full text cannot be fetched, the selected upload is used automatically.

| Selection flag | Meaning |
|----------------|---------|
| `accepted_warning` | `false` for a verified (`match_good`) PDF. Set `true` only when the user saw a `match_poor`, `not_found`, or `low_quality` warning and chose “use anyway”; otherwise selections returns `400`. |
| `replace_existing` | `false` prefers available PMC full text and uses the upload when only an abstract/fallback is available. `true` forces the uploaded PDF to replace available PMC full text. |

The `upload_id`, resolved IDs, bucket, and match status must be copied from the upload response
unchanged. Supplying only the PMID/PMCID selects the normal PubMed/PMC source; it does **not**
automatically attach an uploaded PDF.

Response `200`:

```json
{
  "report_id": "f7e03378-0f0b-42b1-acc1-c947c6ed55fb",
  "status": "ready",
  "selections": { "comparators": ["Glipizide", "Sitagliptin"], "...": "..." },
  "warnings": []
}
```

`warnings` may flag section dependency issues (e.g. executive without core sections).

---

#### Generate (async)

**POST** `/api/v1/reports/{report_id}/generate`

```json
{
  "force_regenerate": false,
  "idempotency_key": "metformin-run-1"
}
```

Response `202`:

```json
{
  "job_id": "7089c4bf-f8c2-45eb-9974-57653f4d67d0",
  "report_id": "f7e03378-0f0b-42b1-acc1-c947c6ed55fb",
  "job_status": "queued",
  "report_status": "queued",
  "sections": [
    {
      "section_id": "5effe4da-5c73-4dec-bdc6-50994a691bf1",
      "section_type": "disease",
      "display_name": "Disease Overview",
      "status": "pending",
      "depends_on": []
    }
  ],
  "poll_urls": { "status": "/api/v1/reports/f7e03378-0f0b-42b1-acc1-c947c6ed55fb/status" }
}
```

Requires Celery **worker** container. Full Metformin run typically takes **15–45+ minutes**.

When any report calculator is saved in selections, the economic section may be
generated with an empty `economic_pmcids` list. Generation recomputes only the
saved modules and places their tables, scenarios, sensitivity results, and
charts in Economic Evidence. Legacy paired report inputs and
`advanced_filters.cost_analysis` are not rerun.

---

#### Status (poll)

**GET** `/api/v1/reports/{report_id}/status`

While running:

```json
{
  "report_status": "processing",
  "job_status": "processing",
  "phase": "agents",
  "progress": {
    "total_sections": 10,
    "completed_sections": 3,
    "failed_sections": 0,
    "current_section_type": "clinical"
  },
  "sections": [
    { "section_type": "disease", "status": "completed", "section_id": "..." },
    { "section_type": "clinical", "status": "processing", "section_id": "..." }
  ]
}
```

On failure:

```json
{
  "report_status": "failed",
  "status_reason": "Error code: 429 - ... insufficient_quota ...",
  "job_status": "failed",
  "sections": [
    { "section_type": "disease", "status": "failed", "error": "Error code: 429 ..." }
  ]
}
```

On success:

```json
{
  "report_status": "completed",
  "job_status": "completed",
  "artifacts": {
    "master_state_path": "/data/reports/.../exports/Metformin_Master_State.json",
    "markdown_path": "/data/reports/.../exports/Metformin_Full_Report.md",
    "pdf_path": null
  }
}
```

---

#### Section content

**GET** `/api/v1/reports/{report_id}/sections/{section_id}`

Available when `status` is `completed` or `partially_completed`. Returns `409` while `pending` or `running`.

Content shape: `{ "raw": <agent JSON>, "blocks": [<render blocks>] }`. **Render `content.blocks`** — see [docs/frontend-section-blocks.md](docs/frontend-section-blocks.md) for statuses, block types, and UI patterns.

```json
{
  "section_id": "5effe4da-5c73-4dec-bdc6-50994a691bf1",
  "section_type": "clinical",
  "display_name": "Clinical Evidence",
  "status": "completed",
  "pending_context": [],
  "content": {
    "raw": { "trials_summarized": [] },
    "blocks": [
      { "type": "heading", "level": 2, "text": "Clinical Evidence" },
      { "type": "table", "columns": ["Attribute", "Study A"], "rows": [["Evidence Role", "primary"]] }
    ]
  }
}
```

##### Verification metadata in section responses

Verification is attached to `content.raw`; `content.blocks` remains the normal renderable report.
The common verification payload is:

```json
{
  "stage": "clinical_claim_verification",
  "model": "gpt-4o-mini",
  "version": "1",
  "total_claims": 12,
  "counts": {
    "supported": 8,
    "partially_supported": 1,
    "contradicted": 1,
    "not_found": 1,
    "unverifiable": 1
  },
  "claims": [
    {
      "claim_id": "clinical:8e75849c42de4551",
      "domain": "clinical",
      "subject_id": "Study A",
      "location": "trials_summarized.0.primary_results.0",
      "field": "primary_results",
      "claim_text": "At week 24, response was 37%.",
      "current_value": "At week 24, response was 37%.",
      "decision_index": null,
      "status": "supported",
      "confidence": 0.97,
      "source_file": "PMC8826179.md",
      "source_passage": "At week 24, response was observed in 37% of patients...",
      "source_section": "Results",
      "char_start": 12480,
      "char_end": 13210,
      "reason": "The value, population, treatment arm, outcome and timepoint match.",
      "suggested_value": "",
      "suggested_claim": "",
      "model": "gpt-4o-mini",
      "version": "1"
    }
  ]
}
```

The three section response shapes are:

```json
{
  "clinical": {
    "content": {
      "raw": {
        "trials_summarized": [],
        "claim_verification": {
          "stage": "clinical_claim_verification",
          "total_claims": 12,
          "counts": {},
          "claims": []
        }
      }
    }
  },
  "economic": {
    "content": {
      "raw": {
        "studies_summarized": [],
        "claim_verification": {
          "economic": {
            "stage": "economic_claim_verification",
            "total_claims": 7,
            "counts": {},
            "claims": []
          },
          "bia": {
            "stage": "bia_claim_verification",
            "total_claims": 4,
            "counts": {},
            "claims": []
          }
        }
      }
    }
  },
  "hta": {
    "content": {
      "raw": {
        "decisions": [],
        "overall_hta_synthesis": "...",
        "sources_used": [],
        "claim_verification": {
          "stage": "hta_claim_verification",
          "total_claims": 9,
          "counts": {},
          "claims": []
        }
      }
    }
  }
}
```

The wrapper above illustrates the three alternatives; each actual `GET /sections/{section_id}`
response returns one section, not all three together. Every non-abbreviated verification payload
also includes `model` and `version`, and `counts` always contains all five statuses.

For HTA decision claims, `decision_index` points to `content.raw.decisions[decision_index]` and
`field` names the property to annotate. For clinical/economic/BIA claims, use `location` to locate
the row and `field` to locate the cell; a field can have multiple sentence-level claims, so retain
an array per UI cell.

---

#### Inline editing & AI rewrite (post-generation)

After a report is `completed`, analysts can edit section text in place and optionally rewrite highlighted spans with AI. Full Postman flows, presets, and error codes: **[docs/inline_editing_api.md](docs/inline_editing_api.md)** (preset copy: [docs/inline_editing_prompts.md](docs/inline_editing_prompts.md)).

| Concept | Behavior |
|---------|----------|
| Editable document | Versioned blocks with stable `block_id`s (`editable_documents`) |
| Changelog | Append-only revisions (`section_changes`); restore creates a **new** revision |
| Rewrite preview | Non-mutating suggestion; FE applies locally, then Save |
| Save | PUT persists blocks, recompiles edited markdown overlays on the canonical full report, marks PDF/PPTX stale |
| `client_op_id` | Must be **unique per save** — reuse → `409 duplicate_client_op_id` |
| Inactive sections | After regen, old `section_id`s → `409 inactive_section` (use IDs from current report) |

Typical FE flow: `GET editable-document` → optional `POST rewrite-previews` → `PUT editable-document` → `POST export/pdf` and/or `POST export/pptx`.

---

#### PDF export (on demand — always rebuild)

**Every** `POST` queues a **fresh** PDF from the latest report content (canonical `*_Full_Report.md`, or `*_Edited_Report.md` when edits exist). It never returns a cached “already generated” PDF.

**POST** `/api/v1/reports/{report_id}/export/pdf` — only when `report_status: completed`

For a standard export, send the request without a body and omit `X-Premium-User` (or set it to
`false`).

For a branded premium export:

- Set header `X-Premium-User: true`.
- Use `multipart/form-data` with a file field named `logo`.
- The filename must end in `.png`, the decoded file must be a valid PNG, and the upload must be
  10 MB or smaller.
- The image is normalized so its longest side is at most 512 px while preserving its aspect ratio
  and transparency.
- The logo is placed 10 mm from the top-left: within a 42 mm box on page 1 and an 18 mm box on all
  later pages. It is overlaid after rendering, so report pagination and content layout do not move.
- The logo applies only to this export request. It is not retained as report configuration; attach
  it again for each premium export.

Postman setup:

1. Choose **Body → form-data**.
2. Add key `logo`, change its type from **Text** to **File**, and select the PNG.
3. Add header `X-Premium-User` with value `true`.
4. Do not manually set `Content-Type`; Postman must generate the multipart boundary.

Equivalent `curl` request:

```bash
curl -X POST \
  -H "X-Premium-User: true" \
  -F "logo=@/path/to/logo.png;type=image/png" \
  "http://localhost:8000/api/v1/reports/{report_id}/export/pdf"
```

```json
{
  "report_id": "f7e03378-0f0b-42b1-acc1-c947c6ed55fb",
  "status": "queued",
  "celery_task_id": "4a52b512-...",
  "message": "PDF export queued"
}
```

Premium validation errors:

- `400` when the premium header is true but `logo` is missing.
- `400` when a logo is attached without `X-Premium-User: true`.
- `400` when the filename/content is not a readable PNG.
- `413` when the uploaded logo exceeds 10 MB.
- `409` when the report is not completed or its Markdown artifact is unavailable.
- `503` when no PDF-export Celery worker is reachable.

**GET** `/api/v1/reports/{report_id}/export/pdf` — download PDF (`Content-Type: application/pdf`)

- `200` when the on-disk PDF matches the latest content revision  
- `409` if stale after edits or still rebuilding — retry until ready  
- `404` if no PDF exists yet  

---

#### PPTX export (on demand — always rebuild)

PPTX export runs Pass 1/2 slide generation plus always-on Pass 3 narration. The downloaded PPTX contains embedded ElevenLabs MP3 voiceovers and speaker notes; narration skips cover, overview, section-divider, and sources slides. It is not auto-run after report generation — queue only when the report is `completed` and a markdown artifact exists. Uses a dedicated `presentation_jobs` collection with pollable phases (`queued` → `pass1` → `pass2` → `render` → `voiceover` → `tts` → `done`). `OPENAI_API_KEY` and `ELEVENLABS_API_KEY` must both be available to the Celery worker. macOS workers with Microsoft PowerPoint also apply autoplay on a best-effort basis; all workers return a PPTX with embedded audio. Report status stays `completed` even if PPTX fails.

**Every** successful `POST` queues a **fresh** deck from the latest report/edited markdown (same content path as PDF). Cached “PPTX already generated” short-circuit is disabled. An active `queued`/`processing` job still returns `409` (or the same job when the same `idempotency_key` is reused while that job is active).

**POST** `/api/v1/reports/{report_id}/export/pptx` — enqueue PPTX job (`202`)

```json
{
  "force_regenerate": true,
  "idempotency_key": null
}
```

```json
{
  "job_id": "a1b2c3d4-...",
  "report_id": "0ec01d40-a63d-49bf-9275-007f2db66fb7",
  "job_status": "queued",
  "phase": "queued",
  "celery_task_id": "...",
  "poll_urls": {
    "status": "/api/v1/reports/0ec01d40-a63d-49bf-9275-007f2db66fb7/export/pptx/status",
    "download": "/api/v1/reports/0ec01d40-a63d-49bf-9275-007f2db66fb7/export/pptx"
  },
  "message": "PPTX export queued"
}
```

**GET** `/api/v1/reports/{report_id}/export/pptx/status` — poll until ready

```json
{
  "report_id": "0ec01d40-a63d-49bf-9275-007f2db66fb7",
  "job_id": "a1b2c3d4-...",
  "job_status": "processing",
  "phase": "pass1",
  "progress": { "percent": 15, "detail": "Extracting presentation content" },
  "error": null,
  "slide_count": null,
  "pptx_ready": false,
  "poll_urls": {
    "status": "/api/v1/reports/0ec01d40-a63d-49bf-9275-007f2db66fb7/export/pptx/status",
    "download": "/api/v1/reports/0ec01d40-a63d-49bf-9275-007f2db66fb7/export/pptx"
  }
}
```

When finished: `job_status: "completed"`, `phase: "done"`, `pptx_ready: true` (only when the deck matches the latest content revision), and `slide_count` set. Stale decks after edits never count as ready.

**GET** `/api/v1/reports/{report_id}/export/pptx` — download PPTX file

- `200` with `Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation`
- `409` if the export job is still `queued`/`processing`, **or** if the deck is stale after edits  
- `404` if no PPTX exists yet

Sidecar JSON (`*_manifest.json`, `*_content.json`, `*_slides.json`, `*_quality.json`, `*_voiceover.json`), the visual PPTX, and MP3s are written under the report `exports/` folder for ops/debug only — not exposed as API downloads.

---

#### Pharmaceutical calculators (standalone)

The standalone API is split into four **synchronous** endpoints. Each `POST` returns its final JSON result directly: there are no calculator jobs, status/result/markdown endpoints, persistence, artifacts, or Celery-worker dependency. All models reject unknown fields. Decimal values may be sent as JSON numbers and are returned as JSON numbers by FastAPI.

Cost Analysis and Budget Impact are independent. Dosing output may be copied into Cost Analysis, and Cost Analysis output may be copied into BIA, but neither endpoint invokes or requires another endpoint.

##### Dosing

**POST** `/api/v1/calculators/dosing`

```json
{
  "unit_cost": 125,
  "unit_size": 50,
  "dose": 10,
  "times_per_day": 2,
  "days_per_year": 365,
  "dose_type": "weight_based",
  "patient_weight": 70,
  "wastage_percent": 5
}
```

```json
{
  "dose_per_administration": 700.0000,
  "actual_dose_per_day": 1400.0000,
  "units_per_administration": 14.0000,
  "annual_units_before_wastage": 10220.0000,
  "annual_units": 10731.0000,
  "annual_drug_cost": 1341375.00
}
```

`dose_per_administration = dose × patient_weight` for `weight_based`, otherwise `dose`; `actual_dose_per_day = dose_per_administration × times_per_day`; `units_per_administration = dose_per_administration / unit_size`; `annual_units_before_wastage = units_per_administration × times_per_day × days_per_year`; `annual_units = annual_units_before_wastage × (1 + wastage_percent/100)`; `annual_drug_cost = annual_units × unit_cost`. Units remain fractional; the engine does not round up packs or vials. Quantities round half-up to four decimals and money to two.

Validation: `unit_cost >= 0`; `unit_size`, `dose`, `times_per_day`, and `days_per_year` are positive; `days_per_year <= 366`; `wastage_percent` is 0–100; `dose_type` is `fixed` or `weight_based`; and `patient_weight > 0` is required for weight-based dosing. The returned `actual_dose_per_day` is the true daily dose and includes frequency.

##### Cost Analysis

**POST** `/api/v1/calculators/cost-analysis`

```json
{
  "drug_name": "Examplexin",
  "indication": "Example disease",
  "dosage_form": "tablet",
  "drug_class": "Targeted therapy",
  "currency": "USD",
  "annual_costs": {
    "drug_acquisition": 48000, "administration": 1200, "monitoring": 800,
    "laboratory_diagnostics": 600, "outpatient_visits": 400,
    "adverse_event_management": 2000, "adverse_event_rate_percent": 10,
    "hospitalizations": 1500, "other_direct_costs": 300
  },
  "offsets": {"hospitalization_avoidance": 1000, "other_offsets": 250},
  "new_drug_patient_count": 100,
  "comparator": {
    "name": "Current standard of care", "annual_drug_cost": 30000,
    "administration_and_monitoring": 1500, "offsets": 500, "patient_count": 100
  }
}
```

```json
{
  "currency": "USD",
  "per_patient": {
    "annual_drug_cost": 48000.00, "expected_ae_cost": 200.00,
    "gross_annual_cost": 53000.00, "total_offsets": 1250.00,
    "net_annual_cost": 51750.00, "comparator_net_annual_cost": 31000.00,
    "per_patient_difference": 20750.00
  },
  "programme": {
    "new_drug_patients": 100, "comparator_patients": 100,
    "gross_programme_cost": 5300000.00, "net_programme_cost": 5175000.00,
    "total_annual_offsets": 125000.00,
    "comparator_programme_cost": 3100000.00, "programme_difference": 2075000.00
  },
  "component_table": [
    {"component": "Drug acquisition", "per_patient": 48000.00, "programme": 4800000.00, "percentage_of_net_programme": 92.75},
    {"component": "Expected adverse events", "per_patient": 200.00, "programme": 20000.00, "percentage_of_net_programme": 0.39},
    {"component": "Gross Total", "per_patient": 53000.00, "programme": 5300000.00, "percentage_of_net_programme": 102.42},
    {"component": "Hospitalization avoidance", "per_patient": -1000.00, "programme": -100000.00, "percentage_of_net_programme": -1.93},
    {"component": "Other offsets", "per_patient": -250.00, "programme": -25000.00, "percentage_of_net_programme": -0.48},
    {"component": "Net Annual Cost", "per_patient": 51750.00, "programme": 5175000.00, "percentage_of_net_programme": 100.00}
  ],
  "programme_table": [
    {"component": "Drug acquisition", "per_patient": 48000.00, "programme": 4800000.00, "percentage_of_net_programme": 92.75},
    {"component": "Total Offsets", "per_patient": -1250.00, "programme": -125000.00, "percentage_of_net_programme": -2.42},
    {"component": "Net Annual Cost", "per_patient": 51750.00, "programme": 5175000.00, "percentage_of_net_programme": 100.00}
  ],
  "comparison_table": [
    {"component": "Drug Acquisition", "new_treatment_per_patient": 48000.00, "comparator_per_patient": 30000.00, "per_patient_difference": 18000.00, "new_treatment_programme": 4800000.00, "comparator_programme": 3000000.00, "programme_difference": 1800000.00},
    {"component": "Net Total", "new_treatment_per_patient": 51750.00, "comparator_per_patient": 31000.00, "per_patient_difference": 20750.00, "new_treatment_programme": 5175000.00, "comparator_programme": 3100000.00, "programme_difference": 2075000.00}
  ],
  "programme_comparison": {
    "title": "Examplexin (100 pts) vs Current standard of care (100 pts)",
    "new_treatment_name": "Examplexin",
    "new_treatment_patients": 100,
    "comparator_name": "Current standard of care",
    "comparator_patients": 100,
    "rows": [
      {"component": "Drug Acquisition", "new_treatment_per_patient": 48000.00, "comparator_per_patient": 30000.00, "per_patient_difference": 18000.00, "new_treatment_programme": 4800000.00, "comparator_programme": 3000000.00, "programme_difference": 1800000.00},
      {"component": "Net Total", "new_treatment_per_patient": 51750.00, "comparator_per_patient": 31000.00, "per_patient_difference": 20750.00, "new_treatment_programme": 5175000.00, "comparator_programme": 3100000.00, "programme_difference": 2075000.00}
    ]
  },
  "component_chart": {
    "chart_type": "doughnut", "title": "Per-patient cost components",
    "categories": ["Drug acquisition", "Administration", "Monitoring", "Laboratory/diagnostics", "Outpatient visits", "Expected adverse events", "Hospitalizations", "Other direct costs"],
    "series": [{"name": "Cost", "values": [48000, 1200, 800, 600, 400, 200, 1500, 300]}]
  },
  "comparison_chart": {
    "chart_type": "bar", "title": "Annual cost comparison",
    "categories": ["Examplexin", "Current standard of care"],
    "series": [{"name": "Per-patient net cost", "values": [51750, 31000]}]
  }
}
```

The example abbreviates repetitive table rows; the response always includes one row for every component plus totals and offsets. `expected_ae_cost = adverse_event_management × adverse_event_rate_percent/100`; gross cost is the sum of acquisition and all positive components; `net = gross − offsets`; programme values multiply each new-treatment component by `new_drug_patient_count`. An optional comparator uses its own `patient_count`; omit it and comparator KPIs/tables/charts are `null`. Costs are non-negative inputs, percentages are 0–100, the new-drug count is positive, comparator count may be zero, and names/currency must be non-empty.

##### Budget Impact

**POST** `/api/v1/calculators/budget-impact`

```json
{
  "perspective": "Hospital payer", "time_horizon": 3,
  "drug_name": "Examplexin", "indication": "Example disease", "currency": "USD",
  "annual_drug_cost_per_patient": 50000,
  "administration_and_monitoring": 2500,
  "expected_ae_cost": 500, "offsets": 1000, "wastage_percent": 5,
  "current_treatment": {
    "name": "Current standard of care", "drug_price": 30000,
    "extra_care_cost": 1500, "savings": 500
  },
  "hospital_beds": 500, "bed_occupancy_percent": 80, "prevalence_percent": 10,
  "diagnosis_rate_percent": 80, "eligibility_percent": 50,
  "average_length_of_stay_days": 5, "annual_population_growth_percent": 2,
  "annual_inflation_percent": 3, "uptake_percent": [10, 25, 40],
  "conservative_uptake_multiplier": 0.6,
  "optimistic_uptake_multiplier": 1.4,
  "conservative_cost_increase_percent": 20,
  "optimistic_cost_decrease_percent": 15,
  "notes": "Illustrative local assumptions."
}
```

```json
{
  "currency": "USD", "perspective": "Hospital payer",
  "drug_name": "Examplexin", "indication": "Example disease",
  "current_treatment_name": "Current standard of care", "time_horizon": 3,
  "year_1_eligible_population": 1168, "final_year_new_treatment_patients": 486,
  "final_year_new_treatment_cost": 57819.05,
  "base_per_patient_costs": {"new_treatment": 54500.00, "current_treatment": 31000.00, "delta": 23500.00},
  "annual_budget_impact": [2749500.00, 7213090.00, 12116538.90],
  "cumulative_budget_impact": 22079128.90,
  "years": [
    {"year": 1, "eligible_population": 1168, "new_treatment_patients": 117, "current_treatment_patients": 1051, "uptake_percent": 10.00, "new_treatment_cost_per_patient": 54500.00, "current_treatment_cost_per_patient": 31000.00, "per_patient_delta": 23500.00, "baseline_spend": 36208000.00, "scenario_spend": 38957500.00, "annual_budget_impact": 2749500.00, "cumulative_budget_impact": 2749500.00},
    {"year": 2, "eligible_population": 1191, "new_treatment_patients": 298, "current_treatment_patients": 893, "uptake_percent": 25.00, "new_treatment_cost_per_patient": 56135.00, "current_treatment_cost_per_patient": 31930.00, "per_patient_delta": 24205.00, "baseline_spend": 38028630.00, "scenario_spend": 45241720.00, "annual_budget_impact": 7213090.00, "cumulative_budget_impact": 9962590.00},
    {"year": 3, "eligible_population": 1215, "new_treatment_patients": 486, "current_treatment_patients": 729, "uptake_percent": 40.00, "new_treatment_cost_per_patient": 57819.05, "current_treatment_cost_per_patient": 32887.90, "per_patient_delta": 24931.15, "baseline_spend": 39958798.50, "scenario_spend": 52075337.40, "annual_budget_impact": 12116538.90, "cumulative_budget_impact": 22079128.90}
  ],
  "scenarios": [
    {"name": "conservative", "annual_budget_impact": [2380000.00, 6268580.00, 10532615.20], "cumulative_budget_impact": 19181195.20},
    {"name": "base", "annual_budget_impact": [2749500.00, 7213090.00, 12116538.90], "cumulative_budget_impact": 22079128.90},
    {"name": "optimistic", "annual_budget_impact": [2562500.00, 6711093.75, 11272062.50], "cumulative_budget_impact": 20545656.25}
  ],
  "sensitivity": [
    {"parameter": "Drug acquisition cost", "low": 12213986.20, "base": 22079128.90, "high": 31944271.60, "impact_range": 19730285.40},
    {"parameter": "Uptake", "low": 15438231.00, "base": 22079128.90, "high": 28695821.80, "impact_range": 13257590.80}
  ],
  "assumptions": [
    {"name": "Perspective", "value": "Hospital payer"},
    {"name": "Time horizon", "value": "3 years"},
    {"name": "Population method", "value": "Occupied bed-days divided by average length of stay"},
    {"name": "Patient rounding", "value": "Whole patients, ROUND_HALF_UP"},
    {"name": "Discounting", "value": "None"},
    {"name": "Inflation", "value": "3% annually"}
  ],
  "chart_data": [
    {"chart_type": "bar", "title": "Baseline versus scenario spend", "categories": ["Year 1", "Year 2", "Year 3"], "series": [{"name": "Baseline", "values": [36208000, 38028630, 39958798.50]}, {"name": "Scenario", "values": [38957500, 45241720, 52075337.40]}]},
    {"chart_type": "bar", "title": "Annual incremental budget impact", "categories": ["Year 1", "Year 2", "Year 3"], "series": [{"name": "Budget impact", "values": [2749500, 7213090, 12116538.90]}]},
    {"chart_type": "line", "title": "Scenario comparison", "categories": ["Year 1", "Year 2", "Year 3"], "series": [{"name": "Conservative", "values": [2380000, 6268580, 10532615.20]}, {"name": "Base", "values": [2749500, 7213090, 12116538.90]}, {"name": "Optimistic", "values": [2562500, 6711093.75, 11272062.50]}]},
    {"chart_type": "tornado", "title": "One-way sensitivity", "categories": ["Drug acquisition cost", "Uptake", "Prevalence", "Eligibility", "Wastage", "Administration and monitoring", "Inflation", "Offsets", "AE cost"], "series": [{"name": "Low", "values": [12213986.20, 15438231.00]}, {"name": "High", "values": [31944271.60, 28695821.80]}]}
  ],
  "notes": "Illustrative local assumptions."
}
```

The example abbreviates the nine sensitivity values in each series, but every response includes all nine sorted by `impact_range`. Year 1 eligible population is `round(hospital_beds × occupancy × 365 / length_of_stay × prevalence × diagnosis × eligibility)`. Population grows annually; both treatment costs inflate annually. New-treatment cost is `acquisition × (1 + wastage) + extra_care + expected_AE − offsets`; current-treatment cost is `drug_price + extra_care − savings`. For each year, `new patients = round(eligible × uptake)`, baseline is all patients on current treatment, scenario is uptake on the new treatment plus the remainder on current treatment, and impact is scenario minus baseline.

BIA accepts **one** `current_treatment`. The only adoption input is `uptake_percent`; there are no current/future treatment-mix shares. `time_horizon` is 3 or 5 and uptake length must match it. Beds and length of stay are positive; percentages are 0–100 except growth/inflation, which allow -100–100; monetary inputs are non-negative. Output `chart_data` is directly consumable by chart clients.

##### Optional DailyMed suggestions

**POST** `/api/v1/calculators/dailymed-suggestions`

```json
{
  "drug": "metformin", "indication": "type 2 diabetes mellitus",
  "category": "Adult", "patient_weight": 70,
  "frequency": "twice daily", "duration": "12 months", "model": "gpt-5-nano"
}
```

```json
{
  "indication_match": "exact",
  "indication_match_note": "The requested indication matches the labeled use.",
  "matched_labeled_indication": "type 2 diabetes mellitus",
  "suggestions": {
    "indication": "type 2 diabetes mellitus", "dose": 500, "dose_type": "fixed",
    "patient_weight": null, "times_per_day": 2, "days_per_year": 365,
    "frequency": "twice daily", "route": "oral",
    "treatment_schedule": "500 mg orally twice daily with meals",
    "presentation": "500 mg tablet", "unit_size": 500
  },
  "source": {
    "set_id": "example-set-id", "title": "METFORMIN HYDROCHLORIDE tablet",
    "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=example-set-id",
    "section": "Indications and Usage; Dosage and Administration; How Supplied",
    "accessed_at": "2026-10-09T00:00:00+00:00"
  },
  "warnings": []
}
```

DailyMed is optional input assistance: it does not price drugs, calculate costs, overwrite user values, or block the other three calculators. The response is intentionally concise: match context, calculator-ready `suggestions`, source metadata, and warnings. `suggestions` is `null` when the label does not match the requested indication. Drug, indication, category, patient weight, frequency, and duration are required; strings must be non-empty and weight must be positive. The default model is `gpt-5-nano`.

If `OPENAI_API_KEY` is absent, the endpoint returns `503`:

```json
{"detail": {"category": "configuration", "message": "OPENAI_API_KEY is not configured"}}
```

DailyMed download and label-extraction failures return `502` with `category: "download"` or `"extraction"`:

```json
{"detail": {"category": "download", "message": "DailyMed download failed for metformin"}}
```

Ordinary request validation on all four endpoints returns FastAPI `422` details. The three deterministic arithmetic endpoints need neither OpenAI nor DailyMed.

##### Report calculator integration

Save optional `dosing`, `cost_analysis`, and `budget_impact` inputs with
`PUT /api/v1/reports/{report_id}/selections`. The report already owns the drug
and disease, so Cost Analysis and BIA do not repeat them. Inputs are validated
on save and recomputed during generation with the same deterministic engine as
the standalone calculators.

```json
{
  "section_types": ["economic"],
  "economic_pmcids": [],
  "dosing": {
    "unit_cost": 75000,
    "unit_size": 12,
    "dose": 12,
    "times_per_day": 0.0082,
    "days_per_year": 365
  },
  "cost_analysis": {
    "currency": "USD",
    "annual_costs": {
      "drug_acquisition": null,
      "administration": 100,
      "monitoring": 50
    },
    "new_drug_patient_count": 30
  },
  "budget_impact": {
    "perspective": "Payer",
    "time_horizon": 3,
    "currency": "USD",
    "annual_drug_cost_per_patient": null,
    "administration_and_monitoring": null,
    "expected_ae_cost": null,
    "offsets": null,
    "current_treatment": {"name": "Standard of care", "drug_price": 5000},
    "hospital_beds": 500,
    "bed_occupancy_percent": 80,
    "prevalence_percent": 10,
    "diagnosis_rate_percent": 80,
    "eligibility_percent": 50,
    "average_length_of_stay_days": 5,
    "uptake_percent": [10, 25, 40]
  }
}
```

Modules are independent and may be omitted. When a downstream field is `null`,
generation carries forward the corresponding upstream result; a numeric value
entered by the user always wins. Dosing may supply annual acquisition cost to
Cost Analysis. Cost Analysis may supply acquisition, administration/monitoring,
expected AE cost, and offsets to BIA.

Currency is a three-letter code and no conversion occurs. Unknown fields,
strings in numeric fields, invalid percentages, and horizon/uptake mismatches
return `422` when selections are saved.

Economic Evidence retains the published literature BIA table and adds only the
selected calculated subsections. Raw output is auditable:

```json
{
  "content": {
    "raw": {
      "calculated_dosing": {
        "status": "calculated",
        "inputs_used": {},
        "handoffs_applied": [],
        "warnings": [],
        "result": {}
      },
      "calculated_cost_analysis": {
        "status": "calculated",
        "inputs_used": {},
        "handoffs_applied": [
          "dosing.annual_drug_cost -> cost_analysis.annual_costs.drug_acquisition"
        ],
        "warnings": [],
        "result": {}
      },
      "calculated_budget_impact": {
        "status": "calculated",
        "inputs_used": {},
        "handoffs_applied": [],
        "warnings": [],
        "result": {}
      }
    }
  }
}
```

Old reports remain readable, but the removed paired report-time
`inputs.dosage` + `inputs.cost_analysis` path is not rerun. DailyMed suggestions
remain an explicit frontend action and are never called by report arithmetic.

##### Testing with Postman

Set `base_url` to `http://localhost:8000/api/v1`, choose one of the four `POST /calculators/...` routes, and send the corresponding example as raw JSON. Dosing, Cost Analysis, and BIA should return `200` immediately and require no API key or worker. DailyMed suggestions also return one final response, but require `OPENAI_API_KEY` and outbound DailyMed access. Interactive docs expose all four under the **calculators** tag.

---

### Frontend integration checklist

1. Optional: `POST /drugs/validate` on debounced drug input → show “Did you mean …?” when `accepted` is `false`  
2. `POST /reports` with drug, disease, filters  
3. Optional: discovery endpoints → show clinical/economic pickers, distinguish `full_text` from `abstract_only`, and display relevance score/reason without hiding low or unscored candidates
4. Optional article PDF: `POST /reports/{id}/articles/upload` with `file`, `bucket`, and PMID/PMCID → retain the returned `upload_id`, IDs, bucket, and status
   - `match_good`: show verified
   - `match_poor` / `not_found` / `low_quality`: show `message` and field scores; require an explicit “Use anyway” action
   - If a user re-uploads, replace the pending frontend entry with the new `upload_id`
5. Optional: `POST /custom-sections` (prompt / file / both) → on `422`, show AI reason and do not add to outline; on `200`, keep `custom_id`
6. `PUT /selections` with comparators, article IDs, section types, and selected `article_uploads`
   - Keep every uploaded paper’s resolved PMCID (or PMID) in its matching `clinical_pmcids` / `economic_pmcids` array
   - Send `accepted_warning: true` only after “Use anyway”
   - Default `replace_existing: false`; expose an explicit “Use my PDF instead of available PMC full text” control to set it `true`
   - Include `custom:<id>` tokens for ready custom sections only
7. `POST /generate` → store `job_id` + `sections[]`
8. Poll `GET /status` every 3–5s; when a section is `completed` or `partially_completed`, `GET /sections/{id}`, render `content.blocks`, and read verification from `content.raw` (re-fetch clinical/economic/HTA after their verifier dependencies complete if shown early)
   - Clinical: `content.raw.claim_verification`
   - Economic/BIA: `content.raw.claim_verification.economic` and `.bia`
   - HTA: `content.raw.claim_verification`; map decision claims with `decision_index + field`
9. When `report_status: completed`, enable inline edit + Export PDF / Export PPTX. Selected uploads are already part of clinical/economic source folders and the evidence index used by grounded rewrite lookup.
10. Inline edit: `GET editable-document` → optional rewrite preview → `PUT` save (new `client_op_id` each time) → then export
11. For PDF: `POST /export/pdf` always rebuilds latest → retry `GET /export/pdf` until ready (not stale)
12. For PPTX: `POST /export/pptx` always rebuilds latest → poll `GET /export/pptx/status` until `pptx_ready` → `GET /export/pptx`
13. On generation `failed`, show `status_reason` + Retry (`POST /generate` with `force_regenerate: true`); use new `section_id`s after regen

Pipeline logs during generation appear in the **worker** container (`docker compose logs -f worker`), not the `web` container.

### Environment variables (backend)

See `.env.example`. Required for full pipeline:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | All agents + embeddings + comparator discovery + drug name validation + custom-section guidelines + PPTX export |
| `ENTREZ_EMAIL` | PubMed / PMC access |
| `NCBI_API_KEY` | Optional; higher PubMed rate limits |
| `WHO_ID` / `WHO_SECRET` | Optional; WHO ICD disease API |
| `MONGO_URI` | Set automatically in Docker Compose |
| `CELERY_BROKER_URL` | Redis — set automatically in Docker Compose |
| `DATA_ROOT` | `/data` in Docker — report artifacts volume |
| `CORS_ORIGINS` | Comma-separated allowed origins (default `*`) |

---

## PDF rendering

Renderer priority in `report_renderer.py`:

1. **WeasyPrint** — highest fidelity; requires system libraries (`brew install pango glib` on macOS)  
2. **Playwright / Chromium** — default fallback; reliable table layout  
3. **xhtml2pdf** — legacy fallback with injected column widths  
4. **PyMuPDF Story** — last resort  

---

## Project layout

```
LillyAI/
├── app/                    # FastAPI backend (routes, services, Celery tasks)
│   ├── routes/             # drugs, health, reports, editing
│   ├── schemas/            # Pydantic request/response models
│   └── services/           # Reports, discovery, editing, export, rewrite
├── docs/                   # API docs (inline_editing_api.md, prompts)
├── pipeline/               # Download + graph orchestration (extracted from main_local)
│   ├── drug_validation.py  # gpt-4o-mini drug name typo check (API)
│   ├── download_phase.py   # Phase 1 downloader orchestration
│   └── orchestrator.py     # Full pipeline entry for Celery
├── tests/                  # pytest (API, agents, downloaders)
├── main_local.py           # CLI harness (delegates to pipeline/)
├── downloaders/            # PubMed, DailyMed, EMA, HTA, disease APIs
├── agents/                 # LangGraph agent nodes
├── citation_registry.py    # Superscript reference numbering
├── report_compiler.py      # Multi-section Markdown assembly
├── report_renderer.py      # HTML + PDF generation
├── utils/                  # Shared helpers (pptx_from_report, presentation_pipeline, pptx_renderer)
├── templates/              # Jinja2 HTML + CSS for PDF
├── docker-compose.yml      # Local mongo + redis + web + worker
├── test_data/              # Downloaded evidence (per drug)
└── test_outputs/           # Generated reports (CLI)
```

### Running tests

Requires MongoDB for API integration tests (skipped automatically if unavailable).

```bash
pip install -r requirements.txt
pytest                          # all tests
pytest tests/test_drug_validation.py -v
pytest tests/test_api_crud.py -v  # report lifecycle (needs Mongo)
```

See [Critical Appraisal](#critical-appraisal) for section-specific tests and `scripts/render_critical_appraisal.py`.

---

## Evidence filters

`main_local.py` test cases pass an `advanced_filters` dict controlling PubMed queries:

- **time_range** — e.g. Last 10 Years  
- **clinical_types** — RCT, systematic review, etc.  
- **population** — Adult, Pediatric, etc.  
- **comparators** — Placebo, Standard of Care, etc.  
- **geography** — routes label download to EMA vs DailyMed  

Filter strings map to PubMed syntax in `downloaders/pubmed.py` (`FILTER_MAPPINGS`).

---

## Known limitations

- **HTA search** for established drugs like metformin often returns documents about *other* therapies that mention metformin incidentally; these are downloaded but flagged in Section 7.1 when title validation fails.  
- **Comparator labels** are only downloaded for user-specified comparator *drug names*, not drug classes (e.g. “Sulfonylureas”). AI-discovered comparators are suggestions only unless labels exist under `comparators/`.  
- **DailyMed** may still pick an atypical product when many labels match; gpt-4o-mini tie-breaking and INN→brand fallback reduce but do not eliminate ambiguity.  
- **API PubMed downloads** use user-selected PMCIDs from selections, not filter search — run discovery and save PMCIDs before generate, or clinical/economic sections may have no downloaded papers.  
- **Critical Appraisal** quality depends on downloaded source mix (full-text trials, SR/MA, HTA PDFs vs abstract-only stubs). Use `--skip-abstract-only` in `render_critical_appraisal.py` to exclude thin PubMed abstracts.  
- **Custom sections** need a concrete outline (or structured PDF/DOCX); vague prompts return `422` and are not stored. Only `custom:<id>` tokens for **ready** customs are valid in `PUT /selections`.  
- **Drug name validation** is advisory LLM guidance, not a regulatory spelling authority; users can proceed with the original string.  
- **PMC figures** may not download when NCBI blocks image URLs; full article text is still captured via Entrez XML.

---

## License

Internal / project use. See repository for license terms.
