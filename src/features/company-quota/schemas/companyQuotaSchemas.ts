import { z } from "zod";

export const featureTypeSchema = z.enum(["report_generation"]);

export const quotaPeriodStatusSchema = z.enum(["active"]);

export const quotaAllocationStatusSchema = z.enum(["active", "released"]);

export const quotaSourceSchema = z.enum([
  "enterprise_subscription",
  "company_admin_assignment",
]);

export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const setMemberQuotaRequestSchema = z
  .object({
    quota_total: z.number().int().nonnegative(),
  })
  .strict();

export const companyQuotaSummarySchema = z.object({
  company_id: z.string(),
  subscription_id: z.string(),
  quota_period_id: z.string(),
  feature: featureTypeSchema,
  status: quotaPeriodStatusSchema,
  period_start: isoDateTimeSchema,
  period_end: isoDateTimeSchema,
  quota_total: z.number().int().nonnegative(),
  quota_allocated: z.number().int().nonnegative(),
  quota_unallocated: z.number().int().nonnegative(),
  quota_used: z.number().int().nonnegative(),
  quota_remaining: z.number().int().nonnegative(),
});

export const ownQuotaSchema = z.object({
  company_id: z.string(),
  membership_id: z.string(),
  user_id: z.string(),
  quota_period_id: z.string(),
  quota_total: z.number().int().nonnegative(),
  quota_used: z.number().int().nonnegative(),
  quota_remaining: z.number().int().nonnegative(),
  period_start: isoDateTimeSchema,
  period_end: isoDateTimeSchema,
});

export const quotaAllocationSchema = z.object({
  allocation_id: z.string(),
  company_id: z.string(),
  quota_period_id: z.string(),
  membership_id: z.string(),
  user_id: z.string(),
  quota_total: z.number().int().nonnegative(),
  quota_used: z.number().int().nonnegative(),
  quota_remaining: z.number().int().nonnegative(),
  status: quotaAllocationStatusSchema,
  source: quotaSourceSchema,
  updated_at: isoDateTimeSchema,
});

export type FeatureType = z.infer<typeof featureTypeSchema>;
export type QuotaPeriodStatus = z.infer<typeof quotaPeriodStatusSchema>;
export type QuotaAllocationStatus = z.infer<typeof quotaAllocationStatusSchema>;
export type QuotaSource = z.infer<typeof quotaSourceSchema>;
export type SetMemberQuotaRequest = z.infer<typeof setMemberQuotaRequestSchema>;
export type CompanyQuotaSummary = z.infer<typeof companyQuotaSummarySchema>;
export type OwnQuota = z.infer<typeof ownQuotaSchema>;
export type QuotaAllocation = z.infer<typeof quotaAllocationSchema>;
