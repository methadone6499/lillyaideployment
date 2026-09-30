import { z } from "zod";

import {
  amountMinorSchema,
  companyNameSchema,
  nonEmptyIdSchema,
  nullableHttpUrlSchema,
  planTypeSchema,
  subscriptionScopeSchema,
  utcIsoDateTimeSchema,
} from "@/features/billing";

export const CUSTOM_TEXT_MAX_LENGTH = 4000;
export const CUSTOM_SEARCH_MAX_LENGTH = 100;

const INTERNATIONAL_PHONE_PATTERN = /^\+[1-9]\d{6,14}$/;
const PHONE_SEPARATOR_PATTERN = /[\s.\-()]/g;

export const customRequestStatusSchema = z.enum([
  "submitted",
  "under_review",
  "action_required",
  "offered",
  "changes_requested",
  "payment_pending",
  "activated",
  "closed",
  "cancelled",
]);

export const ACTIVE_CUSTOM_REQUEST_STATUSES = [
  "submitted",
  "under_review",
  "action_required",
  "offered",
  "changes_requested",
  "payment_pending",
] as const satisfies readonly z.infer<typeof customRequestStatusSchema>[];

export const TERMINAL_CUSTOM_REQUEST_STATUSES = [
  "activated",
  "closed",
  "cancelled",
] as const satisfies readonly z.infer<typeof customRequestStatusSchema>[];

export const customOfferStatusSchema = z.enum([
  "draft",
  "published",
  "accepted",
  "changes_requested",
  "declined",
  "expired",
  "superseded",
  "cancelled",
]);

export const customerCommunicationKindSchema = z.enum([
  "action_required",
  "changes_requested",
  "declined",
]);

export const adminCommunicationKindSchema = z.enum([
  "action_required",
  "changes_requested",
  "declined",
  "closed",
  "internal_note",
]);

export const communicationVisibilitySchema = z.enum(["customer", "internal"]);

export const customCurrencySchema = z.literal("usd");

export const customBillingIntervalSchema = z.literal("month");

export const acceptanceRequestStatusSchema = z.enum([
  "payment_pending",
  "activated",
]);

export const paymentKindSchema = z.enum(["checkout", "invoice", "none"]);

export const emailDeliveryTriggerSchema = z.enum([
  "published",
  "customer_resend",
  "admin_resend",
  "admin_closed",
  "admin_close_resend",
]);

export const emailDeliveryStatusSchema = z.enum(["pending", "sent", "failed"]);

export const adminActiveFilterSchema = z.enum(["true", "false", "all"]);

const revisionSchema = z.number().int().nonnegative();
const positiveCountSchema = z.number().int().min(1);
const nonNegativeCountSchema = z.number().int().nonnegative();
const positiveAmountMinorSchema = z.number().int().min(1);
const nullableDateTimeSchema = utcIsoDateTimeSchema.nullable();
const customTextSchema = z.string().trim().min(1).max(CUSTOM_TEXT_MAX_LENGTH);

export const adminIdentitySchema = z.object({
  user_id: nonEmptyIdSchema,
  full_name: z.string().nullable(),
  email: z.string().nullable(),
});

export const customRequestSchema = z.object({
  id: nonEmptyIdSchema,
  revision: revisionSchema,
  target_scope_type: subscriptionScopeSchema,
  current_subscription_id: nonEmptyIdSchema.nullable(),
  current_plan_type: planTypeSchema.nullable(),
  company_name: z.string(),
  billing_email: z.string(),
  contact_phone: z.string().nullable(),
  requested_seats: positiveCountSchema,
  requested_reports: positiveCountSchema,
  notes: z.string().nullable(),
  action_required_message: z.string().nullable(),
  status: customRequestStatusSchema,
  active: z.boolean(),
  created_at: utcIsoDateTimeSchema,
  updated_at: utcIsoDateTimeSchema,
});

export const adminCustomRequestSchema = customRequestSchema.extend({
  requester_user_id: nonEmptyIdSchema,
  billing_owner_user_id: nonEmptyIdSchema,
  target_scope_id: nonEmptyIdSchema,
  requester: adminIdentitySchema,
  billing_owner: adminIdentitySchema,
});

export const customOfferSchema = z.object({
  id: nonEmptyIdSchema,
  request_id: nonEmptyIdSchema,
  revision: positiveCountSchema,
  source_request_revision: revisionSchema,
  supersedes_offer_id: nonEmptyIdSchema.nullable(),
  company_name: z.string(),
  amount_minor: amountMinorSchema,
  currency: customCurrencySchema,
  billing_interval: customBillingIntervalSchema,
  seats: positiveCountSchema,
  reports: nonNegativeCountSchema,
  status: customOfferStatusSchema,
  published_at: nullableDateTimeSchema,
  expires_at: nullableDateTimeSchema,
  accepted_at: nullableDateTimeSchema,
  checkout_url: nullableHttpUrlSchema,
  checkout_expires_at: nullableDateTimeSchema,
  hosted_invoice_url: nullableHttpUrlSchema,
  payment_started_at: nullableDateTimeSchema,
  created_at: utcIsoDateTimeSchema,
  updated_at: utcIsoDateTimeSchema,
});

