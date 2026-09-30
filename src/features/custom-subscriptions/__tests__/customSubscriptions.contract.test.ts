import assert from "node:assert/strict";

import { subscriptionOverviewSchema } from "@/features/billing";
import { ApiRequestError } from "@/services/ApiRequestError";
import { z } from "zod";

import { buildAdminCustomRequestListUrl } from "../api/adminCustomSubscriptionApi";
import { customSubscriptionQueryKeys } from "../api/customSubscriptionQueryKeys";
import {
  acceptanceResultSchema,
  adminCustomRequestClosedSchema,
  adminCustomRequestDetailSchema,
  adminCustomRequestListSchema,
  createCustomRequestBodySchema,
  createOfferDraftBodySchema,
  customOfferSchema,
  customRequestSchema,
  customerOfferStateSchema,
  declineOfferBodySchema,
  emailDeliverySchema,
  offerTermsSchema,
  requestChangesBodySchema,
  updateCustomRequestBodySchema,
  type CustomerOfferState,
  type CustomRequestStatus,
} from "../schemas/customSubscriptionSchemas";
import {
  ADMIN_CUSTOM_REQUEST_TABS,
  buildAdminCustomRequestPath,
  countAdminCustomRequestTab,
  getAdminCustomRequestTab,
  selectAdminCustomRequestActions,
} from "../utils/adminCustomRequestQueue";
import {
  classifyCustomSubscriptionError,
  isCustomRequestNotFoundError,
} from "../utils/classifyCustomSubscriptionError";
import {
  buildCreateCustomRequestBody,
  buildInitialCustomRequestFormValues,
  buildUpdateCustomRequestBody,
} from "../utils/customRequestForm";
import {
  formatIdentity,
  formatMonthlyPrice,
  formatTimeRemaining,
  formatUsdAmountInput,
  parsePositiveIntegerInput,
  parseUsdAmountInput,
} from "../utils/formatCustomSubscription";
import {
  CUSTOM_OFFER_FAST_POLL_INTERVAL_MS,
  CUSTOM_OFFER_PAYMENT_POLL_INTERVAL_MS,
  CUSTOM_OFFER_WAITING_POLL_INTERVAL_MS,
  getCustomOfferStatePollInterval,
  isCompanyNameLocked,
  isCustomRequestEditable,
  isOutdatedOfferLink,
  predictCustomPaymentKind,
  selectCustomOfferExpiry,
  selectCustomPaymentLink,
  selectCustomRequestView,
} from "../utils/selectCustomRequestView";
import {
  getCustomSubscriptionRetryDelay,
  shouldRetryCustomSubscriptionMutation,
  shouldRetryCustomSubscriptionQuery,
} from "../utils/shouldRetryCustomSubscriptionQuery";

const REQUEST_ID = "custom_subscription_request_0b6f5c0e-5b1f-4c7c-9a1b-4a5b1f2f3e11";
const OFFER_ID = "custom_subscription_offer_6ed2f443-fd21-4e4d-b98a-91582e15fed4";
const SUBSCRIPTION_ID = "subscription_4f1b8e6a-0c43-4a37-9f6e-2d3c1b0a9e88";

function buildRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: REQUEST_ID,
    revision: 2,
    target_scope_type: "company",
    current_subscription_id: SUBSCRIPTION_ID,
    current_plan_type: "enterprise",
    company_name: "Acme Pharma",
    billing_email: "billing@acme.example",
    contact_phone: null,
    requested_seats: 15,
    requested_reports: 150,
    notes: null,
    action_required_message: null,
    status: "under_review",
    active: true,
    created_at: "2026-09-28T12:00:00Z",
    updated_at: "2026-09-28T14:10:00Z",
    ...overrides,
  };
}

function buildOffer(overrides: Record<string, unknown> = {}) {
  return {
    id: OFFER_ID,
    request_id: REQUEST_ID,
    revision: 1,
    source_request_revision: 4,
    supersedes_offer_id: null,
    company_name: "Acme Pharma",
    amount_minor: 75000,
    currency: "usd",
    billing_interval: "month",
    seats: 15,
    reports: 150,
    status: "published",
    published_at: "2026-09-29T09:00:00Z",
    expires_at: "2026-10-06T09:00:00Z",
    accepted_at: null,
    checkout_url: null,
    checkout_expires_at: null,
    hosted_invoice_url: null,
    payment_started_at: null,
    created_at: "2026-09-29T08:30:00Z",
    updated_at: "2026-09-29T09:00:00Z",
    ...overrides,
  };
}

function buildIdentity(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "user_2f7c",
    full_name: "Mustafa Khalid",
    email: "mustafa@acme.example",
    ...overrides,
  };
}

