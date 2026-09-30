import { z } from "zod";

const UTC_OFFSET_PATTERN = /(?:Z|[+-]00:00)$/i;
const CURRENCY_CODE_PATTERN = /^[A-Za-z]{3}$/;

function isUtcIsoDateTime(value: string): boolean {
  return UTC_OFFSET_PATTERN.test(value);
}

export const utcIsoDateTimeSchema = z
  .iso.datetime({ offset: true })
  .refine(isUtcIsoDateTime, { error: "Datetime must be UTC" });

export const amountMinorSchema = z.number().int().nonnegative();

export const currencyCodeSchema = z
  .string()
  .regex(CURRENCY_CODE_PATTERN, "Currency must be a 3-letter ISO code");

export const nonEmptyIdSchema = z.string().min(1);

export const companyNameSchema = z.string().trim().min(1).max(200);

export const nullableHttpUrlSchema = z.url().nullable();

export const planTypeSchema = z.enum(["standard", "enterprise", "custom"]);

export const planIntentSchema = planTypeSchema;

export const purchasablePlanTypeSchema = z.enum(["standard", "enterprise"]);

export const subscriptionScopeSchema = z.enum(["user", "company"]);

export const subscriptionStatusSchema = z.enum([
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "expired",
  "suspended",
  "inactive",
]);

export const billingIntervalSchema = z.enum(["month"]);

export const checkoutStatusSchema = z.enum([
  "creating",
  "open",
  "payment_pending",
  "completed",
  "failed",
  "expired",
  "superseded",
]);

export const planChangeStatusSchema = z.enum([
  "requested",
  "payment_pending",
  "completed",
  "failed",
  "scheduled",
  "cancelled",
]);

export const operationLockReasonSchema = z.enum([
  "custom_subscription_payment_pending",
]);

export const operationLockActionSchema = z.enum([
  "report_generation",
  "seat_changes",
  "invitation_create",
  "invitation_resend",
  "invitation_accept",
  "quota_changes",
]);

export const downgradeStatusSchema = z.enum(["scheduled", "cancelled"]);

export const billingErrorCodeSchema = z.enum([
  "invalid_session",
  "validation_error",
  "subscription_not_required",
  "active_access_exists",
  "checkout_session_pending",
  "checkout_payment_pending",
  "checkout_state_conflict",
  "billing_owner_required",
  "unsupported_plan_change",
  "subscription_cancellation_pending",
  "subscription_change_pending",
  "billing_not_configured",
  "billing_provider_unavailable",
  "billing_reconciliation_failed",
  "subscription_required",
  "report_quota_exhausted",
  "subscription_payment_pending",
  "custom_subscription_payment_in_progress",
  "enterprise_capacity_exceeded",
  "custom_subscription_request_active",
  "scheduled_downgrade_not_found",
]);

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

export const subscriptionSummarySchema = z.object({
  id: nonEmptyIdSchema,
  scope_type: subscriptionScopeSchema,
  plan_type: planTypeSchema,
  status: subscriptionStatusSchema,
  amount_minor: amountMinorSchema,
  currency: currencyCodeSchema,
  billing_interval: billingIntervalSchema,
  cancel_at_period_end: z.boolean(),
  limits: subscriptionLimitsSnapshotSchema,
  features: subscriptionFeaturesSnapshotSchema,
  current_period_start: utcIsoDateTimeSchema,
  current_period_end: utcIsoDateTimeSchema,
});

export const checkoutStateSchema = z.object({
  checkout_id: nonEmptyIdSchema,
  plan_type: planTypeSchema,
  status: checkoutStatusSchema,
  checkout_url: nullableHttpUrlSchema,
  expires_at: utcIsoDateTimeSchema.nullable(),
});

export const planChangeStateSchema = z.object({
  plan_change_id: nonEmptyIdSchema,
  from_plan: planTypeSchema,
  to_plan: planTypeSchema,
  company_name: z.string().min(1),
  status: planChangeStatusSchema,
  hosted_invoice_url: nullableHttpUrlSchema,
  effective_at: utcIsoDateTimeSchema.nullable().default(null),
});

export const operationLockSchema = z.object({
  reason: operationLockReasonSchema,
  blocked_actions: z.array(operationLockActionSchema),
  can_manage_payment: z.boolean(),
});

