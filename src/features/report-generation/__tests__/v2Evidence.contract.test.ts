import assert from "node:assert/strict";

import {
  articleDiscoveryResponseSchema,
  articleUploadResponseSchema,
  updateReportSelectionsInputSchema,
} from "../schemas/reportSchemas";
import type { Block, EditableBlock, WizardArticleUpload } from "../types";
import { buildSelectedArticleUploads } from "../utils/articleUploads";
import { getClaimVerificationGroups } from "../utils/claimVerification";
import {
  isTrailingSourceHeading,
  stripTrailingEditableSourceBlocks,
  stripTrailingSourceBlocks,
} from "../utils/viewerSectionContent";

const discovery = articleDiscoveryResponseSchema.parse({
  report_id: "report-1",
  total: 2,
  candidates: [
    {
      pmid: 35133415,
      pmcid: "PMC8826179",
      title: "Ranked study",
      authors: ["Dahl D"],
      journal: "JAMA",
      year: "2022",
      abstract: "Abstract",
      text_availability: "full_text",
      original_rank: 3,
      relevance_score: 94.4,
      relevance_confidence: 0.96,
      relevance_breakdown: { drug: 100, disease: 95, study_type: 85 },
      relevance_criteria: {
        drug: {
          match_percent: 100,
          label: "Exact",
          points: 30,
          max_points: 30,
        },
        disease: {
          match_percent: 95,
          label: "Strong",
          points: 28.5,
          max_points: 30,
        },
        study_type: {
          match_percent: 85,
          label: "Strong",
          points: 17,
          max_points: 20,
        },
      },
      relevance_reason: "Direct match.",
      relevance_model: "gpt-4o-mini",
      relevance_version: "3",
    },
    {
      pmid: "2",
      title: "Unscored study",
      authors: [],
      journal: "",
      year: 2020,
      abstract: "",
      relevance_score: null,
      relevance_criteria: null,
      relevance_reason: null,
    },
  ],
});
assert.equal(discovery.candidates[0]?.pmid, "35133415");
assert.equal(discovery.candidates[0]?.relevance_breakdown?.drug, 100);
assert.equal(
  discovery.candidates[0]?.relevance_criteria?.disease?.label,
  "Strong",
);
assert.equal(
  discovery.candidates[0]?.relevance_criteria?.disease?.points,
  28.5,
);
assert.equal(discovery.candidates[1]?.relevance_score, null);

const uploadResponse = articleUploadResponseSchema.parse({
  upload_id: "upload-1",
  pmid: "31535829",
  pmcid: "",
  bucket: "clinical",
  status: "match_good",
  message: "The uploaded PDF matches the PubMed record.",
  scores: { title: 0.98, year: 1, authors: 0.75, abstract: null },
  extracted_pdf_title: "A retained undocumented field",
});
assert.equal(uploadResponse.pmcid, "");
assert.equal(uploadResponse.extracted_pdf_title, "A retained undocumented field");

const selectedUpload: WizardArticleUpload = {
  upload_id: "upload-1",
  pmid: "31535829",
  pmcid: "",
  bucket: "clinical",
  match_status: "match_good",
  accepted_warning: false,
  replace_existing: false,
  fileName: "paper.pdf",
  message: "Verified",
  scores: { title: 0.98, year: 1, authors: 0.75, abstract: null },
};
assert.deepEqual(buildSelectedArticleUploads([selectedUpload], ["31535829"], []), [
  {
    upload_id: "upload-1",
    pmid: "31535829",
    pmcid: "",
    bucket: "clinical",
    match_status: "match_good",
    accepted_warning: false,
    replace_existing: false,
  },
]);
assert.deepEqual(buildSelectedArticleUploads([selectedUpload], [], []), []);
assert.equal(
  updateReportSelectionsInputSchema.safeParse({
    comparators: [],
    custom_comparators: [],
    clinical_pmcids: ["31535829"],
    economic_pmcids: [],
    article_uploads: buildSelectedArticleUploads(
      [selectedUpload],
      ["31535829"],
      [],
    ),
    section_types: ["clinical"],
  }).success,
  true,
);

const verification = {
  stage: "clinical_claim_verification",
  model: "gpt-4o-mini",
  version: "1",
  total_claims: 1,
  counts: {
    supported: 1,
    partially_supported: 0,
    contradicted: 0,
    not_found: 0,
    unverifiable: 0,
  },
  claims: [
    {
      claim_id: "clinical:1",
      domain: "clinical",
      subject_id: "Study A",
      location: "trials_summarized.0.primary_results.0",
      field: "primary_results",
      claim_text: "Response was 37%.",
      current_value: "37%",
      decision_index: null,
      status: "supported",
      confidence: 0.97,
      source_file: "PMC8826179.md",
      source_passage: "Response was observed in 37% of patients.",
      source_section: "Results",
      char_start: 1,
      char_end: 20,
      reason: "The value matches.",
      suggested_value: "",
      suggested_claim: "",
      model: "gpt-4o-mini",
      version: "1",
    },
  ],
};
assert.equal(
  getClaimVerificationGroups("clinical", {
    trials_summarized: [],
    claim_verification: verification,
  })[0]?.verification.claims[0]?.status,
  "supported",
);
assert.deepEqual(
  getClaimVerificationGroups("economic", {
    claim_verification: { economic: verification, bia: verification },
  }).map((group) => group.id),
  ["economic", "bia"],
);
assert.deepEqual(
  getClaimVerificationGroups("disease", { claim_verification: verification }),
  [],
);

const generatedBlocks: Block[] = [
  { type: "heading", level: 2, text: "Clinical Evidence" },
  { type: "paragraph", text: "Result was 37%.[^1]" },
  { type: "heading", level: 3, text: "Sources Used" },
  { type: "list", items: ["PMC8826179.md"] },
];
assert.deepEqual(stripTrailingSourceBlocks(generatedBlocks), [
  generatedBlocks[0],
  generatedBlocks[1],
]);
assert.equal(
  (stripTrailingSourceBlocks(generatedBlocks)[1] as { text: string }).text,
  "Result was 37%.[^1]",
);

const nonTrailingReferences: Block[] = [
  { type: "heading", level: 3, text: "References" },
  { type: "list", items: ["PMC1"] },
  { type: "heading", level: 3, text: "Conclusion" },
  { type: "paragraph", text: "Keep this." },
];
assert.equal(stripTrailingSourceBlocks(nonTrailingReferences).length, 4);
assert.equal(isTrailingSourceHeading("References"), true);
assert.equal(isTrailingSourceHeading("Evidence source assessment"), false);

const markdownBlocks: Block[] = [
  {
    type: "markdown",
    text: "## Findings\nSupported result.\n\n## Sources Used\n- PMC1.md",
  },
];
assert.equal(
  (stripTrailingSourceBlocks(markdownBlocks)[0] as { text: string }).text,
  "## Findings\nSupported result.",
);

const editableBlocks: EditableBlock[] = [
  {
    block_id: "p1",
    type: "paragraph",
    text: "Keep editable content.",
  },
  { block_id: "h1", type: "heading", level: 3, text: "Sources Used" },
  { block_id: "l1", type: "list", items: ["PMC1.md"] },
];
assert.deepEqual(
  stripTrailingEditableSourceBlocks(editableBlocks).map((block) => block.block_id),
  ["p1"],
);
assert.equal(editableBlocks.length, 3);