function buildAdminRequest(overrides: Record<string, unknown> = {}) {
  return {
    ...buildRequest(),
    requester_user_id: "user_2f7c",
    billing_owner_user_id: "user_2f7c",
    target_scope_id: "company_8d1e",
    requester: buildIdentity(),
    billing_owner: buildIdentity(),
    ...overrides,
  };
}

function buildEmailDelivery(overrides: Record<string, unknown> = {}) {
  return {
    id: "custom_subscription_email_delivery_5d0e",
    offer_id: OFFER_ID,
    request_id: REQUEST_ID,
    recipient_email: "billing@acme.example",
    trigger: "customer_resend",
    status: "sent",
    created_at: "2026-09-29T10:00:00Z",
    updated_at: "2026-09-29T10:00:01Z",
    sent_at: "2026-09-29T10:00:01Z",
    ...overrides,
  };
}

function buildState(
  requestOverrides: Record<string, unknown> = {},
  offer: Record<string, unknown> | null = null,
  communications: unknown[] = [],
): CustomerOfferState {
  return customerOfferStateSchema.parse({
    request: buildRequest(requestOverrides),
    offer,
    communications,
  });
}

function apiError(
  status: number,
  code: string | null,
  options: { details?: unknown; retryAfterSeconds?: number | null } = {},
) {
  return new ApiRequestError({
    status,
    code,
    message: `server message for ${code ?? status}`,
    details: options.details ?? null,
    requestId: "req_test",
    retryAfterSeconds: options.retryAfterSeconds ?? null,
  });
}

// --- Customer response schemas (handoff §7 examples) ---

assert.equal(customRequestSchema.safeParse(buildRequest()).success, true);
assert.equal(
  customRequestSchema.safeParse(
    buildRequest({
      target_scope_type: "user",
      current_plan_type: "standard",
      contact_phone: "+14155552671",
      notes: "We need reviewer access for our medical affairs team.",
      status: "submitted",
      revision: 1,
    }),
  ).success,
  true,
);
assert.equal(
  customRequestSchema.safeParse(buildRequest({ status: "archived" })).success,
  false,
);
assert.equal(
  customRequestSchema.safeParse(buildRequest({ requested_seats: 0 })).success,
  false,
);
assert.equal(
  customRequestSchema.safeParse(
    buildRequest({ created_at: "2026-09-28T12:00:00+05:00" }),
  ).success,
  false,
);

assert.equal(customOfferSchema.safeParse(buildOffer()).success, true);
assert.equal(
  customOfferSchema.safeParse(buildOffer({ currency: "eur" })).success,
  false,
);
assert.equal(
  customOfferSchema.safeParse(buildOffer({ billing_interval: "year" })).success,
  false,
);
assert.equal(
  customOfferSchema.safeParse(buildOffer({ amount_minor: -1 })).success,
  false,
);
assert.equal(
  customOfferSchema.safeParse(buildOffer({ checkout_url: "not a url" })).success,
  false,
);

const underReviewState = buildState();
assert.equal(underReviewState.offer, null);
assert.deepEqual(underReviewState.communications, []);

const actionRequiredState = buildState(
  {
    status: "action_required",
    revision: 3,
    action_required_message: "Please confirm how many reviewers need access.",
  },
  null,
  [
    {
      id: "custom_subscription_communication_7c2a",
      offer_id: null,
      kind: "action_required",
      message: "Please confirm how many reviewers need access.",
      suggested_seats: null,
      suggested_reports: null,
      suggested_amount_minor: null,
      created_at: "2026-09-28T15:00:00Z",
    },
  ],
);
assert.equal(actionRequiredState.communications.length, 1);

const offeredState = buildState({ status: "offered", revision: 5 }, buildOffer());
assert.equal(offeredState.offer?.status, "published");

const invoicePendingState = buildState(
  { status: "payment_pending", revision: 6 },
  buildOffer({
    status: "accepted",
    accepted_at: "2026-09-30T10:00:00Z",
    hosted_invoice_url: "https://invoice.stripe.com/i/acct_123/test_abc",
    payment_started_at: "2026-09-30T10:00:02Z",
  }),
);
assert.deepEqual(selectCustomPaymentLink(invoicePendingState.offer), {
  kind: "invoice",
  url: "https://invoice.stripe.com/i/acct_123/test_abc",
});

const checkoutPendingOffer = customOfferSchema.parse(
  buildOffer({
    status: "accepted",
    checkout_url: "https://checkout.stripe.com/c/pay/cs_test_a1b2c3",
    checkout_expires_at: "2026-10-01T09:00:00Z",
  }),
);
assert.deepEqual(selectCustomPaymentLink(checkoutPendingOffer), {
  kind: "checkout",
  url: "https://checkout.stripe.com/c/pay/cs_test_a1b2c3",
});
assert.equal(selectCustomPaymentLink(customOfferSchema.parse(buildOffer())), null);
assert.equal(selectCustomPaymentLink(null), null);

