import { z } from "zod";

import { PPTX_EXPORT_PHASES } from "../constants/pptxExport";

// Live GET /status: queued | pending | processing | completed | partially_completed | failed.
export const reportStatusSchema = z.enum([
  "queued",
  "pending",
  "processing",
  "completed",
  "partially_completed",
  "failed",
]);

// Mutation responses can still expose extra lifecycle states beyond GET /status.
const reportMutationStatusSchema = z.enum([
  ...reportStatusSchema.options,
  "draft",
  "ready",
  "generating",
]);

// Live Report Service contract: queued | processing | completed | failed.
// Do not add `cancelled` unless the upstream status endpoint confirms it.
export const jobStatusSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "failed",
]);

export const sectionStatusSchema = z.enum([
  "pending",
  "blocked",
  "running",
  "processing",
  "partially_completed",
  "completed",
  "failed",
]);

export const builtInSectionTypeSchema = z.enum([
  "disease",
  "clinical",
  "economic",
  "critical_appraisal",
  "drug",
  "hta",
  "comparator",
  "environmental",
  "compliance",
  "executive",
]);

/** `custom:<uuid>` tokens used in selections, status, and generated sections. */
export const customSectionTypeSchema = z.templateLiteral([
  "custom:",
  z.uuid(),
]);

export const sectionTypeSchema = z.union([
  builtInSectionTypeSchema,
  customSectionTypeSchema,
]);

export const textAvailabilitySchema = z.enum(["full_text", "abstract_only"]);

export const evidenceBucketSchema = z.enum(["clinical", "economic"]);

export const articleUploadStatusSchema = z.enum([
  "match_good",
  "match_poor",
  "not_found",
  "low_quality",
]);

/** Coerce discovery IDs (string or number) to a trimmed non-empty string. */
const requiredArticleIdSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .pipe(z.string().min(1));

/** Absent, null, or blank PMCID becomes undefined; otherwise a non-empty string. */
const optionalArticleIdSchema = z.preprocess((value) => {
  if (value == null || value === "") return undefined;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
}, z.string().min(1).optional());

/** Upload responses use an empty string when an identifier could not be resolved. */
const resolvedArticleIdSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim());

const relevanceCriterionSchema = z.object({
  match_percent: z.number(),
  label: z.enum(["Exact", "Strong", "Partial", "Weak", "Mismatch"]),
  points: z.number(),
  max_points: z.number(),
});

export const articleCandidateSchema = z.object({
  pmid: requiredArticleIdSchema,
  pmcid: optionalArticleIdSchema,
  title: z.string(),
  authors: z.array(z.string()),
  journal: z.string(),
  year: z.union([z.string(), z.number()]),
  doi: z.string().optional(),
  abstract: z.string(),
  text_availability: textAvailabilitySchema.optional(),
  pubmed_url: z.string().optional(),
  pmc_url: z.string().optional(),
  original_rank: z.number().int().positive().nullable().optional(),
  relevance_score: z.number().nullable().optional(),
  relevance_confidence: z.number().nullable().optional(),
  relevance_breakdown: z
    .record(z.string(), z.number())
    .nullable()
    .optional(),
  relevance_criteria: z
    .record(z.string(), relevanceCriterionSchema)
    .nullable()
    .optional(),
  relevance_reason: z.string().nullable().optional(),
  relevance_model: z.string().nullable().optional(),
  relevance_version: z.string().nullable().optional(),
});

export const articleUploadScoresSchema = z.object({
  title: z.number().nullable(),
  year: z.number().nullable(),
  authors: z.number().nullable(),
  abstract: z.number().nullable(),
});

/**
 * Known upload fields are validated while undocumented extracted metadata is
 * retained so newer backend fields remain available without blocking uploads.
 */
export const articleUploadResponseSchema = z.looseObject({
  upload_id: z.string().min(1),
  pmid: resolvedArticleIdSchema,
  pmcid: resolvedArticleIdSchema,
  bucket: evidenceBucketSchema,
  status: articleUploadStatusSchema,
  message: z.string(),
  scores: articleUploadScoresSchema,
});

export const articleUploadSelectionSchema = z.object({
  upload_id: z.string().min(1),
  pmid: z.string(),
  pmcid: z.string(),
  bucket: evidenceBucketSchema,
  match_status: articleUploadStatusSchema,
  accepted_warning: z.boolean(),
  replace_existing: z.boolean(),
});

