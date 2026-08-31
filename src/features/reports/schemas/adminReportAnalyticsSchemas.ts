import { z } from "zod";

const isoDateTimeSchema = z.string().datetime({ offset: true });
const reportCountSchema = z.number().int().nonnegative();

export const popularDrugSchema = z.object({
  drug_name: z.string(),
  report_count: reportCountSchema,
});

export const popularDrugListResponseSchema = z.object({
  items: z.array(popularDrugSchema),
});

export const topReportUserSchema = z.object({
  user_id: z.string(),
  full_name: z.string(),
  email: z.string(),
  report_count: reportCountSchema,
});

export const topReportUserListResponseSchema = z.object({
  items: z.array(topReportUserSchema),
});

export const topReportCompanySchema = z.object({
  company_id: z.string(),
  company_name: z.string().nullable(),
  report_count: reportCountSchema,
});

export const topReportCompanyListResponseSchema = z.object({
  items: z.array(topReportCompanySchema),
});

export const reportTotalsResponseSchema = z.object({
  as_of: isoDateTimeSchema,
  timezone: z.literal("UTC"),
  today: reportCountSchema,
  this_week: reportCountSchema,
  this_month: reportCountSchema,
});

export type PopularDrug = z.infer<typeof popularDrugSchema>;
export type PopularDrugListResponse = z.infer<
  typeof popularDrugListResponseSchema
>;
export type TopReportUser = z.infer<typeof topReportUserSchema>;
export type TopReportUserListResponse = z.infer<
  typeof topReportUserListResponseSchema
>;
export type TopReportCompany = z.infer<typeof topReportCompanySchema>;
export type TopReportCompanyListResponse = z.infer<
  typeof topReportCompanyListResponseSchema
>;
export type ReportTotalsResponse = z.infer<typeof reportTotalsResponseSchema>;

export type AdminReportAnalyticsLeaderboardParams = {
  limit?: number;
};