const changesRequestedState = buildState(
  { status: "changes_requested", revision: 6 },
  null,
  [
    {
      id: "custom_subscription_communication_91be",
      offer_id: OFFER_ID,
      kind: "changes_requested",
      message: "Could we get 20 seats for the same budget?",
      suggested_seats: 20,
      suggested_reports: null,
      suggested_amount_minor: 75000,
      created_at: "2026-09-30T10:00:00Z",
    },
  ],
);
assert.equal(changesRequestedState.communications[0]?.suggested_seats, 20);

// Internal notes must never reach the customer, even if a backend regression
// returns them on the customer endpoint.
const leakedState = buildState({ status: "under_review" }, null, [
  {
    id: "custom_subscription_communication_internal",
    request_id: REQUEST_ID,
    offer_id: null,
    author_user_id: "user_super_admin_1",
    kind: "internal_note",
    visibility: "internal",
    message: "Called the customer; budget ~$750/month.",
    suggested_seats: null,
    suggested_reports: null,
    suggested_amount_minor: null,
    created_at: "2026-09-29T08:00:00Z",
  },
  {
    id: "custom_subscription_communication_internal_kind",
    offer_id: null,
    kind: "action_required",
    visibility: "internal",
    message: "Internal copy of a customer message.",
    suggested_seats: null,
    suggested_reports: null,
    suggested_amount_minor: null,
    created_at: "2026-09-29T08:10:00Z",
  },
]);
assert.deepEqual(leakedState.communications, []);

for (const result of [
  {
    offer: buildOffer({
      status: "accepted",
      checkout_url: "https://checkout.stripe.com/c/pay/cs_test_a1b2c3",
      checkout_expires_at: "2026-10-01T09:00:00Z",
    }),
    request_status: "payment_pending",
    payment_kind: "checkout",
    payment_url: "https://checkout.stripe.com/c/pay/cs_test_a1b2c3",
    checkout_expires_at: "2026-10-01T09:00:00Z",
  },
  {
    offer: buildOffer({
      status: "accepted",
      hosted_invoice_url: "https://invoice.stripe.com/i/acct_123/test_abc",
    }),
    request_status: "payment_pending",
    payment_kind: "invoice",
    payment_url: "https://invoice.stripe.com/i/acct_123/test_abc",
    checkout_expires_at: null,
  },
  {
    offer: buildOffer({ status: "accepted", revision: 2, seats: 20 }),
    request_status: "activated",
    payment_kind: "none",
    payment_url: null,
    checkout_expires_at: null,
  },
]) {
  assert.equal(acceptanceResultSchema.safeParse(result).success, true);
}
assert.equal(
  acceptanceResultSchema.safeParse({
    offer: buildOffer(),
    request_status: "offered",
    payment_kind: "none",
    payment_url: null,
    checkout_expires_at: null,
  }).success,
  false,
);

assert.equal(emailDeliverySchema.safeParse(buildEmailDelivery()).success, true);
assert.equal(
  emailDeliverySchema.safeParse(buildEmailDelivery({ status: "queued" })).success,
  false,
);

// --- Admin schemas (handoff §8) ---

const adminList = adminCustomRequestListSchema.parse({
  items: [
    buildAdminRequest({
      status: "submitted",
      requester: buildIdentity({ full_name: null, email: null }),
    }),
  ],
  next_cursor: "eyJjcmVhdGVkX2F0Ijo",
  counts_by_status: { submitted: 4, under_review: 2, offered: 1 },
});
assert.equal(adminList.items[0]?.requester.full_name, null);
assert.equal(
  adminCustomRequestListSchema.safeParse({
    items: [],
    next_cursor: null,
    counts_by_status: { unknown_status: 1 },
  }).success,
  false,
);

const adminDetail = adminCustomRequestDetailSchema.parse({
  request: buildAdminRequest({ status: "under_review" }),
  offers: [buildOffer({ status: "draft", published_at: null, expires_at: null })],
  communications: [
    {
      id: "custom_subscription_communication_aa01",
      request_id: REQUEST_ID,
      offer_id: null,
      author_user_id: "user_super_admin_1",
      kind: "internal_note",
      visibility: "internal",
      message: "Called the customer; budget ~$750/month.",
      suggested_seats: null,
      suggested_reports: null,
      suggested_amount_minor: null,
      created_at: "2026-09-29T08:00:00Z",
      author: null,
    },
  ],
  close_email: null,
});
assert.equal(adminDetail.communications[0]?.visibility, "internal");

