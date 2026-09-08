import type { z } from "zod";
import type {
  advancedFiltersSchema,
  articleCandidateSchema,
  articleDiscoveryResponseSchema,
  blockSchema,
  builtInSectionTypeSchema,
  calloutBlockSchema,
  comparatorDiscoveryResponseSchema,
  createCustomSectionPromptInputSchema,
  createReportInputSchema,
  createReportResponseSchema,
  customSectionGuidelinesSchema,
  customSectionModeSchema,
  customSectionResponseSchema,
  customSectionSpecSchema,
  customSectionTypeSchema,
  definitionBlockSchema,
  drugValidationResponseSchema,
  filterStateSchema,
  generateReportInputSchema,
  generateReportResponseSchema,
  generateReportSectionSchema,
  headingBlockSchema,
  jobStatusSchema,
  listBlockSchema,
  listCustomSectionsResponseSchema,
  markdownBlockSchema,
  paragraphBlockSchema,
  patchCustomSectionInputSchema,
  pdfExportResponseSchema,
  pptxExportPhaseSchema,
  pptxExportProgressSchema,
  pptxExportQueueResponseSchema,
  pptxExportStatusResponseSchema,
  queuePptxExportInputSchema,
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

export type TextAvailabilityFilter = "all" | "full_text" | "abstract_only";

export type ReportStatus = z.infer<typeof reportStatusSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type SectionStatus = z.infer<typeof sectionStatusSchema>;
export type BuiltInSectionType = z.infer<typeof builtInSectionTypeSchema>;
export type CustomSectionType = z.infer<typeof customSectionTypeSchema>;
export type SectionType = z.infer<typeof sectionTypeSchema>;

/** Step 5 / wizard section IDs — built-in section types only. */
export type WizardSectionId = BuiltInSectionType;

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

export type CustomSectionMode = z.infer<typeof customSectionModeSchema>;
export type CustomSectionGuidelines = z.infer<
  typeof customSectionGuidelinesSchema
>;
export type CustomSectionSpec = z.infer<typeof customSectionSpecSchema>;
export type CustomSectionResponse = z.infer<typeof customSectionResponseSchema>;
export type ListCustomSectionsResponse = z.infer<
  typeof listCustomSectionsResponseSchema
>;
export type CreateCustomSectionPromptInput = z.infer<
  typeof createCustomSectionPromptInputSchema
>;
export type PatchCustomSectionInput = z.infer<
  typeof patchCustomSectionInputSchema
>;

/** Ready custom section kept in the wizard outline (Step 5). */
export type WizardCustomSection = {
  customId: string;
  title: string;
  enabled: boolean;
};

export type CreateCustomSectionInput = {
  title: string;
  prompt?: string;
  file?: File;
  customId?: string | null;
};

export type QueuePptxExportInput = z.infer<typeof queuePptxExportInputSchema>;
export type PptxExportPhase = z.infer<typeof pptxExportPhaseSchema>;
export type PptxExportProgress = z.infer<typeof pptxExportProgressSchema>;
export type PptxExportQueueResponse = z.infer<
  typeof pptxExportQueueResponseSchema
>;
export type PptxExportStatusResponse = z.infer<
  typeof pptxExportStatusResponseSchema
>;

export type DrugValidationResponse = z.infer<typeof drugValidationResponseSchema>;
export type FilterState = z.infer<typeof filterStateSchema>;