export const customerCommunicationSchema = z.object({
  id: nonEmptyIdSchema,
  offer_id: nonEmptyIdSchema.nullable(),
  kind: customerCommunicationKindSchema,
  message: z.string(),
  suggested_seats: positiveCountSchema.nullable(),
  suggested_reports: positiveCountSchema.nullable(),
  suggested_amount_minor: positiveAmountMinorSchema.nullable(),
  created_at: utcIsoDateTimeSchema,
});

const CUSTOMER_VISIBLE_KINDS = new Set<string>(
  customerCommunicationKindSchema.options,
);

/**
 * Customer endpoints never return internal notes. Drop anything that is not a
 * customer-visible kind anyway, so a backend regression cannot surface them.
 */
export function isCustomerVisibleCommunication(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  if (record.visibility !== undefined && record.visibility !== "customer") {
    return false;
  }

  return typeof record.kind === "string" && CUSTOMER_VISIBLE_KINDS.has(record.kind);
}

export const customerCommunicationListSchema = z
  .array(z.unknown())
  .transform((items) => items.filter(isCustomerVisibleCommunication))
  .pipe(z.array(customerCommunicationSchema));

export const adminCommunicationSchema = z.object({
  id: nonEmptyIdSchema,
  request_id: nonEmptyIdSchema,
  offer_id: nonEmptyIdSchema.nullable(),
  author_user_id: nonEmptyIdSchema,
  kind: adminCommunicationKindSchema,
  visibility: communicationVisibilitySchema,
  message: z.string(),
  suggested_seats: positiveCountSchema.nullable(),
  suggested_reports: positiveCountSchema.nullable(),
  suggested_amount_minor: positiveAmountMinorSchema.nullable(),
  created_at: utcIsoDateTimeSchema,
  author: adminIdentitySchema.nullable(),
});

export const customerOfferStateSchema = z.object({
  request: customRequestSchema,
  offer: customOfferSchema.nullable(),
  communications: customerCommunicationListSchema,
});

export const acceptanceResultSchema = z.object({
  offer: customOfferSchema,
  request_status: acceptanceRequestStatusSchema,
  payment_kind: paymentKindSchema,
  payment_url: nullableHttpUrlSchema,
  checkout_expires_at: nullableDateTimeSchema,
});

export const emailDeliverySchema = z.object({
  id: nonEmptyIdSchema,
  offer_id: nonEmptyIdSchema.nullable(),
  request_id: nonEmptyIdSchema,
  recipient_email: z.string(),
  trigger: emailDeliveryTriggerSchema,
  status: emailDeliveryStatusSchema,
  created_at: utcIsoDateTimeSchema,
  updated_at: utcIsoDateTimeSchema,
  sent_at: nullableDateTimeSchema,
});

export const adminCustomRequestClosedSchema = adminCustomRequestSchema.extend({
  close_email: emailDeliverySchema,
});

export const adminCustomRequestDetailSchema = z.object({
  request: adminCustomRequestSchema,
  offers: z.array(customOfferSchema),
  communications: z.array(adminCommunicationSchema),
  close_email: emailDeliverySchema.nullable(),
});

export const adminCustomRequestListSchema = z.object({
  items: z.array(adminCustomRequestSchema),
  next_cursor: z.string().min(1).nullable(),
  counts_by_status: z.partialRecord(
    customRequestStatusSchema,
    nonNegativeCountSchema,
  ),
});

export const seatsExceedOfferDetailsSchema = z.object({
  offer_seats: nonNegativeCountSchema,
  occupied_membership_seats: nonNegativeCountSchema,
  pending_invitation_seats: nonNegativeCountSchema,
  total_occupied_seats: nonNegativeCountSchema,
  seats_to_free: nonNegativeCountSchema,
});

export function normalizeContactPhone(value: string): string {
  return value.trim().replace(PHONE_SEPARATOR_PATTERN, "");
}

export const contactPhoneSchema = z
  .string()
  .transform(normalizeContactPhone)
  .pipe(
    z
      .string()
      .regex(
        INTERNATIONAL_PHONE_PATTERN,
        "Use an international number such as +14155552671.",
      ),
  );

export const createCustomRequestBodySchema = z
  .object({
    company_name: companyNameSchema.optional(),
    billing_email: z.email(),
    contact_phone: contactPhoneSchema.optional(),
    requested_seats: positiveCountSchema,
    requested_reports: positiveCountSchema,
    notes: z.string().trim().max(CUSTOM_TEXT_MAX_LENGTH).optional(),
  })
  .strict();