const closedResponse = adminCustomRequestClosedSchema.parse({
  ...buildAdminRequest({ status: "closed", active: false, revision: 6 }),
  close_email: buildEmailDelivery({
    offer_id: null,
    trigger: "admin_closed",
    status: "failed",
    sent_at: null,
  }),
});
assert.equal(closedResponse.close_email.status, "failed");

// --- Request bodies ---

const normalizedCreate = createCustomRequestBodySchema.parse({
  company_name: "Acme Pharma",
  billing_email: "billing@acme.example",
  contact_phone: "+1 (415) 555-2671",
  requested_seats: 15,
  requested_reports: 120,
  notes: "We need reviewer access for our medical affairs team.",
});
assert.equal(normalizedCreate.contact_phone, "+14155552671");
assert.equal(
  createCustomRequestBodySchema.safeParse({
    billing_email: "billing@acme.example",
    contact_phone: "0301 1234567",
    requested_seats: 1,
    requested_reports: 1,
  }).success,
  false,
);
assert.equal(
  createCustomRequestBodySchema.safeParse({
    billing_email: "billing@acme.example",
    requested_seats: 1,
    requested_reports: 1,
    currency: "usd",
  }).success,
  false,
);
assert.equal(
  updateCustomRequestBodySchema.safeParse({ expected_revision: 3 }).success,
  false,
);
assert.equal(
  updateCustomRequestBodySchema.safeParse({
    expected_revision: 3,
    requested_seats: 20,
  }).success,
  true,
);
assert.equal(
  requestChangesBodySchema.safeParse({ message: "   " }).success,
  false,
);
assert.equal(
  requestChangesBodySchema.safeParse({
    message: "Could we get 20 seats for the same budget?",
    suggested_seats: 20,
    suggested_reports: null,
    suggested_amount_minor: 75000,
  }).success,
  true,
);
assert.equal(
  requestChangesBodySchema.safeParse({
    message: "Cheaper please",
    suggested_amount_minor: 0,
  }).success,
  false,
);
assert.equal(declineOfferBodySchema.safeParse({}).success, true);
assert.equal(
  offerTermsSchema.safeParse({
    company_name: "Acme Pharma",
    amount_minor: 75000,
    currency: "eur",
    seats: 15,
    reports: 150,
  }).success,
  false,
);
assert.equal(
  createOfferDraftBodySchema.safeParse({
    expected_request_revision: 2,
    company_name: "Acme Pharma",
    amount_minor: 75000,
    currency: "usd",
    seats: 15,
    reports: 150,
  }).success,
  true,
);

// --- Form builders ---

const personalFormValues = {
  companyName: "  Acme Pharma  ",
  billingEmail: "billing@acme.example",
  contactPhone: "+44 20 7946 0958",
  requestedSeats: "15",
  requestedReports: "120",
  notes: "",
};
assert.deepEqual(
  buildCreateCustomRequestBody(personalFormValues, { includeCompanyName: true }),
  {
    ok: true,
    body: {
      company_name: "Acme Pharma",
      billing_email: "billing@acme.example",
      contact_phone: "+442079460958",
      requested_seats: 15,
      requested_reports: 120,
    },
  },
);
const companyCreate = buildCreateCustomRequestBody(personalFormValues, {
  includeCompanyName: false,
});
assert.equal(companyCreate.ok && "company_name" in companyCreate.body, false);
const invalidCreate = buildCreateCustomRequestBody(
  {
    companyName: "",
    billingEmail: "not-an-email",
    contactPhone: "0301 1234567",
    requestedSeats: "0",
    requestedReports: "ten",
    notes: "",
  },
  { includeCompanyName: true },
);
assert.equal(invalidCreate.ok, false);
if (!invalidCreate.ok) {
  assert.deepEqual(Object.keys(invalidCreate.fieldErrors).sort(), [
    "billing_email",
    "company_name",
    "contact_phone",
    "requested_reports",
    "requested_seats",
  ]);
}

