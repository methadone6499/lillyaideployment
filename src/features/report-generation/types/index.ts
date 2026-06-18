import type { z } from "zod";
import type {
  advancedFiltersSchema,
  articleCandidateSchema,
  articleDiscoveryResponseSchema,
  comparatorDiscoveryResponseSchema,
  createReportInputSchema,
  createReportResponseSchema,
  drugSuggestionSchema,
  filterStateSchema,
  generateReportInputSchema,
  generateReportResponseSchema,
  generateReportSectionSchema,
  jobStatusSchema,
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
  sectionStatusSchema,
  sectionTypeSchema,
  updateReportSelectionsInputSchema,
  updateReportSelectionsResponseSchema,
} from "../schemas/reportSchemas";

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export type EvidenceType = "clinical" | "economic";

export type ReportStatus = z.infer<typeof reportStatusSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type SectionStatus = z.infer<typeof sectionStatusSchema>;
export type SectionType = z.infer<typeof sectionTypeSchema>;

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

export type ReportSectionContent = z.infer<typeof reportSectionContentSchema>;
export type ReportSectionResponse = z.infer<typeof reportSectionResponseSchema>;

export type PdfExportResponse = z.infer<typeof pdfExportResponseSchema>;

export type DrugSuggestion = z.infer<typeof drugSuggestionSchema>;
export type FilterState = z.infer<typeof filterStateSchema>;