export const wizardArticleUploadSchema = articleUploadSelectionSchema.extend({
  fileName: z.string(),
  message: z.string(),
  scores: articleUploadScoresSchema,
});

export const articleDiscoveryResponseSchema = z.object({
  report_id: z.string(),
  total: z.number(),
  candidates: z.array(articleCandidateSchema),
});

export const comparatorDiscoveryResponseSchema = z.object({
  report_id: z.string(),
  suggestions: z.array(z.string()),
});

export const customDateRangeSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export const costAnalysisSchema = z
  .object({
    patient_volume: z.number(),
    treatment_duration_days: z.number(),
    unit_price: z.number(),
    dosage_frequency: z.string(),
    region: z.string(),
  })
  .partial();

export const advancedFiltersSchema = z.object({
  time_range: z.string().optional(),
  custom_date_range: customDateRangeSchema.optional(),
  species_filter: z.string().optional(),
  clinical_types: z.array(z.string()).optional(),
  economic_types: z.array(z.string()).optional(),
  population: z.array(z.string()).optional(),
  outcomes: z.array(z.string()).optional(),
  comparators: z.array(z.string()).optional(),
  geography: z.array(z.string()).optional(),
  study_duration: z.string().optional(),
  quality_filters: z.array(z.string()).optional(),
  cost_analysis: costAnalysisSchema.optional(),
});

export const reportInputsSchema = z.object({
  pubmed_top_k_clinical: z.number().nullable().optional(),
  pubmed_top_k_economic: z.number().nullable().optional(),
  advanced_filters: advancedFiltersSchema.optional(),
});

export const createReportInputSchema = z.object({
  drug: z.string(),
  disease: z.string(),
  inputs: reportInputsSchema,
});

export const reportSelectionsSchema = z.object({
  comparators: z.array(z.string()),
  clinical_pmcids: z.array(z.string()),
  economic_pmcids: z.array(z.string()),
  article_uploads: z.array(articleUploadSelectionSchema).optional().default([]),
  section_types: z.array(sectionTypeSchema),
  dosing: z.lazy(() => reportDosingSelectionSchema).nullable().optional(),
  cost_analysis: z
    .lazy(() => reportCostAnalysisSelectionSchema)
    .nullable()
    .optional(),
  budget_impact: z
    .lazy(() => reportBudgetImpactSelectionSchema)
    .nullable()
    .optional(),
});

export const reportDiscoveryStateSchema = z.object({
  comparator_recommendations: z.array(z.string()).optional(),
  clinical_candidates: z.array(articleCandidateSchema).optional(),
  economic_candidates: z.array(articleCandidateSchema).optional(),
});

export const createReportResponseSchema = z.object({
  report_id: z.string(),
  drug: z.string(),
  disease: z.string(),
  status: reportMutationStatusSchema,
  inputs: reportInputsSchema,
  discovery: reportDiscoveryStateSchema.optional(),
  selections: reportSelectionsSchema.optional(),
  storage_root: z.string().optional(),
});

const reportCurrencySchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, "Use a three-letter currency code")
  .transform((value) => value.toUpperCase());

const nonNegativeFiniteNumberSchema = z.number().finite().nonnegative();
const positiveFiniteNumberSchema = z.number().finite().positive();
const percentageSchema = z.number().finite().min(0).max(100);

export const reportDosingSelectionSchema = z
  .object({
    unit_cost: nonNegativeFiniteNumberSchema,
    unit_size: positiveFiniteNumberSchema,
    dose: positiveFiniteNumberSchema,
    times_per_day: positiveFiniteNumberSchema,
    days_per_year: positiveFiniteNumberSchema.max(366),
    dose_type: z.enum(["fixed", "weight_based"]),
    patient_weight: positiveFiniteNumberSchema.nullable().optional(),
    wastage_percent: percentageSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.dose_type === "weight_based" && value.patient_weight == null) {
      context.addIssue({
        code: "custom",
        path: ["patient_weight"],
        message: "Patient weight is required for weight-based dosing",
      });
    }
  });

const reportAnnualCostsSelectionSchema = z
  .object({
    drug_acquisition: nonNegativeFiniteNumberSchema.nullable(),
    administration: nonNegativeFiniteNumberSchema,
    monitoring: nonNegativeFiniteNumberSchema,
    laboratory_diagnostics: nonNegativeFiniteNumberSchema,
    outpatient_visits: nonNegativeFiniteNumberSchema,
    adverse_event_management: nonNegativeFiniteNumberSchema,
    adverse_event_rate_percent: percentageSchema,
    hospitalizations: nonNegativeFiniteNumberSchema,
    other_direct_costs: nonNegativeFiniteNumberSchema,
  })
  .strict();