const companyRequest = customRequestSchema.parse(
  buildRequest({ contact_phone: "+14155552671", notes: "Initial notes" }),
);
const unchangedValues = buildInitialCustomRequestFormValues({
  request: companyRequest,
});
assert.deepEqual(buildUpdateCustomRequestBody(unchangedValues, companyRequest), {
  ok: true,
  body: null,
});
assert.deepEqual(
  buildUpdateCustomRequestBody(
    {
      ...unchangedValues,
      companyName: "Renamed Co",
      requestedSeats: "20",
      notes: "Updated headcount after budget approval.",
    },
    companyRequest,
  ),
  {
    ok: true,
    body: {
      expected_revision: 2,
      requested_seats: 20,
      notes: "Updated headcount after budget approval.",
    },
  },
);
assert.deepEqual(
  buildUpdateCustomRequestBody(
    { ...unchangedValues, contactPhone: "", notes: "" },
    companyRequest,
  ),
  {
    ok: true,
    body: { expected_revision: 2, contact_phone: null, notes: null },
  },
);
const personalRequest = customRequestSchema.parse(
  buildRequest({ target_scope_type: "user", current_plan_type: "standard" }),
);
assert.deepEqual(
  buildUpdateCustomRequestBody(
    {
      ...buildInitialCustomRequestFormValues({ request: personalRequest }),
      companyName: "New Name Ltd",
    },
    personalRequest,
  ),
  { ok: true, body: { expected_revision: 2, company_name: "New Name Ltd" } },
);
assert.equal(isCompanyNameLocked(companyRequest), true);
assert.equal(isCompanyNameLocked(personalRequest), false);

// --- Status view model ---

const expectedViews: Record<
  CustomRequestStatus,
  { kind: string; canEdit: boolean; canCancel: boolean }
> = {
  submitted: { kind: "under_review", canEdit: true, canCancel: true },
  under_review: { kind: "under_review", canEdit: true, canCancel: true },
  action_required: { kind: "action_required", canEdit: true, canCancel: true },
  changes_requested: {
    kind: "changes_requested",
    canEdit: true,
    canCancel: true,
  },
  offered: { kind: "offered", canEdit: false, canCancel: false },
  payment_pending: { kind: "payment_pending", canEdit: false, canCancel: false },
  activated: { kind: "finished", canEdit: false, canCancel: false },
  closed: { kind: "finished", canEdit: false, canCancel: false },
  cancelled: { kind: "finished", canEdit: false, canCancel: false },
};

for (const [status, expected] of Object.entries(expectedViews)) {
  const view = selectCustomRequestView(
    buildState({ status, active: !["activated", "closed", "cancelled"].includes(status) }),
  );
  assert.equal(view.kind, expected.kind, status);
  assert.equal(view.canEdit, expected.canEdit, status);
  assert.equal(view.canCancel, expected.canCancel, status);
  assert.equal(
    isCustomRequestEditable(status as CustomRequestStatus),
    expected.canEdit,
    status,
  );
}
assert.equal(
  selectCustomRequestView(actionRequiredState).description,
  "Please confirm how many reviewers need access.",
);
assert.equal(selectCustomRequestView(offeredState).offer?.id, OFFER_ID);

// --- Expiry, payment prediction, polling, email link ---

const publishedOffer = customOfferSchema.parse(buildOffer());
const expiresMs = Date.parse("2026-10-06T09:00:00Z");
assert.deepEqual(selectCustomOfferExpiry(publishedOffer, expiresMs - 2 * 86_400_000), {
  expiresAt: "2026-10-06T09:00:00Z",
  msRemaining: 2 * 86_400_000,
  isExpired: false,
  isExpiringSoon: false,
});
assert.equal(
  selectCustomOfferExpiry(publishedOffer, expiresMs - 10 * 60_000)?.isExpiringSoon,
  true,
);
assert.equal(selectCustomOfferExpiry(publishedOffer, expiresMs)?.isExpired, true);
assert.equal(
  selectCustomOfferExpiry(customOfferSchema.parse(buildOffer({ expires_at: null })), 0),
  null,
);

const customOverview = subscriptionOverviewSchema.parse({
  subscription: {
    id: SUBSCRIPTION_ID,
    scope_type: "company",
    plan_type: "custom",
    status: "active",
    amount_minor: 75000,
    currency: "usd",
    billing_interval: "month",
    cancel_at_period_end: false,
    limits: { seats: 15, reports: 150 },
    features: {
      report_generation: true,
      dosage_calculator: true,
      paid_sources: true,
      ai_presentation: true,
      advanced_analytics: true,
      company_seats: true,
      review_submission_enabled: true,
    },
    current_period_start: "2026-09-10T10:00:00Z",
    current_period_end: "2026-10-10T10:00:00Z",
  },
  checkout: null,
  plan_change: null,
  quota: null,
  can_use_paid_features: true,
});
assert.equal(
  predictCustomPaymentKind(
    customRequestSchema.parse(buildRequest({ current_subscription_id: null })),
    publishedOffer,
    customOverview,
  ),
  "checkout",
);
assert.equal(predictCustomPaymentKind(companyRequest, publishedOffer, customOverview), "none");
assert.equal(
  predictCustomPaymentKind(
    companyRequest,
    customOfferSchema.parse(buildOffer({ amount_minor: 90000 })),
    customOverview,
  ),
  "invoice",
);
assert.equal(predictCustomPaymentKind(companyRequest, publishedOffer, undefined), "invoice");

