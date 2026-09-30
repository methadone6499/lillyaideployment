export const BILLING_RECONCILIATION_TIMEOUT_MS = 30_000;
export const BILLING_RECONCILIATION_BACKOFF_MS = 1_500;
export const BILLING_QUERY_STALE_TIME_MS = 15_000;
export const BILLING_QUERY_GC_TIME_MS = 5 * 60_000;
export const BILLING_MAX_QUERY_FAILURES = 2;
export const BILLING_MAX_PROVIDER_FAILURES = 2;
export const BILLING_MAX_MUTATION_PROVIDER_FAILURES = 1;
export const BILLING_MAX_RETRY_DELAY_MS = 30_000;

export const OPERATION_LOCK_REFETCH_INTERVAL_MS = 15_000;

export const BILLING_PATHS = {
  onboarding: "/onboarding/subscription",
  success: "/billing/success",
  settings: "/settings/billing",
  custom: "/settings/billing/custom",
  customOffer: "/settings/billing/custom-offer",
  customInquiry: "/#contact",
  companySeats: "/company-admin/seats",
} as const;

export type BillingPath = (typeof BILLING_PATHS)[keyof typeof BILLING_PATHS];