const reportOffsetsSelectionSchema = z
  .object({
    hospitalization_avoidance: nonNegativeFiniteNumberSchema,
    other_offsets: nonNegativeFiniteNumberSchema,
  })
  .strict();

const reportComparatorSelectionSchema = z
  .object({
    name: z.string().trim().min(1),
    annual_drug_cost: nonNegativeFiniteNumberSchema,
    administration_and_monitoring: nonNegativeFiniteNumberSchema,
    offsets: nonNegativeFiniteNumberSchema,
    patient_count: z.number().finite().int().nonnegative(),
  })
  .strict();

export const reportCostAnalysisSelectionSchema = z
  .object({
    currency: reportCurrencySchema,
    annual_costs: reportAnnualCostsSelectionSchema,
    offsets: reportOffsetsSelectionSchema,
    new_drug_patient_count: z.number().finite().int().positive(),
    comparator: reportComparatorSelectionSchema.nullable().optional(),
  })
  .strict();

const reportCurrentTreatmentSelectionSchema = z
  .object({
    name: z.string().trim().min(1),
    drug_price: nonNegativeFiniteNumberSchema,
    extra_care_cost: nonNegativeFiniteNumberSchema,
    savings: nonNegativeFiniteNumberSchema,
  })
  .strict();

export const reportBudgetImpactSelectionSchema = z
  .object({
    perspective: z.string().trim().min(1),
    time_horizon: z.union([z.literal(3), z.literal(5)]),
    currency: reportCurrencySchema,
    annual_drug_cost_per_patient: nonNegativeFiniteNumberSchema.nullable(),
    administration_and_monitoring: nonNegativeFiniteNumberSchema.nullable(),
    expected_ae_cost: nonNegativeFiniteNumberSchema.nullable(),
    offsets: nonNegativeFiniteNumberSchema.nullable(),
    wastage_percent: percentageSchema,
    current_treatment: reportCurrentTreatmentSelectionSchema,
    hospital_beds: z.number().finite().int().positive(),
    bed_occupancy_percent: percentageSchema,
    prevalence_percent: percentageSchema,
    diagnosis_rate_percent: percentageSchema,
    eligibility_percent: percentageSchema,
    average_length_of_stay_days: positiveFiniteNumberSchema,
    annual_population_growth_percent: z.number().finite().min(-100).max(100),
    annual_inflation_percent: z.number().finite().min(-100).max(100),
    uptake_percent: z.array(percentageSchema),
    conservative_uptake_multiplier: nonNegativeFiniteNumberSchema,
    optimistic_uptake_multiplier: nonNegativeFiniteNumberSchema,
    conservative_cost_increase_percent: percentageSchema,
    optimistic_cost_decrease_percent: percentageSchema,
    notes: z.string(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.uptake_percent.length !== value.time_horizon) {
      context.addIssue({
        code: "custom",
        path: ["uptake_percent"],
        message: `Enter exactly ${value.time_horizon} annual uptake values`,
      });
    }
  });

export const updateReportSelectionsInputSchema = z
  .object({
    comparators: z.array(z.string()),
    custom_comparators: z.array(z.string()),
    clinical_pmcids: z.array(z.string()),
    economic_pmcids: z.array(z.string()),
    article_uploads: z.array(articleUploadSelectionSchema),
    section_types: z.array(sectionTypeSchema),
    dosing: reportDosingSelectionSchema.optional(),
    cost_analysis: reportCostAnalysisSelectionSchema.optional(),
    budget_impact: reportBudgetImpactSelectionSchema.optional(),
  })
  .strict();

