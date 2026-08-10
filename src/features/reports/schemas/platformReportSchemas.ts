import { z } from "zod";

export const generationStatusSchema = z.enum([
  "generating",
  "completed",
  "failed",
]);

export const reviewStatusSchema = z.enum([
  "unassigned",
  "pending",
  "in_review",
  "changes_requested",
  "approved",
]);

export const generationFiltersSchema = z
  .object({
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
  })
  .strict();

export const generationSnapshotSchema = z
  .object({
    filters: generationFiltersSchema,
    selected_clinical_article_ids: z.array(z.string()),
    selected_economic_article_ids: z.array(z.string()),
    selected_comparators: z.array(z.string()),
    custom_comparators: z.array(z.string()),
    selected_section_ids: z.array(z.string()),
    custom_sections: z.array(z.string()),
    submitted_at: z.string().datetime({ offset: true }),
  })
  .strict();

export const createReportInputSchema = z
  .object({
    report_service_id: z.string().uuid(),
    generation_job_id: z.string().nullable(),
    title: z.string(),
    drug_name: z.string(),
    indications: z.string(),
    generation_snapshot: generationSnapshotSchema,
  })
  .strict();

export const creatorSnapshotSchema = z.object({
  email: z.string(),
  full_name: z.string(),
});

export const reportResultSchema = z.object({
  completed_at: z.string().nullable(),
  pdf_url: z.string().nullable(),
});

export const reportSchema = z.object({
  id: z.string(),
  report_service_id: z.string(),
  generation_job_id: z.string().nullable(),
  created_by_user_id: z.string(),
  creator_snapshot: creatorSnapshotSchema,
  company_id: z.string().nullable(),
  assigned_reviewer_user_id: z.string().nullable(),
  review_status: reviewStatusSchema,
  title: z.string(),
  drug_name: z.string(),
  indications: z.string(),
  generation_status: generationStatusSchema,
  status_last_checked_at: z.string().nullable(),
  generation_snapshot: generationSnapshotSchema,
  result: reportResultSchema,
  archived_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const reportSummarySchema = z.object({
  id: z.string(),
  report_service_id: z.string(),
  title: z.string(),
  generation_status: generationStatusSchema,
  review_status: reviewStatusSchema,
  created_at: z.string(),
});

export const reportListResponseSchema = z.object({
  items: z.array(reportSummarySchema),
  next_cursor: z.string().nullable(),
});

export type GenerationStatus = z.infer<typeof generationStatusSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type GenerationFilters = z.infer<typeof generationFiltersSchema>;
export type GenerationSnapshot = z.infer<typeof generationSnapshotSchema>;
export type CreateReportInput = z.infer<typeof createReportInputSchema>;
export type CreatorSnapshot = z.infer<typeof creatorSnapshotSchema>;
export type ReportResult = z.infer<typeof reportResultSchema>;
export type Report = z.infer<typeof reportSchema>;
export type ReportSummary = z.infer<typeof reportSummarySchema>;
export type ReportListResponse = z.infer<typeof reportListResponseSchema>;

export type ListPlatformReportsParams = {
  limit?: number;
  cursor?: string | null;
  search?: string;
  generationStatus?: GenerationStatus;
};
