import { z } from "zod";

export const companyRoleSchema = z.enum([
  "company_admin",
  "company_seat_user",
]);

export const planTypeSchema = z.enum(["standard", "enterprise", "custom"]);

export const subscriptionStatusSchema = z.enum([
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "expired",
  "suspended",
  "inactive",
]);

export const subscriptionSourceSchema = z.enum(["mock_self_service"]);

export const billingIntervalSchema = z.enum(["month"]);

export const subscriptionLimitsSnapshotSchema = z.object({
  seats: z.number().int().min(1),
  reports: z.number().int().nonnegative(),
});

export const subscriptionFeaturesSnapshotSchema = z.object({
  report_generation: z.boolean(),
  dosage_calculator: z.boolean(),
  paid_sources: z.boolean(),
  ai_presentation: z.boolean(),
  advanced_analytics: z.boolean(),
  company_seats: z.boolean(),
  review_submission_enabled: z.boolean(),
});

export const enterpriseActivationRequestSchema = z.object({
  company_name: z.string().trim().min(1).max(200),
});

export const enterpriseActivationResponseSchema = z.object({
  company_id: z.string(),
  company_name: z.string(),
  billing_email: z.string().email(),
  primary_admin_user_id: z.string(),
  membership_id: z.string(),
  role: companyRoleSchema,
  occupies_seat: z.boolean(),
  subscription_id: z.string(),
  plan_type: planTypeSchema,
  subscription_status: subscriptionStatusSchema,
  source: subscriptionSourceSchema,
  amount_minor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  billing_interval: billingIntervalSchema,
  cancel_at_period_end: z.boolean(),
  limits: subscriptionLimitsSnapshotSchema,
  features: subscriptionFeaturesSnapshotSchema,
  quota_period_id: z.string(),
  quota_allocation_id: z.string(),
  quota_total: z.number().int().nonnegative(),
  quota_used: z.number().int().nonnegative(),
  quota_remaining: z.number().int().nonnegative(),
  period_start: z.string().datetime({ offset: true }),
  period_end: z.string().datetime({ offset: true }),
});

export type CompanyRole = z.infer<typeof companyRoleSchema>;
export type PlanType = z.infer<typeof planTypeSchema>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
export type SubscriptionSource = z.infer<typeof subscriptionSourceSchema>;
export type BillingInterval = z.infer<typeof billingIntervalSchema>;
export type SubscriptionLimitsSnapshot = z.infer<
  typeof subscriptionLimitsSnapshotSchema
>;
export type SubscriptionFeaturesSnapshot = z.infer<
  typeof subscriptionFeaturesSnapshotSchema
>;
export type EnterpriseActivationRequest = z.infer<
  typeof enterpriseActivationRequestSchema
>;
export type EnterpriseActivationResponse = z.infer<
  typeof enterpriseActivationResponseSchema
>;