export const subscriptionQuotaSchema = z.object({
  quota_total: z.number().int().nonnegative(),
  quota_used: z.number().int().nonnegative(),
  quota_remaining: z.number().int().nonnegative(),
  period_start: utcIsoDateTimeSchema,
  period_end: utcIsoDateTimeSchema,
});

export const subscriptionOverviewSchema = z.object({
  subscription: subscriptionSummarySchema.nullable(),
  checkout: checkoutStateSchema.nullable(),
  plan_change: planChangeStateSchema.nullable(),
  quota: subscriptionQuotaSchema.nullable(),
  can_use_paid_features: z.boolean(),
  operation_lock: operationLockSchema.nullable().default(null),
});

export const checkoutRequestSchema = z.discriminatedUnion("plan_type", [
  z
    .object({
      plan_type: z.literal("standard"),
    })
    .strict(),
  z
    .object({
      plan_type: z.literal("enterprise"),
      company_name: companyNameSchema,
    })
    .strict(),
]);

export const checkoutResponseSchema = z.object({
  checkout_id: nonEmptyIdSchema,
  plan_type: purchasablePlanTypeSchema,
  stripe_checkout_session_id: nonEmptyIdSchema,
  checkout_url: z.url(),
  expires_at: utcIsoDateTimeSchema,
});

export const portalResponseSchema = z.object({
  url: z.url(),
});

export const upgradeRequestSchema = z
  .object({
    company_name: companyNameSchema,
  })
  .strict();

export const upgradeResponseSchema = z.object({
  plan_change_id: nonEmptyIdSchema,
  status: planChangeStatusSchema,
  hosted_invoice_url: nullableHttpUrlSchema,
});

export const downgradeResponseSchema = z.object({
  plan_change_id: nonEmptyIdSchema,
  status: downgradeStatusSchema,
  effective_at: utcIsoDateTimeSchema,
});

export const checkoutPendingDetailsSchema = z.object({
  plan_type: planTypeSchema,
});

export const billingErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string(),
  details: z.unknown().nullable(),
  request_id: z.string().nullable(),
});

export type PlanType = z.infer<typeof planTypeSchema>;
export type PlanIntent = z.infer<typeof planIntentSchema>;
export type PurchasablePlanType = z.infer<typeof purchasablePlanTypeSchema>;
export type SubscriptionScope = z.infer<typeof subscriptionScopeSchema>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
export type BillingInterval = z.infer<typeof billingIntervalSchema>;
export type CheckoutStatus = z.infer<typeof checkoutStatusSchema>;
export type PlanChangeStatus = z.infer<typeof planChangeStatusSchema>;
export type OperationLockReason = z.infer<typeof operationLockReasonSchema>;
export type OperationLockAction = z.infer<typeof operationLockActionSchema>;
export type OperationLock = z.infer<typeof operationLockSchema>;
export type DowngradeStatus = z.infer<typeof downgradeStatusSchema>;
export type DowngradeResponse = z.infer<typeof downgradeResponseSchema>;
export type BillingErrorCode = z.infer<typeof billingErrorCodeSchema>;
export type SubscriptionLimitsSnapshot = z.infer<
  typeof subscriptionLimitsSnapshotSchema
>;
export type SubscriptionLimits = SubscriptionLimitsSnapshot;
export type SubscriptionFeaturesSnapshot = z.infer<
  typeof subscriptionFeaturesSnapshotSchema
>;
export type SubscriptionFeatures = SubscriptionFeaturesSnapshot;
export type SubscriptionSummary = z.infer<typeof subscriptionSummarySchema>;
export type CheckoutState = z.infer<typeof checkoutStateSchema>;
export type PlanChangeState = z.infer<typeof planChangeStateSchema>;
export type SubscriptionQuota = z.infer<typeof subscriptionQuotaSchema>;
export type SubscriptionOverview = z.infer<typeof subscriptionOverviewSchema>;
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;
export type PortalResponse = z.infer<typeof portalResponseSchema>;
export type UpgradeRequest = z.infer<typeof upgradeRequestSchema>;
export type UpgradeResponse = z.infer<typeof upgradeResponseSchema>;
export type CheckoutPendingDetails = z.infer<
  typeof checkoutPendingDetailsSchema
>;
export type BillingError = z.infer<typeof billingErrorSchema>;
