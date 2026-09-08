import assert from "node:assert/strict";

import {
  adminCompanyListResponseSchema,
  adminCompanyResponseSchema,
} from "../schemas/adminCompanySchemas";

function buildSeats(overrides: Record<string, unknown> = {}) {
  return {
    limit: 10,
    occupied: 4,
    active: 3,
    disabled: 1,
    pending_invitations: 2,
    available: 6,
    ...overrides,
  };
}

function buildQuota(overrides: Record<string, unknown> = {}) {
  return {
    total: 30,
    allocated: 20,
    unallocated: 10,
    used: 5,
    remaining: 25,
    ...overrides,
  };
}

function buildPrimaryAdmin(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "user-1",
    full_name: "Ada Lovelace",
    email: "ada@example.com",
    ...overrides,
  };
}

function buildSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub-1",
    plan_type: "enterprise",
    status: "active",
    amount_minor: 240000,
    currency: "GBP",
    billing_interval: "month",
    current_period_start: "2026-08-01T00:00:00.000Z",
    current_period_end: "2026-09-01T00:00:00.000Z",
    limits: {
      seats: 10,
      reports: 100,
    },
    ...overrides,
  };
}

function buildAdminCompany(overrides: Record<string, unknown> = {}) {
  return {
    id: "company-1",
    name: "LillyAI Labs",
    type: "enterprise",
    status: "active",
    billing_email: "billing@example.com",
    primary_admin: buildPrimaryAdmin(),
    subscription: buildSubscription(),
    seats: buildSeats(),
    quota: buildQuota(),
    created_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

const enterpriseCompany = adminCompanyResponseSchema.parse(buildAdminCompany());

assert.equal(enterpriseCompany.name, "LillyAI Labs");
assert.equal(enterpriseCompany.type, "enterprise");
assert.equal(enterpriseCompany.status, "active");
assert.equal(enterpriseCompany.primary_admin?.full_name, "Ada Lovelace");
assert.equal(enterpriseCompany.subscription?.plan_type, "enterprise");
assert.equal(enterpriseCompany.subscription?.status, "active");
assert.equal(enterpriseCompany.subscription?.amount_minor, 240000);
assert.equal(enterpriseCompany.subscription?.currency, "GBP");
assert.equal(enterpriseCompany.subscription?.billing_interval, "month");
assert.equal(enterpriseCompany.subscription?.limits.reports, 100);
assert.equal(enterpriseCompany.subscription?.limits.seats, 10);
assert.equal(enterpriseCompany.seats.limit, 10);
assert.equal(enterpriseCompany.quota?.remaining, 25);

const nullAdminAndSubscription = adminCompanyResponseSchema.parse(
  buildAdminCompany({
    primary_admin: null,
    subscription: null,
    quota: null,
  }),
);

assert.equal(nullAdminAndSubscription.primary_admin, null);
assert.equal(nullAdminAndSubscription.subscription, null);
assert.equal(nullAdminAndSubscription.quota, null);

const omittedOptionalFields = adminCompanyResponseSchema.parse(
  buildAdminCompany({
    primary_admin: undefined,
    subscription: undefined,
    quota: undefined,
  }),
);

assert.equal(omittedOptionalFields.primary_admin, undefined);
assert.equal(omittedOptionalFields.subscription, undefined);
assert.equal(omittedOptionalFields.quota, undefined);

const customPastDue = adminCompanyResponseSchema.parse(
  buildAdminCompany({
    type: "custom",
    status: "suspended",
    subscription: buildSubscription({
      plan_type: "custom",
      status: "past_due",
      amount_minor: 0,
      currency: "USD",
      limits: {
        seats: 1,
        reports: 0,
      },
    }),
  }),
);

assert.equal(customPastDue.type, "custom");
assert.equal(customPastDue.status, "suspended");
assert.equal(customPastDue.subscription?.plan_type, "custom");
assert.equal(customPastDue.subscription?.status, "past_due");
assert.equal(customPastDue.subscription?.amount_minor, 0);
assert.equal(customPastDue.subscription?.limits.reports, 0);

for (const status of [
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "expired",
  "suspended",
  "inactive",
] as const) {
  assert.equal(
    adminCompanyResponseSchema.parse(
      buildAdminCompany({
        subscription: buildSubscription({ status }),
      }),
    ).subscription?.status,
    status,
  );
}

for (const planType of ["standard", "enterprise", "custom"] as const) {
  assert.equal(
    adminCompanyResponseSchema.parse(
      buildAdminCompany({
        subscription: buildSubscription({ plan_type: planType }),
      }),
    ).subscription?.plan_type,
    planType,
  );
}

assert.equal(
  adminCompanyResponseSchema.safeParse({
    ...buildAdminCompany(),
    extra_field: "ignored",
  }).success,
  true,
);

assert.equal(
  adminCompanyResponseSchema.safeParse({
    ...buildAdminCompany(),
    seats: undefined,
  }).success,
  false,
);

assert.equal(
  adminCompanyResponseSchema.safeParse({
    ...buildAdminCompany(),
    type: "standard",
  }).success,
  false,
);

assert.equal(
  adminCompanyResponseSchema.safeParse({
    ...buildAdminCompany(),
    status: "pending",
  }).success,
  false,
);

assert.equal(
  adminCompanyResponseSchema.safeParse({
    ...buildAdminCompany({
      subscription: buildSubscription({
        status: "disabled",
      }),
    }),
  }).success,
  false,
);

assert.equal(
  adminCompanyResponseSchema.safeParse({
    ...buildAdminCompany({
      subscription: buildSubscription({
        billing_interval: "year",
      }),
    }),
  }).success,
  false,
);

assert.equal(
  adminCompanyResponseSchema.safeParse({
    ...buildAdminCompany({
      subscription: buildSubscription({
        currency: "GB",
      }),
    }),
  }).success,
  false,
);

assert.equal(
  adminCompanyResponseSchema.safeParse({
    ...buildAdminCompany(),
    created_at: "2026-08-01",
  }).success,
  false,
);

assert.equal(
  adminCompanyResponseSchema.safeParse(
    buildAdminCompany({
      created_at: "2026-08-01T00:00:00Z",
      subscription: buildSubscription({
        current_period_start: "2026-08-01T00:00:00+00:00",
        current_period_end: "2026-09-01T00:00:00.000Z",
      }),
    }),
  ).success,
  true,
);

const listWithNullCursor = adminCompanyListResponseSchema.parse({
  items: [
    buildAdminCompany({
      primary_admin: null,
      subscription: null,
    }),
  ],
  next_cursor: null,
});

assert.equal(listWithNullCursor.next_cursor, null);
assert.equal(listWithNullCursor.items.length, 1);
assert.equal(listWithNullCursor.items[0]?.primary_admin, null);
assert.equal(listWithNullCursor.items[0]?.subscription, null);

const listWithOmittedCursor = adminCompanyListResponseSchema.parse({
  items: [],
});

assert.equal(listWithOmittedCursor.next_cursor, undefined);
assert.equal(listWithOmittedCursor.items.length, 0);

assert.equal(
  adminCompanyListResponseSchema.parse({
    items: [buildAdminCompany()],
    next_cursor: "cursor-2",
  }).next_cursor,
  "cursor-2",
);
