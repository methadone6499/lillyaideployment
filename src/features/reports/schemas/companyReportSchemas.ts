import { z } from "zod";

import {
  generationStatusSchema,
  reviewStatusSchema,
  type GenerationStatus,
  type ReviewStatus,
} from "./platformReportSchemas";

export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const companyReportCreatorSchema = z.object({
  user_id: z.string(),
  full_name: z.string(),
  email: z.string(),
});

export const companyReportSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  drug_name: z.string(),
  creator: companyReportCreatorSchema,
  generation_status: generationStatusSchema,
  review_status: reviewStatusSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const companyReportListResponseSchema = z.object({
  items: z.array(companyReportSummarySchema),
  next_cursor: z.string().nullish(),
});

export type CompanyReportCreator = z.infer<typeof companyReportCreatorSchema>;
export type CompanyReportSummary = z.infer<typeof companyReportSummarySchema>;
export type CompanyReportListResponse = z.infer<
  typeof companyReportListResponseSchema
>;

export type ListCompanyReportsParams = {
  limit?: number;
  cursor?: string | null;
  search?: string;
  generationStatus?: GenerationStatus;
  reviewStatus?: ReviewStatus;
  creatorUserId?: string;
};
