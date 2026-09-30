import assert from "node:assert/strict";

import type { BillingQuotaView, ReportQuotaSource } from "@/features/billing";
import type { OwnQuota } from "@/features/company-quota";

import { selectDashboardQuotaCard } from "../utils/selectDashboardQuotaCard";

const knownBillingQuota: BillingQuotaView = {
  kind: "known",
  quota: {
    quota_total: 30,
    quota_used: 7,
    quota_remaining: 23,
    period_start: "2026-09-10T10:00:00Z",
    period_end: "2026-10-10T10:00:00Z",
  },
};

const ownQuota: OwnQuota = {
  company_id: "company-1",
  membership_id: "membership-2",
  user_id: "user-2",
  quota_period_id: "quota-period-1",
  quota_total: 10,
  quota_used: 10,
  quota_remaining: 0,
  period_start: "2026-08-01T00:00:00.000Z",
  period_end: "2026-09-01T00:00:00.000Z",
};

function select(
  source: ReportQuotaSource,
  overrides: Partial<Parameters<typeof selectDashboardQuotaCard>[0]> = {},
) {
  return selectDashboardQuotaCard({
    source,
    billingQuotaView: null,
    overviewPending: false,
    overviewErrorMessage: null,
    ownQuota: undefined,
    ownQuotaPending: false,
    ownQuotaErrorMessage: null,
    ...overrides,
  });
}

assert.deepEqual(select("unlimited"), {
  view: { kind: "unlimited" },
  errorMessage: null,
});

assert.deepEqual(
  select("subscription_overview", {
    billingQuotaView: { kind: "unavailable" },
  }),
  {
    view: { kind: "unavailable" },
    errorMessage: null,
  },
);

assert.deepEqual(
  select("subscription_overview", {
    billingQuotaView: knownBillingQuota,
  }),
  {
    view: {
      kind: "known",
      used: 7,
      total: 30,
      remaining: 23,
    },
    errorMessage: null,
  },
);

assert.deepEqual(
  select("subscription_overview", {
    overviewPending: true,
  }),
  {
    view: { kind: "loading" },
    errorMessage: null,
  },
);

assert.deepEqual(
  select("company_allocation", {
    ownQuota,
  }),
  {
    view: {
      kind: "known",
      used: 10,
      total: 10,
      remaining: 0,
    },
    errorMessage: null,
  },
);

assert.deepEqual(
  select("company_allocation", {
    ownQuotaPending: true,
  }),
  {
    view: { kind: "loading" },
    errorMessage: null,
  },
);

assert.deepEqual(
  select("company_allocation", {
    ownQuotaErrorMessage: "Unable to load report quota. Please try again.",
  }),
  {
    view: { kind: "unavailable" },
    errorMessage: "Unable to load report quota. Please try again.",
  },
);
