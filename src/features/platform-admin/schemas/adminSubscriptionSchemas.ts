import { z } from "zod";
import { amountMinorSchema, billingIntervalSchema, currencyCodeSchema, planTypeSchema, subscriptionScopeSchema, subscriptionStatusSchema, utcIsoDateTimeSchema, } from "@/features/billing";
export const adminSubscriptionSchema = z.object({
  id: z.string().min(1),
  scope_type: subscriptionScopeSchema,
  scope_id: z.string().min(1),
  subscriber: z.object({ user_id: z.string().min(1), full_name: z.string().nullable(), email: z.string().nullable() }),
  company: z.object({ id: z.string().min(1), name: z.string().nullable() }).nullable(),
  plan_type: planTypeSchema,
  status: subscriptionStatusSchema,
  source: z.enum(["mock_self_service", "stripe"]),
  amount_minor: amountMinorSchema,
  currency: currencyCodeSchema,
  billing_interval: billingIntervalSchema,
  cancel_at_period_end: z.boolean(),
  limits: z.object({ reports: z.number().int().nonnegative(), seats: z.number().int().nonnegative() }),
  current_period_start: utcIsoDateTimeSchema,
  current_period_end: utcIsoDateTimeSchema,
  stripe_subscription_id: z.string().nullable(),
  latest_paid_invoice_id: z.string().nullable(),
  last_stripe_event_created_at: utcIsoDateTimeSchema.nullable(),
  created_at: utcIsoDateTimeSchema,
  updated_at: utcIsoDateTimeSchema,
});
export const adminSubscriptionListSchema = z.object({
  items: z.array(adminSubscriptionSchema), next_cursor: z.string().nullable(),
});
export const adminSubscriptionSummarySchema = z.object({
  total: z.number().int().nonnegative(), active: z.number().int().nonnegative(),
  needs_attention: z.number().int().nonnegative(),
  mrr_by_currency: z.array(z.object({ currency: currencyCodeSchema, amount_minor: amountMinorSchema })),
});
export const adminSubscriptionFiltersSchema = z.object({
  search: z.string().max(100).optional(), plan_type: planTypeSchema.optional(),
  status: subscriptionStatusSchema.optional(), scope_type: subscriptionScopeSchema.optional(),
  limit: z.number().int().min(1).max(50).default(20),
});
export type AdminSubscription = z.infer<typeof adminSubscriptionSchema>;
export type AdminSubscriptionFilters = z.infer<typeof adminSubscriptionFiltersSchema>;