export const updateCustomRequestBodySchema = z
  .object({
    expected_revision: revisionSchema,
    company_name: companyNameSchema.optional(),
    billing_email: z.email().optional(),
    contact_phone: contactPhoneSchema.nullable().optional(),
    requested_seats: positiveCountSchema.optional(),
    requested_reports: positiveCountSchema.optional(),
    notes: z.string().trim().max(CUSTOM_TEXT_MAX_LENGTH).nullable().optional(),
  })
  .strict()
  .refine(
    (body) =>
      Object.entries(body).some(
        ([key, value]) => key !== "expected_revision" && value !== undefined,
      ),
    { error: "Change at least one field before saving." },
  );

export const expectedRevisionBodySchema = z
  .object({
    expected_revision: revisionSchema,
  })
  .strict();

export const requestChangesBodySchema = z
  .object({
    message: customTextSchema,
    suggested_seats: positiveCountSchema.nullable().optional(),
    suggested_reports: positiveCountSchema.nullable().optional(),
    suggested_amount_minor: positiveAmountMinorSchema.nullable().optional(),
  })
  .strict();

export const declineOfferBodySchema = z
  .object({
    reason: z.string().trim().max(CUSTOM_TEXT_MAX_LENGTH).optional(),
  })
  .strict();

export const actionRequiredBodySchema = z
  .object({
    expected_revision: revisionSchema,
    message: customTextSchema,
  })
  .strict();

export const closeRequestBodySchema = z
  .object({
    expected_revision: revisionSchema,
    reason: customTextSchema,
  })
  .strict();

export const internalNoteBodySchema = z
  .object({
    message: customTextSchema,
  })
  .strict();

export const offerTermsSchema = z
  .object({
    company_name: companyNameSchema,
    amount_minor: positiveAmountMinorSchema,
    currency: customCurrencySchema,
    seats: positiveCountSchema,
    reports: positiveCountSchema,
  })
  .strict();

export const createOfferDraftBodySchema = offerTermsSchema
  .extend({
    expected_request_revision: revisionSchema,
  })
  .strict();

export type CustomRequestStatus = z.infer<typeof customRequestStatusSchema>;
export type ActiveCustomRequestStatus =
  (typeof ACTIVE_CUSTOM_REQUEST_STATUSES)[number];
export type CustomOfferStatus = z.infer<typeof customOfferStatusSchema>;
export type CustomerCommunicationKind = z.infer<
  typeof customerCommunicationKindSchema
>;
export type AdminCommunicationKind = z.infer<
  typeof adminCommunicationKindSchema
>;
export type CommunicationVisibility = z.infer<
  typeof communicationVisibilitySchema
>;
export type PaymentKind = z.infer<typeof paymentKindSchema>;
export type EmailDeliveryTrigger = z.infer<typeof emailDeliveryTriggerSchema>;
export type EmailDeliveryStatus = z.infer<typeof emailDeliveryStatusSchema>;
export type AdminActiveFilter = z.infer<typeof adminActiveFilterSchema>;
export type AdminIdentity = z.infer<typeof adminIdentitySchema>;
export type CustomRequest = z.infer<typeof customRequestSchema>;
export type AdminCustomRequest = z.infer<typeof adminCustomRequestSchema>;
export type CustomOffer = z.infer<typeof customOfferSchema>;
export type CustomerCommunication = z.infer<
  typeof customerCommunicationSchema
>;
export type AdminCommunication = z.infer<typeof adminCommunicationSchema>;
export type CustomerOfferState = z.infer<typeof customerOfferStateSchema>;
export type AcceptanceResult = z.infer<typeof acceptanceResultSchema>;
export type EmailDelivery = z.infer<typeof emailDeliverySchema>;
export type AdminCustomRequestClosed = z.infer<
  typeof adminCustomRequestClosedSchema
>;
export type AdminCustomRequestDetail = z.infer<
  typeof adminCustomRequestDetailSchema
>;
export type AdminCustomRequestList = z.infer<
  typeof adminCustomRequestListSchema
>;
export type SeatsExceedOfferDetails = z.infer<
  typeof seatsExceedOfferDetailsSchema
>;
export type CreateCustomRequestBody = z.input<
  typeof createCustomRequestBodySchema
>;
export type UpdateCustomRequestBody = z.input<
  typeof updateCustomRequestBodySchema
>;
export type RequestChangesBody = z.input<typeof requestChangesBodySchema>;
export type DeclineOfferBody = z.input<typeof declineOfferBodySchema>;
export type ActionRequiredBody = z.input<typeof actionRequiredBodySchema>;
export type CloseRequestBody = z.input<typeof closeRequestBodySchema>;
export type InternalNoteBody = z.input<typeof internalNoteBodySchema>;
export type OfferTerms = z.input<typeof offerTermsSchema>;
export type CreateOfferDraftBody = z.input<typeof createOfferDraftBodySchema>;
