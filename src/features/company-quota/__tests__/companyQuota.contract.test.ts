import assert from "node:assert/strict";

import {
  companyQuotaSummarySchema,
  ownQuotaSchema,
  quotaAllocationSchema,
  setMemberQuotaRequestSchema,
} from "../schemas/companyQuotaSchemas";

function buildCompanyQuota(overrides: Record<string, unknown> = {}) {
  return {
    company_id: "company-1",
    subscription_id: "sub-1",
    quota_period_id: "quota-period-1",
    feature: "report_generation",
    status: "active",
    period_start: "2026-08-01T00:00:00.000Z",
    period_end: "2026-09-01T00:00:00.000Z",
    quota_total: 30,
    quota_allocated: 18,
    quota_unallocated: 12,
    quota_used: 5,
    quota_remaining: 25,
    ...overrides,
  };
}

function buildOwnQuota(overrides: Record<string, unknown> = {}) {
  return {
    company_id: "company-1",
    membership_id: "membership-2",
    user_id: "user-2",
    quota_period_id: "quota-period-1",
    quota_total: 10,
    quota_used: 3,
    quota_remaining: 7,
    period_start: "2026-08-01T00:00:00.000Z",
    period_end: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

function buildAllocation(overrides: Record<string, unknown> = {}) {
  return {
    allocation_id: "alloc-1",
    company_id: "company-1",
    quota_period_id: "quota-period-1",
    membership_id: "membership-2",
    user_id: "user-2",
    quota_total: 8,
    quota_used: 3,
    quota_remaining: 5,
    status: "active",
    source: "company_admin_assignment",
    updated_at: "2026-08-18T12:00:00.000Z",
    ...overrides,
  };
}

const parsedRequest = setMemberQuotaRequestSchema.parse({ quota_total: 8 });

assert.equal(parsedRequest.quota_total, 8);

assert.equal(
  setMemberQuotaRequestSchema.safeParse({ quota_total: 0 }).success,
  true,
);

assert.equal(
  setMemberQuotaRequestSchema.safeParse({ quota_total: -1 }).success,
  false,
);

assert.equal(
  setMemberQuotaRequestSchema.safeParse({ quota_total: 1.5 }).success,
  false,
);

assert.equal(
  setMemberQuotaRequestSchema.safeParse({
    quota_total: 8,
    extra_field: true,
  }).success,
  false,
);

const companyQuota = companyQuotaSummarySchema.parse(buildCompanyQuota());

assert.equal(companyQuota.quota_unallocated, 12);
assert.equal(companyQuota.quota_remaining, 25);
assert.equal(companyQuota.feature, "report_generation");
assert.equal(companyQuota.status, "active");

assert.equal(
  companyQuotaSummarySchema.safeParse({
    ...buildCompanyQuota(),
    extra_field: "ignored",
  }).success,
  true,
);

assert.equal(
  companyQuotaSummarySchema.safeParse({
    ...buildCompanyQuota(),
    period_start: "2026-08-01",
  }).success,
  false,
);

assert.equal(
  companyQuotaSummarySchema.safeParse({
    ...buildCompanyQuota(),
    quota_unallocated: -1,
  }).success,
  false,
);

assert.equal(
  companyQuotaSummarySchema.safeParse({
    ...buildCompanyQuota({
      period_start: "2026-08-01T00:00:00Z",
      period_end: "2026-09-01T00:00:00+00:00",
    }),
  }).success,
  true,
);

const emptyOwnQuota = ownQuotaSchema.parse(
  buildOwnQuota({
    quota_total: 0,
    quota_used: 0,
    quota_remaining: 0,
  }),
);

assert.equal(emptyOwnQuota.quota_total, 0);
assert.equal(emptyOwnQuota.quota_used, 0);
assert.equal(emptyOwnQuota.quota_remaining, 0);

assert.equal(
  ownQuotaSchema.safeParse({
    ...buildOwnQuota(),
    extra_field: "ignored",
  }).success,
  true,
);

assert.equal(
  ownQuotaSchema.safeParse({
    ...buildOwnQuota(),
    membership_id: undefined,
  }).success,
  false,
);

const allocation = quotaAllocationSchema.parse(buildAllocation());

assert.equal(allocation.quota_total, 8);
assert.equal(allocation.status, "active");
assert.equal(allocation.source, "company_admin_assignment");

assert.equal(
  quotaAllocationSchema.safeParse({
    ...buildAllocation(),
    extra_field: "ignored",
  }).success,
  true,
);

assert.equal(
  quotaAllocationSchema.safeParse({
    ...buildAllocation(),
    source: "manual",
  }).success,
  false,
);

assert.equal(
  quotaAllocationSchema.safeParse({
    ...buildAllocation({
      status: "released",
      source: "enterprise_subscription",
      updated_at: "2026-08-18T12:00:00+00:00",
    }),
  }).success,
  true,
);
