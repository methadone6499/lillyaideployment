import type { z } from "zod";
import type {
  advancedFiltersSchema,
  articleCandidateSchema,
  articleDiscoveryResponseSchema,
  blockSchema,
  calloutBlockSchema,
  comparatorDiscoveryResponseSchema,
  createReportInputSchema,
  createReportResponseSchema,
  definitionBlockSchema,
  drugValidationResponseSchema,
  filterStateSchema,
  generateReportInputSchema,
  generateReportResponseSchema,
  generateReportSectionSchema,
  headingBlockSchema,
  jobStatusSchema,
  listBlockSchema,
  markdownBlockSchema,
  paragraphBlockSchema,
  pdfExportResponseSchema,
  reportArtifactsSchema,
  reportDiscoveryStateSchema,
  reportInputsSchema,
  reportProgressSchema,
  reportSectionContentSchema,
  reportSectionResponseSchema,
  reportSelectionsSchema,
  reportStatusResponseSchema,
  reportStatusSchema,
  reportStatusSectionSchema,
  sectionBlockSchema,
  sectionStatusSchema,
  sectionTypeSchema,
  tableBlockSchema,
  updateReportSelectionsInputSchema,
  updateReportSelectionsResponseSchema,
} from "../schemas/reportSchemas";

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export type EvidenceType = "clinical" | "economic";

export type ReportStatus = z.infer<typeof reportStatusSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type SectionStatus = z.infer<typeof sectionStatusSchema>;
export type SectionType = z.infer<typeof sectionTypeSchema>;

/** Step 5 / wizard section IDs — aligned with backend section types. */
export type WizardSectionId = SectionType;

export type ArticleCandidate = z.infer<typeof articleCandidateSchema>;
export type ArticleDiscoveryResponse = z.infer<
  typeof articleDiscoveryResponseSchema
>;
export type ComparatorDiscoveryResponse = z.infer<
  typeof comparatorDiscoveryResponseSchema
>;

export type AdvancedFilters = z.infer<typeof advancedFiltersSchema>;
export type ReportInputs = z.infer<typeof reportInputsSchema>;
export type CreateReportInput = z.infer<typeof createReportInputSchema>;
export type CreateReportResponse = z.infer<typeof createReportResponseSchema>;
export type ReportDiscoveryState = z.infer<typeof reportDiscoveryStateSchema>;
export type ReportSelections = z.infer<typeof reportSelectionsSchema>;

export type UpdateReportSelectionsInput = z.infer<
  typeof updateReportSelectionsInputSchema
>;
export type UpdateReportSelectionsResponse = z.infer<
  typeof updateReportSelectionsResponseSchema
>;

export type GenerateReportInput = z.infer<typeof generateReportInputSchema>;
export type GenerateReportResponse = z.infer<typeof generateReportResponseSchema>;
export type GenerateReportSection = z.infer<typeof generateReportSectionSchema>;

export type ReportProgress = z.infer<typeof reportProgressSchema>;
export type ReportStatusSection = z.infer<typeof reportStatusSectionSchema>;
export type ReportArtifacts = z.infer<typeof reportArtifactsSchema>;
export type ReportStatusResponse = z.infer<typeof reportStatusResponseSchema>;

export type Block = z.infer<typeof blockSchema>;
export type HeadingBlock = z.infer<typeof headingBlockSchema>;
export type ParagraphBlock = z.infer<typeof paragraphBlockSchema>;
export type TableBlock = z.infer<typeof tableBlockSchema>;
export type DefinitionBlock = z.infer<typeof definitionBlockSchema>;
export type ListBlock = z.infer<typeof listBlockSchema>;
export type SectionBlock = z.infer<typeof sectionBlockSchema>;
export type CalloutBlock = z.infer<typeof calloutBlockSchema>;
export type MarkdownBlock = z.infer<typeof markdownBlockSchema>;
export type ReportSectionContent = z.infer<typeof reportSectionContentSchema>;
export type ReportSectionResponse = z.infer<typeof reportSectionResponseSchema>;

export type PdfExportResponse = z.infer<typeof pdfExportResponseSchema>;

export type DrugValidationResponse = z.infer<typeof drugValidationResponseSchema>;
export type FilterState = z.infer<typeof filterStateSchema>;
