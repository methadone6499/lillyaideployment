import { z } from "zod";

const nonEmptyTextSchema = z.string().trim().min(1);

export const billingSubscriptionSchema = z.object({
  planName: nonEmptyTextSchema,
  renewalLabel: nonEmptyTextSchema,
  price: nonEmptyTextSchema,
  priceSuffix: nonEmptyTextSchema,
  billingSummary: nonEmptyTextSchema,
  primaryActionLabel: nonEmptyTextSchema,
  secondaryActionLabel: nonEmptyTextSchema,
});

export const paymentMethodSchema = z.object({
  cardholderName: nonEmptyTextSchema,
  expirationDate: nonEmptyTextSchema,
  brand: nonEmptyTextSchema,
  lastFour: z.string().regex(/^\d{4}$/),
  imageSrc: nonEmptyTextSchema,
});

export const billingPlanSchema = z.object({
  id: z.enum(["standard", "enterprise", "custom"]),
  name: nonEmptyTextSchema,
  audience: nonEmptyTextSchema,
  allowance: nonEmptyTextSchema,
  price: nonEmptyTextSchema.optional(),
  priceSuffix: nonEmptyTextSchema.optional(),
  priceLabel: nonEmptyTextSchema.optional(),
  features: z.array(nonEmptyTextSchema).min(1),
  ctaLabel: nonEmptyTextSchema,
  current: z.boolean().default(false),
});

export const billingInvoiceSchema = z.object({
  id: nonEmptyTextSchema,
  date: nonEmptyTextSchema,
  amount: nonEmptyTextSchema,
  status: z.literal("Paid"),
  plan: nonEmptyTextSchema,
});

export const billingPageDataSchema = z.object({
  subscription: billingSubscriptionSchema,
  paymentMethod: paymentMethodSchema,
  plans: z.array(billingPlanSchema).length(3),
  invoices: z.array(billingInvoiceSchema).max(6),
});

export type BillingSubscription = z.infer<typeof billingSubscriptionSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type BillingPlan = z.infer<typeof billingPlanSchema>;
export type BillingInvoice = z.infer<typeof billingInvoiceSchema>;