assert.equal(isOutdatedOfferLink(null, offeredState), false);
assert.equal(isOutdatedOfferLink(OFFER_ID, undefined), false);
assert.equal(isOutdatedOfferLink(OFFER_ID, offeredState), false);
assert.equal(isOutdatedOfferLink("custom_subscription_offer_old", offeredState), true);
assert.equal(isOutdatedOfferLink(OFFER_ID, null), true);

const nowMs = Date.parse("2026-09-30T10:00:00Z");
assert.equal(
  getCustomOfferStatePollInterval({
    state: invoicePendingState,
    fastPollUntil: nowMs + 1,
    nowMs,
  }),
  CUSTOM_OFFER_FAST_POLL_INTERVAL_MS,
);
assert.equal(
  getCustomOfferStatePollInterval({
    state: invoicePendingState,
    fastPollUntil: nowMs,
    nowMs,
  }),
  CUSTOM_OFFER_PAYMENT_POLL_INTERVAL_MS,
);
assert.equal(
  getCustomOfferStatePollInterval({ state: underReviewState, fastPollUntil: null, nowMs }),
  CUSTOM_OFFER_WAITING_POLL_INTERVAL_MS,
);
assert.equal(
  getCustomOfferStatePollInterval({ state: null, fastPollUntil: nowMs + 1, nowMs }),
  false,
);
assert.equal(
  getCustomOfferStatePollInterval({ state: undefined, fastPollUntil: null, nowMs }),
  false,
);

// --- Formatting ---

assert.equal(formatMonthlyPrice(75000), "$750.00 / month");
assert.equal(parseUsdAmountInput("750"), 75000);
assert.equal(parseUsdAmountInput("$1,250.5"), 125050);
assert.equal(parseUsdAmountInput("0.01"), 1);
assert.equal(parseUsdAmountInput("0"), null);
assert.equal(parseUsdAmountInput("12.345"), null);
assert.equal(parseUsdAmountInput("-5"), null);
assert.equal(parseUsdAmountInput("abc"), null);
assert.equal(formatUsdAmountInput(75000), "750.00");
assert.equal(parsePositiveIntegerInput(" 15 "), 15);
assert.equal(parsePositiveIntegerInput("0"), null);
assert.equal(parsePositiveIntegerInput("1.5"), null);
assert.equal(formatIdentity(null), "Unknown user");
assert.equal(
  formatIdentity({ user_id: "user_1", full_name: null, email: null }),
  "user_1",
);
assert.equal(
  formatIdentity({ user_id: "user_1", full_name: null, email: "a@b.example" }),
  "a@b.example",
);
assert.equal(formatTimeRemaining(0), "Expired");
assert.equal(formatTimeRemaining(2 * 86_400_000 + 5), "2 days left");
assert.equal(formatTimeRemaining(3_600_000), "1 hour left");
assert.equal(formatTimeRemaining(30_000), "1 minute left");

// --- Error classification (handoff §9) ---

const expectedActions: Record<string, string> = {
  custom_subscription_request_not_found: "refetch",
  custom_subscription_offer_not_found: "refetch",
  custom_subscription_request_already_active: "refetch",
  custom_subscription_request_not_editable: "refetch",
  custom_subscription_request_conflict: "refetch",
  custom_subscription_company_name_locked: "none",
  custom_subscription_billing_action_required: "open_portal",
  company_unavailable: "contact_support",
  company_subscription_not_found: "contact_support",
  custom_subscription_payment_pending: "refetch",
  custom_subscription_offer_expired: "refetch",
  custom_subscription_offer_conflict: "refetch",
  custom_subscription_request_access_changed: "contact_support",
  custom_subscription_seats_exceed_offer: "open_seats",
  subscription_payment_pending: "open_billing",
  custom_subscription_change_not_available: "open_portal",
  custom_subscription_payment_processing: "poll_activation",
  custom_subscription_payment_in_flight: "retry_later",
  custom_subscription_payment_cancel_not_available: "refetch",
  custom_subscription_payment_conflict: "refetch",
  custom_subscription_payment_window_too_short: "request_changes",
  custom_subscription_payment_in_progress: "refetch",
  custom_subscription_offer_email_resend_cooldown: "retry_later",
  custom_subscription_offer_email_daily_limit: "daily_limit",
  custom_subscription_offer_email_not_resendable: "refetch",
  custom_subscription_offer_email_delivery_failed: "retry_later",
  custom_subscription_close_email_not_available: "refetch",
  custom_subscription_close_email_resend_cooldown: "retry_later",
  custom_subscription_close_email_daily_limit: "daily_limit",
  custom_subscription_close_email_delivery_failed: "retry_later",
  custom_subscription_offer_not_editable: "refetch",
  custom_subscription_offer_stale: "republish",
  custom_subscription_draft_offer_exists: "refetch",
  custom_subscription_published_offer_exists: "refetch",
  custom_subscription_offer_revision_conflict: "refetch",
  billing_provider_unavailable: "retry_later",
  custom_billing_not_configured: "contact_support",
  stripe_reconciliation_failed: "contact_support",
  invalid_cursor: "reset_list",
  billing_owner_required: "none",
  custom_subscription_request_not_allowed: "none",
  permission_denied: "none",
};

