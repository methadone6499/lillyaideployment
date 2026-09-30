import { z } from "zod";

export const featureTypeSchema = z.enum(["report_generation"]);

export const quotaPeriodStatusSchema = z.enum(["active"]);

export const quotaAllocationStatusSchema = z.enum(["active", "released"]);

export const quotaSourceSchema = z.enum([
  "enterprise_subscription",
  "company_admin_assignment",
]);

export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const quotaRedistributionTriggerSchema = z.enum([
  "custom_offer",
  "subscription_plan_change",
]);

export const quotaRedistributionStateSchema = z.object({
  required: z.boolean(),
  trigger_type: quotaRedistributionTriggerSchema,
  trigger_id: z.string().min(1),
  created_at: isoDateTimeSchema,
  dismissed_at: isoDateTimeSchema.nullable(),
  dismissed_by_user_id: z.string().nullable(),
});

export const dismissQuotaRedistributionRequestSchema = z
  .object({
    quota_period_id: z.string().min(1),
  })
  .strict();

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
  redistribution: quotaRedistributionStateSchema.nullable().default(null),
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
export type QuotaRedistributionTrigger = z.infer<
  typeof quotaRedistributionTriggerSchema
>;
export type QuotaRedistributionState = z.infer<
  typeof quotaRedistributionStateSchema
>;
export type DismissQuotaRedistributionRequest = z.infer<
  typeof dismissQuotaRedistributionRequestSchema
>;
export type CompanyQuotaSummary = z.infer<typeof companyQuotaSummarySchema>;
export type OwnQuota = z.infer<typeof ownQuotaSchema>;
export type QuotaAllocation = z.infer<typeof quotaAllocationSchema>;
