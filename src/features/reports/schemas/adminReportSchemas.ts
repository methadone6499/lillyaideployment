import { z } from "zod";

import {
  generationStatusSchema,
  reviewStatusSchema,
  type GenerationStatus,
  type ReviewStatus,
} from "./platformReportSchemas";

export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const adminReportCreatorSchema = z.object({
  user_id: z.string(),
  full_name: z.string(),
  email: z.string(),
});

export const adminReportCompanySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const adminReportReviewerSchema = z.object({
  user_id: z.string(),
  full_name: z.string(),
  email: z.string(),
});

export const adminReportSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  drug_name: z.string(),
  creator: adminReportCreatorSchema,
  company: adminReportCompanySchema.nullish(),
  reviewer: adminReportReviewerSchema.nullish(),
  generation_status: generationStatusSchema,
  review_status: reviewStatusSchema,
  quota_charged: z.boolean(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const adminReportListResponseSchema = z.object({
  items: z.array(adminReportSummarySchema),
  next_cursor: z.string().nullish(),
});

export type AdminReportCreator = z.infer<typeof adminReportCreatorSchema>;
export type AdminReportCompany = z.infer<typeof adminReportCompanySchema>;
export type AdminReportReviewer = z.infer<typeof adminReportReviewerSchema>;
export type AdminReportSummary = z.infer<typeof adminReportSummarySchema>;
export type AdminReportListResponse = z.infer<
  typeof adminReportListResponseSchema
>;

export type ListAdminReportsParams = {
  limit?: number;
  cursor?: string | null;
  search?: string;
  companyId?: string;
  creatorUserId?: string;
  reviewerUserId?: string;
  generationStatus?: GenerationStatus;
  reviewStatus?: ReviewStatus;
  createdFrom?: string;
  createdTo?: string;
};