for (const [code, action] of Object.entries(expectedActions)) {
  const classified = classifyCustomSubscriptionError(apiError(409, code));
  assert.equal(classified.kind, code, code);
  assert.equal(classified.action, action, code);
  assert.notEqual(classified.message, "", code);
}

const seatsExceed = classifyCustomSubscriptionError(
  apiError(409, "custom_subscription_seats_exceed_offer", {
    details: {
      offer_seats: 5,
      occupied_membership_seats: 7,
      pending_invitation_seats: 1,
      total_occupied_seats: 8,
      seats_to_free: 3,
    },
  }),
);
assert.equal(seatsExceed.seatsExceed?.seats_to_free, 3);
assert.equal(
  classifyCustomSubscriptionError(
    apiError(409, "custom_subscription_seats_exceed_offer", { details: null }),
  ).seatsExceed,
  null,
);

const inFlight = classifyCustomSubscriptionError(
  apiError(409, "custom_subscription_payment_in_flight", {
    details: { retry_after_seconds: 180 },
    retryAfterSeconds: 180,
  }),
);
assert.equal(inFlight.retryAfterSeconds, 180);

const reconciliationFailure = classifyCustomSubscriptionError(
  apiError(409, "stripe_reconciliation_failed"),
);
assert.equal(reconciliationFailure.showRequestId, true);
assert.equal(reconciliationFailure.requestId, "req_test");

assert.equal(classifyCustomSubscriptionError(apiError(401, null)).action, "sign_in");
assert.equal(classifyCustomSubscriptionError(apiError(403, null)).kind, "permission_denied");
assert.equal(classifyCustomSubscriptionError(apiError(404, null)).action, "refetch");
assert.equal(classifyCustomSubscriptionError(apiError(503, null)).retryable, true);
assert.equal(
  classifyCustomSubscriptionError(new TypeError("Failed to fetch")).kind,
  "retryable",
);
const validation = classifyCustomSubscriptionError(
  new ApiRequestError({
    status: 422,
    code: "validation_error",
    message: "Request validation failed",
    fieldErrors: {
      contact_phone:
        "Value error, contact_phone must be an international number such as +14155552671",
    },
  }),
);
assert.equal(validation.kind, "validation_error");
assert.ok(validation.fieldErrors.contact_phone);
const zodFailure = classifyCustomSubscriptionError(
  z.object({ billing_email: z.email() }).safeParse({ billing_email: "x" }).error,
);
assert.equal(zodFailure.kind, "validation_error");
assert.ok(zodFailure.fieldErrors.billing_email);

assert.equal(
  isCustomRequestNotFoundError(apiError(404, "custom_subscription_request_not_found")),
  true,
);
assert.equal(
  isCustomRequestNotFoundError(apiError(404, "custom_subscription_offer_not_found")),
  false,
);

// --- Retry policy ---

assert.equal(shouldRetryCustomSubscriptionQuery(0, apiError(409, "x")), false);
assert.equal(shouldRetryCustomSubscriptionQuery(0, apiError(502, null)), true);
assert.equal(shouldRetryCustomSubscriptionQuery(1, apiError(502, null)), false);
assert.equal(
  shouldRetryCustomSubscriptionMutation(0, apiError(503, "billing_provider_unavailable")),
  true,
);
assert.equal(
  shouldRetryCustomSubscriptionMutation(1, apiError(503, "billing_provider_unavailable")),
  false,
);
assert.equal(
  shouldRetryCustomSubscriptionMutation(0, apiError(409, "custom_subscription_request_conflict")),
  false,
);
assert.equal(
  getCustomSubscriptionRetryDelay(
    0,
    apiError(503, "billing_provider_unavailable", { retryAfterSeconds: 5 }),
  ),
  5_000,
);

// --- Query keys and admin list query construction ---

assert.deepEqual(customSubscriptionQueryKeys.offerState("user-1"), [
  "custom-subscriptions",
  "offer-state",
  "user-1",
]);
assert.deepEqual(customSubscriptionQueryKeys.adminDetail("user-1", REQUEST_ID), [
  "custom-subscriptions",
  "admin",
  "user-1",
  "detail",
  REQUEST_ID,
]);
assert.deepEqual(customSubscriptionQueryKeys.acceptOffer(), [
  "custom-subscriptions",
  "mutation",
  "accept-offer",
]);