const reportSelectionResponseNumberFields = new Set([
  "unit_cost",
  "unit_size",
  "dose",
  "times_per_day",
  "days_per_year",
  "patient_weight",
  "wastage_percent",
  "drug_acquisition",
  "administration",
  "monitoring",
  "laboratory_diagnostics",
  "outpatient_visits",
  "adverse_event_management",
  "adverse_event_rate_percent",
  "hospitalizations",
  "other_direct_costs",
  "hospitalization_avoidance",
  "other_offsets",
  "new_drug_patient_count",
  "annual_drug_cost",
  "administration_and_monitoring",
  "offsets",
  "patient_count",
  "time_horizon",
  "annual_drug_cost_per_patient",
  "expected_ae_cost",
  "drug_price",
  "extra_care_cost",
  "savings",
  "hospital_beds",
  "bed_occupancy_percent",
  "prevalence_percent",
  "diagnosis_rate_percent",
  "eligibility_percent",
  "average_length_of_stay_days",
  "annual_population_growth_percent",
  "annual_inflation_percent",
  "uptake_percent",
  "conservative_uptake_multiplier",
  "optimistic_uptake_multiplier",
  "conservative_cost_increase_percent",
  "optimistic_cost_decrease_percent",
]);

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeReportSelectionResponseValue(
  value: unknown,
  fieldName?: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) =>
      normalizeReportSelectionResponseValue(item, fieldName),
    );
  }

  if (isUnknownRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        normalizeReportSelectionResponseValue(nestedValue, key),
      ]),
    );
  }

  if (
    typeof value === "string" &&
    fieldName !== undefined &&
    reportSelectionResponseNumberFields.has(fieldName) &&
    value.trim() !== ""
  ) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : value;
  }

  return value;
}

function normalizeReportSelectionsResponse(value: unknown): unknown {
  const normalized = normalizeReportSelectionResponseValue(value);
  if (!isUnknownRecord(normalized)) return normalized;

  const selections = { ...normalized };
  delete selections.custom_sections;

  // The service returns null for calculations that were not selected.
  // Normalize responses without relaxing validation of outgoing selections.
  for (const field of ["dosing", "cost_analysis", "budget_impact"] as const) {
    if (selections[field] === null) delete selections[field];
  }

  if (isUnknownRecord(selections.cost_analysis)) {
    const costAnalysis = { ...selections.cost_analysis };
    delete costAnalysis.dosage_form;
    delete costAnalysis.drug_class;
    selections.cost_analysis = costAnalysis;
  }

  return selections;
}

const updateReportSelectionsResponseSelectionsSchema = z.preprocess(
  normalizeReportSelectionsResponse,
  updateReportSelectionsInputSchema,
);

export const updateReportSelectionsResponseSchema = z.object({
  report_id: z.string(),
  status: reportMutationStatusSchema,
  selections: updateReportSelectionsResponseSelectionsSchema,
  warnings: z.array(z.string()),
});

export const generateReportInputSchema = z.object({
  force_regenerate: z.boolean(),
  idempotency_key: z.string(),
});

export const generateReportSectionSchema = z.object({
  section_id: z.string(),
  section_type: sectionTypeSchema,
  display_name: z.string(),
  sort_order: z.number().optional(),
  status: sectionStatusSchema,
  depends_on: z.array(z.string()).optional(),
  error: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  duration_ms: z.number().nullable().optional(),
});

export const generateReportResponseSchema = z.object({
  job_id: z.string(),
  report_id: z.string(),
  job_status: jobStatusSchema,
  report_status: reportMutationStatusSchema,
  sections: z.array(generateReportSectionSchema),
  poll_urls: z
    .object({
      status: z.string(),
    })
    .optional(),
});

export const reportProgressSchema = z.object({
  total_sections: z.number(),
  completed_sections: z.number(),
  failed_sections: z.number(),
  current_section_type: sectionTypeSchema.nullable().optional(),
});

export const reportStatusSectionSchema = z.object({
  section_type: sectionTypeSchema,
  status: sectionStatusSchema,
  section_id: z.string().optional(),
  display_name: z.string().optional(),
  sort_order: z.number().optional(),
  error: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  duration_ms: z.number().nullable().optional(),
  pending_context: z.array(z.string()).optional(),
});

export const reportArtifactsSchema = z.object({
  master_state_path: z.string().nullable().optional(),
  markdown_path: z.string().nullable().optional(),
  pdf_path: z.string().nullable().optional(),
});

export const reportStatusResponseSchema = z.object({
  report_status: reportStatusSchema,
  job_status: jobStatusSchema.optional(),
  status_reason: z.string().nullable().optional(),
  phase: z.string().optional(),
  progress: reportProgressSchema.optional(),
  sections: z.array(reportStatusSectionSchema).optional(),
  artifacts: reportArtifactsSchema.optional(),
  active_job_id: z.string().optional(),
});

export const headingBlockSchema = z.object({
  type: z.literal("heading"),
  level: z.number(),
  text: z.string(),
});

