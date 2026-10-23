import { z } from "zod";
import { currencyCodeSchema, nonEmptyIdSchema, subscriptionScopeSchema, utcIsoDateTimeSchema } from "./billingSchemas";

export const topUpBalanceSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const topUpQuantitySchema = topUpBalanceSchema.min(1);
export const topUpOrderStatusSchema = z.enum([
  "creating", "open", "payment_pending", "completed", "failed", "expired",
  "partially_refunded", "refunded", "disputed",
]);
export const topUpAllocationSchema = z.object({
  allocation_id: nonEmptyIdSchema,
  membership_id: nonEmptyIdSchema,
  user_id: nonEmptyIdSchema,
  remaining_balance: topUpBalanceSchema,
  lifetime_allocated: topUpBalanceSchema,
  lifetime_consumed: topUpBalanceSchema,
  lifetime_returned: topUpBalanceSchema,
});
export const topUpOverviewSchema = z.object({
  scope_type: subscriptionScopeSchema,
  pool_balance: topUpBalanceSchema,
  assigned_balance: topUpBalanceSchema,
  usable_balance: topUpBalanceSchema,
  can_purchase: z.boolean(),
  can_manage_allocations: z.boolean(),
  unit_amount_minor: topUpBalanceSchema,
  currency: currencyCodeSchema,
  max_purchase_quantity: topUpQuantitySchema,
  requires_paid_subscription: z.boolean(),
  credits_expire: z.boolean(),
  personal_credits_forfeited_on_company_upgrade: z.boolean(),
  allocations: z.array(topUpAllocationSchema),
});
export const topUpCheckoutRequestSchema = z.object({ quantity: topUpQuantitySchema }).strict();
export const topUpCheckoutSchema = z.object({
  order_id: nonEmptyIdSchema,
  status: topUpOrderStatusSchema,
  scope_type: subscriptionScopeSchema,
  quantity: topUpQuantitySchema,
  unit_amount_minor: topUpBalanceSchema,
  total_amount_minor: topUpBalanceSchema,
  currency: currencyCodeSchema,
  stripe_checkout_session_id: nonEmptyIdSchema.nullable(),
  checkout_url: z.url().nullable(),
  expires_at: utcIsoDateTimeSchema.nullable(),
});
export const setMemberTopUpRequestSchema = z.object({ balance: topUpBalanceSchema }).strict();
export const setMemberTopUpResponseSchema = z.object({
  pool_balance: topUpBalanceSchema,
  allocation: topUpAllocationSchema.nullable(),
});
export const topUpForfeitureAcknowledgementSchema = z.object({
  acknowledge_top_up_forfeiture: z.boolean().optional(),
}).strict();
export type TopUpOverview = z.infer<typeof topUpOverviewSchema>;
export type TopUpCheckout = z.infer<typeof topUpCheckoutSchema>;
export type TopUpAllocation = z.infer<typeof topUpAllocationSchema>;
export type TopUpOrderStatus = z.infer<typeof topUpOrderStatusSchema>;