const listUrl = new URL(
  buildAdminCustomRequestListUrl({
    statuses: ["submitted", "under_review", "submitted"],
    active: "all",
    search: `  ${"a".repeat(150)}  `,
    limit: 500,
    cursor: "eyJjcmVhdGVkX2F0Ijo",
  }),
  "https://app.example",
);
assert.equal(listUrl.pathname, "/api/v1/admin/custom-subscriptions/requests");
assert.deepEqual(listUrl.searchParams.getAll("statuses"), [
  "submitted",
  "under_review",
]);
assert.equal(listUrl.searchParams.get("active"), "all");
assert.equal(listUrl.searchParams.get("search")?.length, 100);
assert.equal(listUrl.searchParams.get("limit"), "100");
assert.equal(listUrl.searchParams.get("cursor"), "eyJjcmVhdGVkX2F0Ijo");
const defaultListUrl = new URL(buildAdminCustomRequestListUrl(), "https://app.example");
assert.equal(defaultListUrl.searchParams.get("limit"), "20");
assert.equal(defaultListUrl.searchParams.has("active"), false);
assert.equal(defaultListUrl.searchParams.has("search"), false);

// --- Admin queue tabs and actions ---

assert.equal(getAdminCustomRequestTab("active").statuses.length, 6);
assert.equal(
  countAdminCustomRequestTab(
    { submitted: 4, under_review: 2, offered: 1 },
    getAdminCustomRequestTab("active"),
  ),
  7,
);
assert.equal(
  countAdminCustomRequestTab({ offered: 1 }, getAdminCustomRequestTab("waiting")),
  1,
);
assert.equal(
  countAdminCustomRequestTab({}, getAdminCustomRequestTab("finished")),
  0,
);
assert.equal(countAdminCustomRequestTab(undefined, ADMIN_CUSTOM_REQUEST_TABS[0]), 0);
assert.equal(
  buildAdminCustomRequestPath(REQUEST_ID),
  `/super-admin/subscriptions/custom-requests/${REQUEST_ID}`,
);

function buildDetail(
  requestOverrides: Record<string, unknown>,
  offers: Record<string, unknown>[] = [],
  closeEmail: Record<string, unknown> | null = null,
) {
  return adminCustomRequestDetailSchema.parse({
    request: buildAdminRequest(requestOverrides),
    offers,
    communications: [],
    close_email: closeEmail,
  });
}

const submittedActions = selectAdminCustomRequestActions(
  buildDetail({ status: "submitted" }),
);
assert.equal(submittedActions.canStartReview, true);
assert.equal(submittedActions.canRequestInfo, true);
assert.equal(submittedActions.canClose, true);
assert.equal(submittedActions.canCreateDraft, false);

const reviewActions = selectAdminCustomRequestActions(
  buildDetail({ status: "under_review" }),
);
assert.equal(reviewActions.canStartReview, false);
assert.equal(reviewActions.canCreateDraft, true);

const draftActions = selectAdminCustomRequestActions(
  buildDetail({ status: "under_review" }, [
    buildOffer({ status: "draft", published_at: null, expires_at: null }),
  ]),
);
assert.equal(draftActions.canCreateDraft, false);
assert.equal(draftActions.draftOffer?.status, "draft");

const offeredActions = selectAdminCustomRequestActions(
  buildDetail({ status: "offered" }, [buildOffer()]),
);
assert.equal(offeredActions.canRequestInfo, false);
assert.equal(offeredActions.canClose, true);
assert.equal(offeredActions.publishedOffer?.id, OFFER_ID);

const paymentActions = selectAdminCustomRequestActions(
  buildDetail({ status: "payment_pending" }, [buildOffer({ status: "accepted" })]),
);
assert.equal(paymentActions.canClose, false);
assert.equal(paymentActions.canRequestInfo, false);

for (const [status, canResend] of [
  ["failed", true],
  ["pending", true],
  ["sent", false],
] as const) {
  const closedActions = selectAdminCustomRequestActions(
    buildDetail(
      { status: "closed", active: false },
      [],
      buildEmailDelivery({
        offer_id: null,
        trigger: "admin_closed",
        status,
        sent_at: status === "sent" ? "2026-09-29T09:00:01Z" : null,
      }),
    ),
  );
  assert.equal(closedActions.canResendCloseEmail, canResend, status);
  assert.equal(closedActions.canClose, false, status);
}
assert.equal(
  selectAdminCustomRequestActions(buildDetail({ status: "closed", active: false }))
    .canResendCloseEmail,
  false,
);