export const paragraphBlockSchema = z.object({
  type: z.literal("paragraph"),
  label: z.string().optional(),
  label_bold: z.boolean().optional(),
  text: z.string(),
});

export const tableCellSchema = z.union([z.string(), z.number().finite()]);

export const tableBlockSchema = z.object({
  type: z.literal("table"),
  columns: z.array(z.string()),
  rows: z.array(z.array(tableCellSchema)),
});

export const definitionBlockSchema = z.object({
  type: z.literal("definition"),
  label: z.string(),
  value: z.string(),
});

export const listBlockSchema = z.object({
  type: z.literal("list"),
  label: z.string().optional(),
  items: z.array(z.string()),
});

export const calloutBlockSchema = z.object({
  type: z.literal("callout"),
  level: z.enum(["info", "warning"]),
  text: z.string(),
});

export const markdownBlockSchema = z.object({
  type: z.literal("markdown"),
  text: z.string(),
});

export const chartSeriesSchema = z.object({
  name: z.string(),
  values: z.array(z.number().finite()),
});

export const chartBlockSchema = z.object({
  type: z.literal("chart"),
  chart_type: z.string().min(1),
  title: z.string(),
  categories: z.array(z.string()),
  series: z.array(chartSeriesSchema),
  currency: z.string().trim().min(1).optional(),
});

export type Block =
  | z.infer<typeof headingBlockSchema>
  | z.infer<typeof paragraphBlockSchema>
  | z.infer<typeof tableBlockSchema>
  | z.infer<typeof definitionBlockSchema>
  | z.infer<typeof listBlockSchema>
  | z.infer<typeof calloutBlockSchema>
  | z.infer<typeof markdownBlockSchema>
  | z.infer<typeof chartBlockSchema>
  | {
      type: "section";
      heading: string;
      level: number;
      blocks: Block[];
    };

export const blockSchema: z.ZodType<Block> = z.lazy(() =>
  z.discriminatedUnion("type", [
    headingBlockSchema,
    paragraphBlockSchema,
    tableBlockSchema,
    definitionBlockSchema,
    listBlockSchema,
    calloutBlockSchema,
    markdownBlockSchema,
    chartBlockSchema,
    z.object({
      type: z.literal("section"),
      heading: z.string(),
      level: z.number(),
      blocks: z.array(blockSchema),
    }),
  ]),
);

export const sectionBlockSchema = z.object({
  type: z.literal("section"),
  heading: z.string(),
  level: z.number(),
  blocks: z.array(blockSchema),
});

export const claimVerificationStatusSchema = z.enum([
  "supported",
  "partially_supported",
  "contradicted",
  "not_found",
  "unverifiable",
]);

export const claimVerificationCountsSchema = z.object({
  supported: z.number().int().nonnegative(),
  partially_supported: z.number().int().nonnegative(),
  contradicted: z.number().int().nonnegative(),
  not_found: z.number().int().nonnegative(),
  unverifiable: z.number().int().nonnegative(),
});

export const claimVerificationClaimSchema = z.object({
  claim_id: z.string().min(1),
  domain: z.string(),
  subject_id: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  field: z.string(),
  claim_text: z.string(),
  current_value: z.string().nullable().optional(),
  decision_index: z.number().int().nonnegative().nullable().optional(),
  status: claimVerificationStatusSchema,
  confidence: z.number().nullable().optional(),
  source_file: z.string().nullable().optional(),
  source_passage: z.string().nullable().optional(),
  source_section: z.string().nullable().optional(),
  char_start: z.number().int().nonnegative().nullable().optional(),
  char_end: z.number().int().nonnegative().nullable().optional(),
  reason: z.string().nullable().optional(),
  suggested_value: z.string().nullable().optional(),
  suggested_claim: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
});

export const claimVerificationPayloadSchema = z.object({
  stage: z.string(),
  model: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  total_claims: z.number().int().nonnegative(),
  counts: claimVerificationCountsSchema,
  claims: z.array(claimVerificationClaimSchema),
});

export const reportSectionContentSchema = z.object({
  raw: z.preprocess(
    (value) => (value == null ? undefined : value),
    z.record(z.string(), z.unknown()).optional(),
  ),
  blocks: z.array(blockSchema),
});

export const reportSectionResponseSchema = z.object({
  section_id: z.string(),
  section_type: sectionTypeSchema,
  display_name: z.string(),
  status: sectionStatusSchema,
  content: reportSectionContentSchema.optional(),
});

