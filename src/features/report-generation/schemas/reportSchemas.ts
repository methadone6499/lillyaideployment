import { z } from "zod";

export const reportStatusSchema = z.enum([
  "draft",
  "ready",
  "queued",
  "processing",
  "generating",
  "completed",
  "failed",
]);

export const jobStatusSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "failed",
]);

export const sectionStatusSchema = z.enum([
  "pending",
  "running",
  "partially_completed",
  "completed",
  "failed",
]);

export const sectionTypeSchema = z.enum([
  "disease",
  "clinical",
  "economic",
  "drug",
  "hta",
  "comparator",
  "appraisal",
  "discussion",
  "compliance",
  "executive",
]);

export const articleCandidateSchema = z.object({
  pmid: z.string(),
  pmcid: z.string().optional(),
  title: z.string(),
  authors: z.array(z.string()),
  journal: z.string(),
  year: z.union([z.string(), z.number()]),
  doi: z.string().optional(),
  abstract: z.string(),
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

export const advancedFiltersSchema = z.object({
  time_range: z.string().optional(),
  species_filter: z.string().optional(),
  clinical_types: z.array(z.string()).optional(),
  economic_types: z.array(z.string()).optional(),
  population: z.string().optional(),
  geography: z.string().optional(),
});

export const reportInputsSchema = z.object({
  pubmed_top_k_clinical: z.number().optional(),
  pubmed_top_k_economic: z.number().optional(),
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
  section_types: z.array(sectionTypeSchema),
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
  status: reportStatusSchema,
  inputs: reportInputsSchema,
  discovery: reportDiscoveryStateSchema.optional(),
  selections: reportSelectionsSchema.optional(),
  storage_root: z.string().optional(),
});

export const updateReportSelectionsInputSchema = z.object({
  comparators: z.array(z.string()),
  custom_comparators: z.array(z.string()),
  clinical_pmcids: z.array(z.string()),
  economic_pmcids: z.array(z.string()),
  section_types: z.array(sectionTypeSchema),
});

export const updateReportSelectionsResponseSchema = z.object({
  report_id: z.string(),
  status: reportStatusSchema,
  selections: updateReportSelectionsInputSchema,
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
  status: sectionStatusSchema,
  depends_on: z.array(z.string()).optional(),
  error: z.string().nullable().optional(),
});

export const generateReportResponseSchema = z.object({
  job_id: z.string(),
  report_id: z.string(),
  job_status: jobStatusSchema,
  report_status: reportStatusSchema,
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
  error: z.string().nullable().optional(),
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

export const tableBlockSchema = z.object({
  type: z.literal("table"),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.string())),
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

export type Block =
  | z.infer<typeof headingBlockSchema>
  | z.infer<typeof paragraphBlockSchema>
  | z.infer<typeof tableBlockSchema>
  | z.infer<typeof definitionBlockSchema>
  | z.infer<typeof listBlockSchema>
  | z.infer<typeof calloutBlockSchema>
  | z.infer<typeof markdownBlockSchema>
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

export const reportSectionContentSchema = z.object({
  raw: z.unknown().optional(),
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
  populationType: z.string(),
  studyDuration: z.string(),
  economicStudyTypes: z.array(z.string()),
  costPopulationType: z.string(),
  patientRange: z.string(),
  costPopulationTypeSecondary: z.string(),
  costStudyDuration: z.string(),
  averageWeight: z.string(),
  genderDistribution: z.string(),
  treatmentDuration: z.string(),
  dosageFrequency: z.string(),
  regionPricingMarket: z.string(),
  outcomeEvidenceFocus: z.string(),
  geographyRegulatoryRegion: z.string(),
  evidenceQuality: z.string(),
  comparatorType: z.string(),
});
