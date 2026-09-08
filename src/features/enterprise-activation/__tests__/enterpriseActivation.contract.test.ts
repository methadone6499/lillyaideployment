import assert from "node:assert/strict";

import {
  enterpriseActivationRequestSchema,
  enterpriseActivationResponseSchema,
} from "../schemas/enterpriseActivationSchemas";

function buildActivationResponse() {
  return {
    company_id: "company-1",
    company_name: "Example Pharma",
    billing_email: "admin@example.com",
    primary_admin_user_id: "user-1",
    membership_id: "membership-1",
    role: "company_admin",
    occupies_seat: true,
    subscription_id: "sub-1",
    plan_type: "enterprise",
    subscription_status: "active",
    source: "mock_self_service",
    amount_minor: 240000,
    currency: "GBP",
    billing_interval: "month",
    cancel_at_period_end: false,
    limits: {
      seats: 5,
      reports: 30,
    },
    features: {
      report_generation: true,
      dosage_calculator: true,
      paid_sources: true,
      ai_presentation: true,
      advanced_analytics: true,
      company_seats: true,
      review_submission_enabled: false,
    },
    quota_period_id: "quota-period-1",
    quota_allocation_id: "quota-alloc-1",
    quota_total: 30,
    quota_used: 0,
    quota_remaining: 30,
    period_start: "2026-08-01T00:00:00.000Z",
    period_end: "2026-09-01T00:00:00.000Z",
  };
}

const trimmedRequest = enterpriseActivationRequestSchema.parse({
  company_name: "  Example Pharma  ",
});

assert.equal(trimmedRequest.company_name, "Example Pharma");

assert.equal(
  enterpriseActivationRequestSchema.safeParse({ company_name: "" }).success,
  false,
);

assert.equal(
  enterpriseActivationRequestSchema.safeParse({ company_name: "   " }).success,
  false,
);

assert.equal(
  enterpriseActivationRequestSchema.safeParse({
    company_name: "A".repeat(201),
  }).success,
  false,
);

assert.equal(
  enterpriseActivationRequestSchema.safeParse({
    company_name: "A".repeat(200),
  }).success,
  true,
);

const parsedResponse = enterpriseActivationResponseSchema.parse(
  buildActivationResponse(),
);

assert.equal(parsedResponse.role, "company_admin");
assert.equal(parsedResponse.plan_type, "enterprise");
assert.equal(parsedResponse.limits.seats, 5);
assert.equal(parsedResponse.limits.reports, 30);
assert.equal(parsedResponse.quota_remaining, 30);

assert.equal(
  enterpriseActivationResponseSchema.safeParse({
    ...buildActivationResponse(),
    extra_field: "ignored",
  }).success,
  true,
);

assert.equal(
  enterpriseActivationResponseSchema.safeParse({
    ...buildActivationResponse(),
    role: "super_admin",
  }).success,
  false,
);

assert.equal(
  enterpriseActivationResponseSchema.safeParse({
    ...buildActivationResponse(),
    billing_email: "not-an-email",
  }).success,
  false,
);

assert.equal(
  enterpriseActivationResponseSchema.safeParse({
    ...buildActivationResponse(),
    period_start: "2026-08-01T00:00:00Z",
    period_end: "2026-09-01T00:00:00+00:00",
  }).success,
  true,
);

assert.equal(
  enterpriseActivationResponseSchema.safeParse({
    ...buildActivationResponse(),
    period_start: "2026-08-01",
  }).success,
  false,
);