export const pdfExportResponseSchema = z.object({
  report_id: z.string(),
  status: z
    .enum(["queued", "processing", "completed", "failed", "ready"])
    .optional(),
  pdf_path: z.string().nullable().optional(),
  celery_task_id: z.string().nullable().optional(),
  message: z.string().optional(),
});

export const customSectionModeSchema = z.enum(["prompt", "file", "both"]);

export const customSectionGuidelinesSchema = z.object({
  objective: z.string().optional(),
  outline: z.array(z.string()).optional(),
  style_notes: z.string().optional(),
  must_include: z.array(z.string()).optional(),
  must_avoid: z.array(z.string()).optional(),
});

export const customSectionSpecSchema = z.object({
  custom_id: z.string().uuid(),
  title: z.string(),
  source_mode: customSectionModeSchema,
  guidelines_status: z.literal("ready"),
  enabled: z.boolean(),
  sort_order: z.number().optional(),
  guidelines: customSectionGuidelinesSchema.optional(),
});

export const customSectionResponseSchema = z.object({
  section: customSectionSpecSchema,
});

export const patchCustomSectionResponseSchema = z.union([
  customSectionResponseSchema,
  customSectionSpecSchema.transform((section) => ({ section })),
]);

export const listCustomSectionsResponseSchema = z
  .object({
    report_id: z.string().optional(),
    sections: z.array(customSectionSpecSchema).optional(),
    custom_sections: z.array(customSectionSpecSchema).optional(),
  })
  .transform((data) => ({
    report_id: data.report_id,
    sections: data.sections ?? data.custom_sections ?? [],
  }));

export const createCustomSectionPromptInputSchema = z.object({
  title: z.string(),
  prompt: z.string(),
  custom_id: z.string().uuid().nullable().optional(),
});

export const patchCustomSectionInputSchema = z.object({
  title: z.string().optional(),
  enabled: z.boolean().optional(),
  sort_order: z.number().optional(),
});

// Documented PPTX job phases, including always-on Pass 3 narration.
export const pptxExportPhaseSchema = z.enum(PPTX_EXPORT_PHASES);

export const pptxExportProgressSchema = z.object({
  percent: z.number().optional(),
  detail: z.string().optional(),
});

const pptxExportPollUrlsSchema = z.object({
  status: z.string(),
  download: z.string(),
});

export const queuePptxExportInputSchema = z.object({
  force_regenerate: z.boolean(),
  idempotency_key: z.string().nullable().optional(),
});

export const pptxExportQueueResponseSchema = z.object({
  job_id: z.string(),
  report_id: z.string(),
  job_status: jobStatusSchema,
  phase: pptxExportPhaseSchema.nullable().optional(),
  celery_task_id: z.string().nullable().optional(),
  poll_urls: pptxExportPollUrlsSchema.optional(),
  message: z.string().optional(),
  pptx_ready: z.boolean().optional(),
});

export const pptxExportStatusResponseSchema = z.object({
  report_id: z.string(),
  job_id: z.string().optional(),
  job_status: jobStatusSchema,
  phase: pptxExportPhaseSchema.nullable().optional(),
  progress: pptxExportProgressSchema.optional(),
  error: z.string().nullable().optional(),
  slide_count: z.number().nullable().optional(),
  pptx_ready: z.boolean(),
  poll_urls: pptxExportPollUrlsSchema.optional(),
});

export const drugValidationResponseSchema = z.object({
  input: z.string(),
  accepted: z.boolean(),
  suggestion: z.string().nullable(),
});

export const filterStateSchema = z.object({
  timeRange: z.string(),
  clinicalStudyTypes: z.array(z.string()),
  evidenceSynthesis: z.string(),
  specializedTrialStructures: z.string(),
  populationType: z.array(z.string()),
  studyDuration: z.string(),
  economicStudyTypes: z.array(z.string()),
  costPopulationType: z.string(),
  patientRange: z.string(),
  costPopulationTypeSecondary: z.string(),
  costStudyDuration: z.string(),
  outcomeEvidenceFocus: z.array(z.string()),
  evidenceQuality: z.array(z.string()),
  comparatorType: z.array(z.string()),
  customDateFrom: z.string(),
  customDateTo: z.string(),
  costPatientVolume: z.string(),
  costTreatmentDurationDays: z.string(),
  costUnitPrice: z.string(),
  costDosageFrequency: z.string(),
  costRegion: z.string(),
});
