import { z } from "zod";

import { currencyCodeSchema, nonEmptyIdSchema } from "./billingSchemas";

const documentUrlSchema = z.url({ protocol: /^https?$/ }).nullable();

export const billingHistoryItemSchema = z.object({
  id: nonEmptyIdSchema,
  kind: z.enum(["subscription_invoice", "top_up"]),
  reference: z.string().min(1),
  date: z.iso.datetime({ offset: true }),
  amount_minor: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  currency: currencyCodeSchema,
  status: z.string().min(1),
  description: z.string(),
  document_url: documentUrlSchema,
  hosted_url: documentUrlSchema,
});

export const billingHistoryPageSchema = z.object({
  items: z.array(billingHistoryItemSchema),
  next_cursor: z.string().min(1).nullable(),
});

export const billingHistoryRequestSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).optional(),
}).strict();

export type BillingHistoryItem = z.infer<typeof billingHistoryItemSchema>;
export type BillingHistoryPage = z.infer<typeof billingHistoryPageSchema>;
