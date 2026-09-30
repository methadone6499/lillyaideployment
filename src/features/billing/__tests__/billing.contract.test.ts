import assert from "node:assert/strict";

import {
  AuthSessionError,
  AuthSessionUnavailableError,
  type AuthMeResponse,
  type Permission,
} from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import { billingQueryKeys } from "../api/billingQueryKeys";
import { resolveHostedBillingUrl } from "../utils/assignHostedBillingUrl";
import {
  getOperationLockMessage,
  isOperationBlocked,
  isOperationLockError,
  selectOperationLock,
  selectOperationLockScope,
} from "../utils/selectOperationLock";
import { selectBillingPlanCards } from "../utils/selectBillingPlanCards";
import {
  amountMinorSchema,
  billingErrorCodeSchema,
  billingErrorSchema,
  checkoutPendingDetailsSchema,
  checkoutRequestSchema,
  checkoutResponseSchema,
  checkoutStateSchema,
  checkoutStatusSchema,
  companyNameSchema,
  currencyCodeSchema,
  downgradeResponseSchema,
  operationLockSchema,
  planChangeStateSchema,
  planChangeStatusSchema,
  planIntentSchema,
  planTypeSchema,
  portalResponseSchema,
  purchasablePlanTypeSchema,
  subscriptionOverviewSchema,
  subscriptionQuotaSchema,
  subscriptionStatusSchema,
  subscriptionSummarySchema,
  upgradeRequestSchema,
  upgradeResponseSchema,
  utcIsoDateTimeSchema,
  type SubscriptionOverview,
} from "../schemas/billingSchemas";
import {
  BILLING_MAX_MUTATION_PROVIDER_FAILURES,
  BILLING_MAX_PROVIDER_FAILURES,
  BILLING_MAX_QUERY_FAILURES,
  BILLING_PATHS,
  BILLING_RECONCILIATION_BACKOFF_MS,
  BILLING_RECONCILIATION_TIMEOUT_MS,
} from "../utils/billingConstants";
import {
  classifyBillingError,
  getPaidActionFailureKind,
  isTerminalClassifiedBillingError,
} from "../utils/classifyBillingError";
import {
  formatAmountMinor,
  formatBillingIntervalCopy,
  formatBillingIntervalSuffix,
  formatPlanName,
  formatStatusLabel,
  formatUtcDate,
  formatUtcDateTime,
  getCurrencyFractionDigits,
} from "../utils/formatBilling";
import {
  PLAN_INTENT_QUERY_PARAM,
  buildSignupPlanPath,
  clearPlanIntent,
  readPlanIntent,
  resolvePricingPlanHref,
  sanitizePlanIntent,
  sanitizePlanIntentParam,
  storePlanIntent,
  syncPlanIntentWithOverview,
} from "../utils/planIntent";
import {
  buildSubscriptionOnboardingPath,
  isCustomSubscriptionPath,
  resolveClassifiedBillingFailurePath,
  resolveOnboardingExitPath,
  resolvePaidActionErrorPath,
  resolvePaidActionFailurePath,
  resolvePaidFeatureDestination,
  resolvePostAuthBillingDestination,
} from "../utils/resolveBillingDestination";
import {
  canRequestCustomPlan,
  canUseAdvancedAnalytics,
  canUsePaidFeature,
  canUsePaidSources,
  hasPaidAccess,
  hasReconciledPaidSubscription,
  hasScheduledEnterpriseDowngrade,
  isBillingOwner,
  isBillingReconciliationReady,
  isSuperAdminContext,
  selectBillingOwnerCapabilities,
  selectBillingQuotaView,
  selectPaidFeatureAccess,
  selectReportQuotaSource,
  shouldRefetchAuthAfterBilling,
  shouldStopBillingReconciliation,
} from "../utils/selectBillingCapabilities";
import {
  getBillingOverviewPollInterval,
  getHostedInvoiceUrl,
  getResumableCheckoutUrl,
  resolveSubscriptionOverviewRefetchInterval,
  selectBillingOverviewUiKind,
  selectBillingOverviewUiState,
  selectBillingSettingsKind,
  selectCheckoutActionState,
  SUBSCRIPTION_OVERVIEW_DEFAULT_REFETCH_INTERVAL,
  SUBSCRIPTION_OVERVIEW_REFETCH_INTERVAL_IN_BACKGROUND,
} from "../utils/selectBillingOverviewUi";
import {
  getEnterpriseAuthReconciliationInterval,
  getSubscriptionReconciliationOverviewInterval,
  selectBillingReconciliationError,
  selectBillingReconciliationUiState,
  shouldEnableEnterpriseAuthReconciliation,
} from "../utils/selectBillingReconciliation";
import {
  getBillingErrorRefetchIntervalMs,
  getBillingRetryDelay,
  shouldRetryBillingMutation,
  shouldRetryBillingQuery,
} from "../utils/shouldRetryBillingQuery";

const STANDARD_USER_PERMISSIONS = [
  "account:read",
  "account:update",
  "report:create",
  "report:read_own",
  "settings:read",
  "settings:update",
  "notification:read",
] as const satisfies readonly Permission[];

const COMPANY_ADMIN_PERMISSIONS = [
  ...STANDARD_USER_PERMISSIONS,
  "company:read",
  "company:billing_read",
  "company:members_read",
  "company:members_manage",
  "company:quota_read",
  "company:quota_manage",
  "report:read_company",
] as const satisfies readonly Permission[];

const COMPANY_SEAT_PERMISSIONS = [
  ...STANDARD_USER_PERMISSIONS,
  "company:quota_read_own",
] as const satisfies readonly Permission[];

const SUPER_ADMIN_PERMISSIONS = [
  ...STANDARD_USER_PERMISSIONS,
  "admin:companies_read",
  "admin:reports_read",
  "admin:users_read",
] as const satisfies readonly Permission[];

const STANDARD_FEATURES = {
  report_generation: true,
  dosage_calculator: true,
  paid_sources: true,
  ai_presentation: true,
  advanced_analytics: true,
  company_seats: false,
  review_submission_enabled: false,
};

const ENTERPRISE_FEATURES = {
  ...STANDARD_FEATURES,
  company_seats: true,
};

function buildUser() {
  return {
    id: "user-1",
    email: "user@example.com",
    full_name: "Test User",
    institution_name: null,
    status: "active" as const,
    email_verified: true,
    email_verified_at: "2026-01-01T00:00:00.000Z",
    global_role: null,
    last_login_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

const personalMe = {
  user: buildUser(),
  active_context: {
    type: "personal",
    role: "standard_user",
    company_id: null,
    membership_id: null,
  },
  available_contexts: [
    {
      type: "personal",
      role: "standard_user",
      company_id: null,
      membership_id: null,
    },
  ],
  permissions: [...STANDARD_USER_PERMISSIONS],
  entitlement_summary: null,
  quota_summary: null,
} satisfies AuthMeResponse;

const companyAdminMe = {
  user: buildUser(),
  active_context: {
    type: "company",
    role: "company_admin",
    company_id: "company-1",
    membership_id: "membership-1",
  },
  available_contexts: [
    {
      type: "company",
      role: "company_admin",
      company_id: "company-1",
      membership_id: "membership-1",
    },
  ],
  permissions: [...COMPANY_ADMIN_PERMISSIONS],
  entitlement_summary: { plan: "enterprise" },
  quota_summary: { quota_total: 100, quota_used: 0 },
} satisfies AuthMeResponse;

const companySeatMe = {
  user: buildUser(),
  active_context: {
    type: "company",
    role: "company_seat_user",
    company_id: "company-1",
    membership_id: "membership-2",
  },
  available_contexts: [
    {
      type: "company",
      role: "company_seat_user",
      company_id: "company-1",
      membership_id: "membership-2",
    },
  ],
  permissions: [...COMPANY_SEAT_PERMISSIONS],
  entitlement_summary: null,
  quota_summary: {
    quota_total: 0,
    quota_used: 0,
    quota_remaining: 0,
  },
} satisfies AuthMeResponse;

const superAdminMe = {
  user: {
    ...buildUser(),
    global_role: "super_admin",
  },
  active_context: {
    type: "global",
    role: "super_admin",
    company_id: null,
    membership_id: null,
  },
  available_contexts: [
    {
      type: "global",
      role: "super_admin",
      company_id: null,
      membership_id: null,
    },
  ],
  permissions: [...SUPER_ADMIN_PERMISSIONS],
  entitlement_summary: null,
  quota_summary: null,
} satisfies AuthMeResponse;

const reviewerMe = {
  ...personalMe,
  user: { ...buildUser(), global_role: "reviewer" },
  active_context: {
    type: "reviewer",
    role: "reviewer",
    company_id: null,
    membership_id: null,
  },
  available_contexts: [
    {
      type: "reviewer",
      role: "reviewer",
      company_id: null,
      membership_id: null,
    },
  ],
  permissions: ["account:read", "review_assignments:read_own"],
} satisfies AuthMeResponse;

function buildStandardSubscription() {
  return {
    id: "subscription_01STANDARD",
    scope_type: "user" as const,
    plan_type: "standard" as const,
    status: "active" as const,
    amount_minor: 2000,
    currency: "usd",
    billing_interval: "month" as const,
    cancel_at_period_end: false,
    limits: { seats: 1, reports: 30 },
    features: STANDARD_FEATURES,
    current_period_start: "2026-09-10T10:00:00Z",
    current_period_end: "2026-10-10T10:00:00Z",
  };
}

function buildEnterpriseSubscription() {
  return {
    ...buildStandardSubscription(),
    id: "subscription_01ENTERPRISE",
    scope_type: "company" as const,
    plan_type: "enterprise" as const,
    amount_minor: 240000,
    limits: { seats: 10, reports: 100 },
    features: ENTERPRISE_FEATURES,
  };
}

function parseOverview(
  overrides: Record<string, unknown> = {},
): SubscriptionOverview {
  return subscriptionOverviewSchema.parse({
    subscription: null,
    checkout: null,
    plan_change: null,
    quota: null,
    can_use_paid_features: false,
    ...overrides,
  });
}

const idleQuery = {
  state: {
    data: undefined as SubscriptionOverview | undefined,
    error: null,
  },
};

const openCheckout = {
  checkout_id: "checkout-1",
  plan_type: "standard" as const,
  status: "open" as const,
  checkout_url: "https://checkout.stripe.com/c/pay/example",
  expires_at: "2026-09-11T10:00:00Z",
};

const pendingInvoice = {
  plan_change_id: "plan-change-1",
  from_plan: "standard" as const,
  to_plan: "enterprise" as const,
  company_name: "Example Pharma",
  status: "payment_pending" as const,
  hosted_invoice_url: "https://invoice.stripe.com/i/example",
  effective_at: null,
};

const processingOverview = parseOverview({
  checkout: openCheckout,
  plan_change: pendingInvoice,
});

const standardPaidOverview = parseOverview({
  subscription: buildStandardSubscription(),
  quota: {
    quota_total: 30,
    quota_used: 7,
    quota_remaining: 23,
    period_start: "2026-09-10T10:00:00Z",
    period_end: "2026-10-10T10:00:00Z",
  },
  can_use_paid_features: true,
});

const enterprisePaidOverview = parseOverview({
  subscription: buildEnterpriseSubscription(),
  quota: {
    quota_total: 100,
    quota_used: 0,
    quota_remaining: 100,
    period_start: "2026-09-10T10:00:00Z",
    period_end: "2026-10-10T10:00:00Z",
  },
  can_use_paid_features: true,
});

const unsubscribedOverview = parseOverview();
const emptySuperAdminOverview = parseOverview({
  can_use_paid_features: true,
});

function billingError(options: {
  status: number;
  code?: string;
  message: string;
  requestId?: string | null;
  details?: unknown;
  fieldErrors?: Record<string, string>;
  retryAfterSeconds?: number | null;
}) {
  return new ApiRequestError({
    status: options.status,
    code: options.code,
    message: options.message,
    requestId: options.requestId ?? null,
    details: options.details,
    fieldErrors: options.fieldErrors,
    retryAfterSeconds: options.retryAfterSeconds,
  });
}

const paymentPendingError = billingError({
  status: 409,
  code: "checkout_payment_pending",
  message: "Your checkout payment is still processing.",
  requestId: "req-payment-pending",
});

const reconciliationFailedError = billingError({
  status: 500,
  code: "billing_reconciliation_failed",
  message: "We could not confirm your billing update yet.",
  requestId: "req-reconciliation",
});

const sessionError = billingError({
  status: 401,
  code: "invalid_session",
  message: "Your session has expired. Please sign in again.",
});

const subscriptionRequiredError = billingError({
  status: 402,
  code: "subscription_required",
  message: "A paid subscription is required to use this feature.",
});

const genericPaymentRequiredError = billingError({
  status: 402,
  message: "Payment required",
});

const quotaExhaustedError = billingError({
  status: 402,
  code: "report_quota_exhausted",
  message: "This workspace has no remaining report quota for the current period.",
});

const providerUnavailableError = billingError({
  status: 503,
  code: "billing_provider_unavailable",
  message: "The billing provider is temporarily unavailable.",
});

const processingState = selectBillingReconciliationUiState({
  overview: processingOverview,
  error: paymentPendingError,
  timedOut: false,
  me: personalMe,
});

assert.equal(processingState.kind, "processing");
if (processingState.kind === "processing") {
  assert.equal(
    processingState.checkoutUrl,
    "https://checkout.stripe.com/c/pay/example",
  );
  assert.equal(
    processingState.hostedInvoiceUrl,
    "https://invoice.stripe.com/i/example",
  );
}

const timeoutState = selectBillingReconciliationUiState({
  overview: processingOverview,
  error: reconciliationFailedError,
  timedOut: true,
  me: personalMe,
});

assert.equal(timeoutState.kind, "timeout");
if (timeoutState.kind === "timeout") {
  assert.equal(
    timeoutState.checkoutUrl,
    "https://checkout.stripe.com/c/pay/example",
  );
  assert.equal(
    timeoutState.hostedInvoiceUrl,
    "https://invoice.stripe.com/i/example",
  );
  assert.equal(timeoutState.requestId, "req-reconciliation");
  assert.equal(timeoutState.overview, processingOverview);
}

assert.equal(
  selectBillingReconciliationUiState({
    overview: processingOverview,
    error: paymentPendingError,
    timedOut: true,
    me: personalMe,
  }).kind,
  "timeout",
);

assert.equal(
  selectBillingReconciliationUiState({
    overview: standardPaidOverview,
    error: sessionError,
    timedOut: false,
    me: personalMe,
  }).kind,
  "terminal",
);

const staleEnterpriseState = selectBillingReconciliationUiState({
  overview: enterprisePaidOverview,
  error: undefined,
  timedOut: false,
  me: personalMe,
});

assert.equal(staleEnterpriseState.kind, "processing");
assert.equal(shouldStopBillingReconciliation(enterprisePaidOverview, personalMe), true);
assert.equal(isBillingReconciliationReady(enterprisePaidOverview, personalMe), false);
assert.equal(
  shouldRefetchAuthAfterBilling(enterprisePaidOverview, personalMe),
  true,
);
assert.equal(
  getSubscriptionReconciliationOverviewInterval({
    enabled: true,
    timedOut: false,
    overview: enterprisePaidOverview,
    error: undefined,
    me: personalMe,
  }),
  false,
);
assert.equal(
  shouldEnableEnterpriseAuthReconciliation({
    enabled: true,
    timedOut: false,
    overview: enterprisePaidOverview,
    me: personalMe,
  }),
  true,
);
assert.equal(
  getEnterpriseAuthReconciliationInterval({
    timedOut: false,
    me: personalMe,
  }),
  BILLING_RECONCILIATION_BACKOFF_MS,
);

const enterpriseAuthSuccessState = selectBillingReconciliationUiState({
  overview: enterprisePaidOverview,
  error: undefined,
  timedOut: false,
  me: companyAdminMe,
});

assert.equal(enterpriseAuthSuccessState.kind, "reconciled");
assert.equal(
  isBillingReconciliationReady(enterprisePaidOverview, companyAdminMe),
  true,
);
assert.equal(
  shouldEnableEnterpriseAuthReconciliation({
    enabled: true,
    timedOut: false,
    overview: enterprisePaidOverview,
    me: companyAdminMe,
  }),
  false,
);
assert.equal(
  getEnterpriseAuthReconciliationInterval({
    timedOut: false,
    me: companyAdminMe,
  }),
  false,
);

const authUnavailable = new AuthSessionUnavailableError();
const authSessionFailure = new AuthSessionError();

assert.equal(
  classifyBillingError(authUnavailable).retryable,
  true,
);
assert.equal(
  isTerminalClassifiedBillingError(classifyBillingError(authSessionFailure)),
  true,
);
assert.equal(
  selectBillingReconciliationUiState({
    overview: enterprisePaidOverview,
    error: selectBillingReconciliationError({
      overviewError: undefined,
      authError: authSessionFailure,
    }),
    timedOut: false,
    me: personalMe,
  }).kind,
  "terminal",
);
assert.equal(
  getEnterpriseAuthReconciliationInterval({
    timedOut: false,
    me: personalMe,
    error: authUnavailable,
  }),
  BILLING_RECONCILIATION_BACKOFF_MS,
);
assert.equal(
  getEnterpriseAuthReconciliationInterval({
    timedOut: false,
    me: personalMe,
    error: authSessionFailure,
  }),
  false,
);

const enterpriseAuthTimeoutState = selectBillingReconciliationUiState({
  overview: enterprisePaidOverview,
  error: undefined,
  timedOut: true,
  me: personalMe,
});

assert.equal(enterpriseAuthTimeoutState.kind, "timeout");
if (enterpriseAuthTimeoutState.kind === "timeout") {
  assert.equal(enterpriseAuthTimeoutState.requestId, null);
}
assert.equal(
  shouldEnableEnterpriseAuthReconciliation({
    enabled: true,
    timedOut: true,
    overview: enterprisePaidOverview,
    me: personalMe,
  }),
  false,
);
assert.equal(
  getEnterpriseAuthReconciliationInterval({
    timedOut: true,
    me: personalMe,
  }),
  false,
);

assert.notDeepEqual(
  billingQueryKeys.authReconciliation("user-1", 0),
  billingQueryKeys.authReconciliation("user-1", 1),
);
assert.deepEqual(billingQueryKeys.authReconciliation("user-1", 1), [
  "billing",
  "auth-reconciliation",
  "user-1",
  1,
]);
assert.equal(
  shouldEnableEnterpriseAuthReconciliation({
    enabled: true,
    timedOut: false,
    overview: enterprisePaidOverview,
    me: personalMe,
  }),
  true,
);

const standardState = selectBillingReconciliationUiState({
  overview: standardPaidOverview,
  error: undefined,
  timedOut: false,
  me: personalMe,
});

assert.equal(standardState.kind, "reconciled");
assert.equal(isBillingReconciliationReady(standardPaidOverview, personalMe), true);
assert.equal(shouldStopBillingReconciliation(standardPaidOverview, personalMe), true);
assert.equal(
  shouldRefetchAuthAfterBilling(standardPaidOverview, personalMe),
  false,
);
assert.equal(
  shouldEnableEnterpriseAuthReconciliation({
    enabled: true,
    timedOut: false,
    overview: standardPaidOverview,
    me: personalMe,
  }),
  false,
);
assert.equal(
  selectBillingReconciliationUiState({
    overview: standardPaidOverview,
    error: undefined,
    timedOut: true,
    me: personalMe,
  }).kind,
  "reconciled",
);

const superAdminState = selectBillingReconciliationUiState({
  overview: emptySuperAdminOverview,
  error: undefined,
  timedOut: false,
  me: superAdminMe,
});

assert.equal(superAdminState.kind, "reconciled");
assert.equal(
  shouldStopBillingReconciliation(emptySuperAdminOverview, superAdminMe),
  true,
);
assert.equal(
  isBillingReconciliationReady(emptySuperAdminOverview, superAdminMe),
  true,
);
assert.equal(
  shouldEnableEnterpriseAuthReconciliation({
    enabled: true,
    timedOut: false,
    overview: emptySuperAdminOverview,
    me: superAdminMe,
  }),
  false,
);

const classifiedSubscriptionRequired = classifyBillingError(
  subscriptionRequiredError,
);
const classifiedGeneric402 = classifyBillingError(genericPaymentRequiredError);
const classifiedQuota = classifyBillingError(quotaExhaustedError);
const classifiedSession = classifyBillingError(sessionError);

assert.equal(classifiedSubscriptionRequired.kind, "subscription_required");
assert.equal(classifiedGeneric402.kind, "subscription_required");
assert.equal(classifiedQuota.kind, "report_quota_exhausted");
assert.equal(classifiedSession.kind, "invalid_session");

assert.equal(
  resolveClassifiedBillingFailurePath(classifiedSession, standardPaidOverview),
  "/login",
);
assert.equal(
  resolveClassifiedBillingFailurePath(
    classifiedSubscriptionRequired,
    unsubscribedOverview,
  ),
  BILLING_PATHS.onboarding,
);
assert.equal(
  resolveClassifiedBillingFailurePath(
    classifiedGeneric402,
    unsubscribedOverview,
  ),
  BILLING_PATHS.onboarding,
);
assert.equal(
  resolveClassifiedBillingFailurePath(
    classifiedSubscriptionRequired,
    standardPaidOverview,
  ),
  BILLING_PATHS.settings,
);
assert.equal(
  resolveClassifiedBillingFailurePath(
    classifiedGeneric402,
    standardPaidOverview,
  ),
  BILLING_PATHS.settings,
);
assert.equal(
  resolvePaidActionFailurePath("subscription_required", unsubscribedOverview),
  BILLING_PATHS.onboarding,
);
assert.equal(
  resolvePaidActionFailurePath("subscription_required", standardPaidOverview),
  BILLING_PATHS.settings,
);
assert.equal(
  resolveClassifiedBillingFailurePath(classifiedQuota, unsubscribedOverview),
  BILLING_PATHS.settings,
);
assert.equal(
  resolveClassifiedBillingFailurePath(classifiedQuota, standardPaidOverview),
  BILLING_PATHS.settings,
);

assert.equal(hasPaidAccess(unsubscribedOverview, personalMe), false);
assert.equal(hasPaidAccess(standardPaidOverview, personalMe), true);
assert.equal(hasPaidAccess(unsubscribedOverview, superAdminMe), true);
assert.equal(hasPaidAccess(emptySuperAdminOverview, superAdminMe), true);
assert.equal(hasPaidAccess(emptySuperAdminOverview, personalMe), true);

const unpaidWithFeatures = parseOverview({
  subscription: buildStandardSubscription(),
  quota: standardPaidOverview.quota,
  can_use_paid_features: false,
});
const paidWithoutOptionalFeatures = parseOverview({
  subscription: {
    ...buildStandardSubscription(),
    features: {
      ...STANDARD_FEATURES,
      paid_sources: false,
      advanced_analytics: false,
      ai_presentation: false,
    },
  },
  quota: standardPaidOverview.quota,
  can_use_paid_features: true,
});

assert.equal(canUsePaidFeature(unpaidWithFeatures, "report_generation", personalMe), false);
assert.equal(canUsePaidSources(unpaidWithFeatures, personalMe), false);
assert.equal(canUseAdvancedAnalytics(unpaidWithFeatures, personalMe), false);
assert.equal(
  canUsePaidFeature(paidWithoutOptionalFeatures, "report_generation", personalMe),
  true,
);
assert.equal(canUsePaidSources(paidWithoutOptionalFeatures, personalMe), false);
assert.equal(canUseAdvancedAnalytics(paidWithoutOptionalFeatures, personalMe), false);
assert.equal(
  canUsePaidFeature(paidWithoutOptionalFeatures, "ai_presentation", personalMe),
  false,
);
assert.equal(canUsePaidSources(emptySuperAdminOverview, superAdminMe), true);
assert.equal(canUseAdvancedAnalytics(emptySuperAdminOverview, superAdminMe), true);
assert.equal(
  canUsePaidFeature(emptySuperAdminOverview, "report_generation", superAdminMe),
  true,
);
assert.equal(
  canUsePaidFeature(unsubscribedOverview, "report_generation", superAdminMe),
  true,
);

const paidFeatureAccess = selectPaidFeatureAccess(standardPaidOverview, personalMe);
assert.equal(paidFeatureAccess.paid_sources, true);
assert.equal(paidFeatureAccess.advanced_analytics, true);
assert.equal(paidFeatureAccess.ai_presentation, true);

const deniedFeatureAccess = selectPaidFeatureAccess(
  paidWithoutOptionalFeatures,
  personalMe,
);
assert.equal(deniedFeatureAccess.paid_sources, false);
assert.equal(deniedFeatureAccess.advanced_analytics, false);
assert.equal(deniedFeatureAccess.report_generation, true);

assert.deepEqual(selectBillingQuotaView(unsubscribedOverview, personalMe), {
  kind: "unavailable",
});
assert.equal(
  selectBillingQuotaView(standardPaidOverview, personalMe).kind,
  "known",
);
assert.deepEqual(selectBillingQuotaView(emptySuperAdminOverview, superAdminMe), {
  kind: "unlimited",
});
assert.deepEqual(selectBillingQuotaView(emptySuperAdminOverview, personalMe), {
  kind: "unavailable",
});

assert.equal(selectReportQuotaSource(personalMe), "subscription_overview");
assert.equal(selectReportQuotaSource(companyAdminMe), "subscription_overview");
assert.equal(selectReportQuotaSource(companySeatMe), "company_allocation");
assert.equal(selectReportQuotaSource(superAdminMe), "unlimited");

assert.equal(
  resolvePaidFeatureDestination({
    overview: unsubscribedOverview,
    me: personalMe,
    feature: "report_generation",
    allowedPath: "/reports/new",
  }),
  BILLING_PATHS.onboarding,
);
assert.equal(
  resolvePaidFeatureDestination({
    overview: standardPaidOverview,
    me: personalMe,
    feature: "report_generation",
    allowedPath: "/reports/new",
  }),
  "/reports/new",
);
assert.equal(
  resolvePaidFeatureDestination({
    overview: undefined,
    me: personalMe,
    feature: "report_generation",
    allowedPath: "/reports/new",
  }),
  "/reports/new",
);
assert.equal(
  resolvePaidFeatureDestination({
    overview: paidWithoutOptionalFeatures,
    me: personalMe,
    feature: "ai_presentation",
    allowedPath: "/reports/export",
  }),
  BILLING_PATHS.settings,
);

assert.equal(getPaidActionFailureKind(subscriptionRequiredError), "subscription_required");
assert.equal(getPaidActionFailureKind(quotaExhaustedError), "report_quota_exhausted");
assert.equal(getPaidActionFailureKind(genericPaymentRequiredError), "subscription_required");
assert.equal(
  getPaidActionFailureKind({
    name: "ReportApiError",
    message: "Quota exhausted",
    status: 402,
    code: "report_quota_exhausted",
  }),
  "report_quota_exhausted",
);
assert.equal(
  getPaidActionFailureKind({
    name: "DosageCalculatorApiError",
    message: "Payment required",
    status: 402,
  }),
  "subscription_required",
);
assert.equal(getPaidActionFailureKind(new Error("network")), null);
assert.equal(
  resolvePaidActionErrorPath(quotaExhaustedError, standardPaidOverview),
  BILLING_PATHS.settings,
);
assert.equal(
  resolvePaidActionErrorPath(subscriptionRequiredError, unsubscribedOverview),
  BILLING_PATHS.onboarding,
);
assert.equal(resolvePaidActionErrorPath(new Error("network"), unsubscribedOverview), null);

const pendingCheckoutOverview = parseOverview({
  checkout: {
    ...openCheckout,
    status: "payment_pending",
  },
});

assert.equal(SUBSCRIPTION_OVERVIEW_DEFAULT_REFETCH_INTERVAL, false);
assert.equal(SUBSCRIPTION_OVERVIEW_REFETCH_INTERVAL_IN_BACKGROUND, false);
assert.equal(
  resolveSubscriptionOverviewRefetchInterval(undefined, idleQuery),
  false,
);
assert.equal(
  resolveSubscriptionOverviewRefetchInterval(undefined, {
    state: { data: pendingCheckoutOverview, error: null },
  }),
  false,
);
assert.equal(
  getBillingOverviewPollInterval(pendingCheckoutOverview),
  BILLING_RECONCILIATION_BACKOFF_MS,
);
assert.equal(
  getSubscriptionReconciliationOverviewInterval({
    enabled: true,
    timedOut: false,
    overview: pendingCheckoutOverview,
    error: undefined,
  }),
  BILLING_RECONCILIATION_BACKOFF_MS,
);
assert.equal(
  getSubscriptionReconciliationOverviewInterval({
    enabled: true,
    timedOut: true,
    overview: pendingCheckoutOverview,
    error: undefined,
  }),
  false,
);
assert.equal(
  resolveSubscriptionOverviewRefetchInterval(
    () => BILLING_RECONCILIATION_BACKOFF_MS,
    idleQuery,
  ),
  BILLING_RECONCILIATION_BACKOFF_MS,
);

const extraDetails = checkoutPendingDetailsSchema.safeParse({
  plan_type: "enterprise",
  checkout_id: "checkout-1",
});
assert.equal(extraDetails.success, true);
if (extraDetails.success) {
  assert.equal(extraDetails.data.plan_type, "enterprise");
}

assert.equal(
  checkoutPendingDetailsSchema.safeParse({ checkout_id: "checkout-1" }).success,
  false,
);
assert.equal(
  checkoutPendingDetailsSchema.safeParse({ plan_type: "enterprise-plus" })
    .success,
  false,
);
assert.equal(
  checkoutPendingDetailsSchema.safeParse(null).success,
  false,
);

const pendingWithExtraFields = classifyBillingError(
  billingError({
    status: 409,
    code: "checkout_session_pending",
    message: "Another subscription checkout is already in progress.",
    details: {
      plan_type: "standard",
      checkout_id: "checkout-1",
    },
  }),
);
assert.equal(pendingWithExtraFields.pendingPlanType, "standard");

const pendingWithoutPlanType = classifyBillingError(
  billingError({
    status: 409,
    code: "checkout_session_pending",
    message: "Another subscription checkout is already in progress.",
    details: { checkout_id: "checkout-1" },
  }),
);
assert.equal(pendingWithoutPlanType.pendingPlanType, null);

const classifiedPaymentPending = classifyBillingError(paymentPendingError);
assert.equal(classifiedPaymentPending.kind, "checkout_payment_pending");
assert.equal(classifiedPaymentPending.retryable, false);
assert.equal(classifiedPaymentPending.pollOverview, true);
assert.equal(classifiedPaymentPending.reloadOverview, true);
assert.equal(isTerminalClassifiedBillingError(classifiedPaymentPending), false);
assert.equal(shouldRetryBillingQuery(0, paymentPendingError), false);
assert.equal(shouldRetryBillingMutation(0, paymentPendingError), false);
assert.equal(
  getBillingErrorRefetchIntervalMs(paymentPendingError),
  BILLING_RECONCILIATION_BACKOFF_MS,
);
assert.equal(
  selectBillingReconciliationUiState({
    overview: unsubscribedOverview,
    error: paymentPendingError,
    timedOut: false,
    me: personalMe,
  }).kind,
  "processing",
);

const classifiedProvider = classifyBillingError(providerUnavailableError);
assert.equal(classifiedProvider.retryable, true);
assert.equal(classifiedProvider.pollOverview, false);
assert.equal(shouldRetryBillingQuery(0, providerUnavailableError), true);
assert.equal(shouldRetryBillingMutation(0, providerUnavailableError), true);

const classifiedReconciliation = classifyBillingError(reconciliationFailedError);
assert.equal(classifiedReconciliation.retryable, true);
assert.equal(classifiedReconciliation.pollOverview, true);
assert.equal(shouldRetryBillingQuery(0, reconciliationFailedError), true);
assert.equal(shouldRetryBillingMutation(0, reconciliationFailedError), false);

assert.equal(
  getSubscriptionReconciliationOverviewInterval({
    enabled: true,
    timedOut: false,
    overview: unsubscribedOverview,
    error: paymentPendingError,
    me: personalMe,
  }),
  BILLING_RECONCILIATION_BACKOFF_MS,
);

const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "expired",
  "suspended",
  "inactive",
] as const;
const CHECKOUT_STATUSES = [
  "creating",
  "open",
  "payment_pending",
  "completed",
  "failed",
  "expired",
  "superseded",
] as const;
const PLAN_CHANGE_STATUSES = [
  "requested",
  "payment_pending",
  "completed",
  "failed",
] as const;
const PLAN_TYPES = ["standard", "enterprise", "custom"] as const;
const BILLING_ERROR_CODES = [
  "invalid_session",
  "validation_error",
  "subscription_not_required",
  "active_access_exists",
  "checkout_session_pending",
  "checkout_payment_pending",
  "checkout_state_conflict",
  "billing_owner_required",
  "unsupported_plan_change",
  "subscription_cancellation_pending",
  "subscription_change_pending",
  "billing_not_configured",
  "billing_provider_unavailable",
  "billing_reconciliation_failed",
  "subscription_required",
  "report_quota_exhausted",
] as const;

assert.equal(utcIsoDateTimeSchema.parse("2026-09-10T10:00:00Z"), "2026-09-10T10:00:00Z");
assert.equal(
  utcIsoDateTimeSchema.parse("2026-09-10T10:00:00.000Z"),
  "2026-09-10T10:00:00.000Z",
);
assert.equal(
  utcIsoDateTimeSchema.parse("2026-09-10T10:00:00+00:00"),
  "2026-09-10T10:00:00+00:00",
);
assert.equal(utcIsoDateTimeSchema.safeParse("2026-09-10T10:00:00+01:00").success, false);
assert.equal(utcIsoDateTimeSchema.safeParse("2026-09-10T10:00:00").success, false);
assert.equal(utcIsoDateTimeSchema.safeParse("2026-09-10 10:00:00Z").success, false);

assert.equal(amountMinorSchema.parse(0), 0);
assert.equal(amountMinorSchema.parse(240000), 240000);
assert.equal(amountMinorSchema.safeParse(-1).success, false);
assert.equal(amountMinorSchema.safeParse(1.5).success, false);

assert.equal(currencyCodeSchema.parse("usd"), "usd");
assert.equal(currencyCodeSchema.parse("GBP"), "GBP");
assert.equal(currencyCodeSchema.safeParse("us").success, false);
assert.equal(currencyCodeSchema.safeParse("USDT").success, false);
assert.equal(currencyCodeSchema.safeParse("").success, false);

for (const planType of PLAN_TYPES) {
  assert.equal(planTypeSchema.parse(planType), planType);
  assert.equal(planIntentSchema.parse(planType), planType);
}
assert.equal(planTypeSchema.safeParse("pro").success, false);
assert.equal(purchasablePlanTypeSchema.parse("standard"), "standard");
assert.equal(purchasablePlanTypeSchema.parse("enterprise"), "enterprise");
assert.equal(purchasablePlanTypeSchema.safeParse("custom").success, false);

for (const status of SUBSCRIPTION_STATUSES) {
  assert.equal(subscriptionStatusSchema.parse(status), status);
  assert.equal(
    subscriptionSummarySchema.parse({
      ...buildStandardSubscription(),
      status,
    }).status,
    status,
  );
}
assert.equal(subscriptionStatusSchema.safeParse("canceled").success, false);
assert.equal(subscriptionStatusSchema.safeParse("incomplete").success, false);

for (const status of CHECKOUT_STATUSES) {
  assert.equal(checkoutStatusSchema.parse(status), status);
  assert.equal(
    checkoutStateSchema.parse({
      ...openCheckout,
      status,
      checkout_url:
        status === "creating" ? null : "https://checkout.stripe.com/c/pay/example",
      expires_at: status === "creating" ? null : "2026-09-11T10:00:00Z",
    }).status,
    status,
  );
}
assert.equal(checkoutStatusSchema.safeParse("pending").success, false);

for (const status of PLAN_CHANGE_STATUSES) {
  assert.equal(planChangeStatusSchema.parse(status), status);
  assert.equal(
    planChangeStateSchema.parse({
      ...pendingInvoice,
      status,
      hosted_invoice_url:
        status === "payment_pending"
          ? "https://invoice.stripe.com/i/example"
          : null,
    }).status,
    status,
  );
}
assert.equal(planChangeStatusSchema.safeParse("open").success, false);

assert.deepEqual(
  subscriptionSummarySchema.parse(buildStandardSubscription()).limits,
  { seats: 1, reports: 30 },
);
assert.deepEqual(
  subscriptionSummarySchema.parse(buildEnterpriseSubscription()).limits,
  { seats: 10, reports: 100 },
);
assert.equal(
  subscriptionSummarySchema.safeParse({
    ...buildStandardSubscription(),
    limits: { seats: 0, reports: 30 },
  }).success,
  false,
);
assert.equal(
  subscriptionSummarySchema.safeParse({
    ...buildStandardSubscription(),
    amount_minor: -1,
  }).success,
  false,
);
assert.equal(
  subscriptionSummarySchema.safeParse({
    ...buildStandardSubscription(),
    currency: "dollar",
  }).success,
  false,
);
assert.equal(
  subscriptionSummarySchema.safeParse({
    ...buildStandardSubscription(),
    current_period_end: "2026-10-10T10:00:00+05:00",
  }).success,
  false,
);

assert.equal(
  subscriptionQuotaSchema.parse({
    quota_total: 0,
    quota_used: 0,
    quota_remaining: 0,
    period_start: "2026-09-10T10:00:00Z",
    period_end: "2026-10-10T10:00:00Z",
  }).quota_remaining,
  0,
);
assert.equal(
  subscriptionQuotaSchema.safeParse({
    quota_total: 30,
    quota_used: 7,
    quota_remaining: -1,
    period_start: "2026-09-10T10:00:00Z",
    period_end: "2026-10-10T10:00:00Z",
  }).success,
  false,
);

assert.deepEqual(unsubscribedOverview, {
  subscription: null,
  checkout: null,
  plan_change: null,
  quota: null,
  can_use_paid_features: false,
  operation_lock: null,
});
assert.deepEqual(emptySuperAdminOverview, {
  subscription: null,
  checkout: null,
  plan_change: null,
  quota: null,
  can_use_paid_features: true,
  operation_lock: null,
});
assert.equal(
  subscriptionOverviewSchema.safeParse({
    subscription: null,
    checkout: null,
    plan_change: null,
    quota: null,
  }).success,
  false,
);

const zeroQuotaOverview = parseOverview({
  subscription: buildEnterpriseSubscription(),
  quota: {
    quota_total: 0,
    quota_used: 0,
    quota_remaining: 0,
    period_start: "2026-09-10T10:00:00Z",
    period_end: "2026-10-10T10:00:00Z",
  },
  can_use_paid_features: true,
});
assert.deepEqual(selectBillingQuotaView(zeroQuotaOverview, companySeatMe), {
  kind: "known",
  quota: zeroQuotaOverview.quota,
});
assert.equal(isSuperAdminContext(superAdminMe), true);
assert.equal(isSuperAdminContext(personalMe), false);
assert.equal(hasPaidAccess(unsubscribedOverview, superAdminMe), true);
assert.equal(hasPaidAccess(emptySuperAdminOverview, personalMe), true);
assert.equal(hasReconciledPaidSubscription(emptySuperAdminOverview), false);
assert.equal(hasReconciledPaidSubscription(standardPaidOverview), true);
assert.equal(hasReconciledPaidSubscription(unpaidWithFeatures), false);
assert.equal(
  selectBillingSettingsKind(unsubscribedOverview, superAdminMe),
  "super_admin",
);
assert.equal(selectBillingSettingsKind(unsubscribedOverview, personalMe), "picker");
assert.equal(
  selectBillingQuotaView(emptySuperAdminOverview, superAdminMe).kind,
  "unlimited",
);
assert.equal(
  selectBillingQuotaView(unsubscribedOverview, personalMe).kind,
  "unavailable",
);

assert.deepEqual(checkoutRequestSchema.parse({ plan_type: "standard" }), {
  plan_type: "standard",
});
assert.deepEqual(
  checkoutRequestSchema.parse({
    plan_type: "enterprise",
    company_name: "  Example Pharma  ",
  }),
  {
    plan_type: "enterprise",
    company_name: "Example Pharma",
  },
);
assert.equal(
  checkoutRequestSchema.safeParse({
    plan_type: "standard",
    company_name: "Example Pharma",
  }).success,
  false,
);
assert.equal(checkoutRequestSchema.safeParse({ plan_type: "enterprise" }).success, false);
assert.equal(
  checkoutRequestSchema.safeParse({
    plan_type: "enterprise",
    company_name: "   ",
  }).success,
  false,
);
assert.equal(
  checkoutRequestSchema.safeParse({
    plan_type: "enterprise",
    company_name: "a".repeat(201),
  }).success,
  false,
);
assert.equal(checkoutRequestSchema.safeParse({ plan_type: "custom" }).success, false);
assert.equal(
  checkoutRequestSchema.safeParse({
    plan_type: "standard",
    stripe_price_id: "price_123",
  }).success,
  false,
);
assert.equal(
  checkoutRequestSchema.safeParse({
    plan_type: "enterprise",
    company_name: "Example Pharma",
    stripe_product_id: "prod_123",
  }).success,
  false,
);

assert.equal(companyNameSchema.parse("Acme"), "Acme");
assert.equal(companyNameSchema.parse("  Acme  "), "Acme");
assert.equal(companyNameSchema.parse("a".repeat(200)).length, 200);
assert.equal(companyNameSchema.safeParse("").success, false);
assert.equal(companyNameSchema.safeParse("a".repeat(201)).success, false);

assert.deepEqual(
  upgradeRequestSchema.parse({ company_name: "  Example Pharma  " }),
  { company_name: "Example Pharma" },
);
assert.equal(upgradeRequestSchema.safeParse({ company_name: "" }).success, false);
assert.equal(
  upgradeRequestSchema.safeParse({
    company_name: "Example Pharma",
    plan_type: "enterprise",
  }).success,
  false,
);
assert.equal(
  upgradeRequestSchema.safeParse({
    company_name: "Example Pharma",
    stripe_customer_id: "cus_123",
  }).success,
  false,
);

assert.equal(
  checkoutResponseSchema.parse({
    checkout_id: "subscription_checkout_01EXAMPLE",
    plan_type: "enterprise",
    stripe_checkout_session_id: "cs_test_example",
    checkout_url: "https://checkout.stripe.com/c/pay/example",
    expires_at: "2026-09-11T10:00:00Z",
  }).plan_type,
  "enterprise",
);
assert.equal(
  checkoutResponseSchema.safeParse({
    checkout_id: "subscription_checkout_01EXAMPLE",
    plan_type: "custom",
    stripe_checkout_session_id: "cs_test_example",
    checkout_url: "https://checkout.stripe.com/c/pay/example",
    expires_at: "2026-09-11T10:00:00Z",
  }).success,
  false,
);
assert.equal(
  portalResponseSchema.parse({
    url: "https://billing.stripe.com/p/session/example",
  }).url,
  "https://billing.stripe.com/p/session/example",
);
assert.equal(
  upgradeResponseSchema.parse({
    plan_change_id: "subscription_plan_change_01EXAMPLE",
    status: "payment_pending",
    hosted_invoice_url: "https://invoice.stripe.com/i/example",
  }).hosted_invoice_url,
  "https://invoice.stripe.com/i/example",
);
assert.equal(
  upgradeResponseSchema.parse({
    plan_change_id: "subscription_plan_change_01EXAMPLE",
    status: "requested",
    hosted_invoice_url: null,
  }).hosted_invoice_url,
  null,
);

assert.deepEqual(
  billingErrorSchema.parse({
    code: "checkout_session_pending",
    message: "Another subscription checkout is already in progress",
    details: { plan_type: "standard" },
    request_id: "request-correlation-id",
  }),
  {
    code: "checkout_session_pending",
    message: "Another subscription checkout is already in progress",
    details: { plan_type: "standard" },
    request_id: "request-correlation-id",
  },
);
assert.equal(
  billingErrorSchema.parse({
    code: "validation_error",
    message: "Invalid input",
    details: null,
    request_id: null,
  }).details,
  null,
);
for (const code of BILLING_ERROR_CODES) {
  assert.equal(billingErrorCodeSchema.parse(code), code);
}
assert.equal(billingErrorCodeSchema.safeParse("stripe_error").success, false);

assert.equal(sanitizePlanIntent("standard"), "standard");
assert.equal(sanitizePlanIntent("enterprise"), "enterprise");
assert.equal(sanitizePlanIntent("custom"), "custom");
assert.equal(sanitizePlanIntent("STANDARD"), null);
assert.equal(sanitizePlanIntent("pro"), null);
assert.equal(sanitizePlanIntent(""), null);
assert.equal(sanitizePlanIntent(null), null);
assert.equal(sanitizePlanIntent(undefined), null);
assert.equal(sanitizePlanIntentParam("enterprise"), "enterprise");
assert.equal(sanitizePlanIntentParam(["standard", "enterprise"]), "standard");
assert.equal(sanitizePlanIntentParam(["nope"]), null);
assert.equal(sanitizePlanIntentParam(undefined), null);
assert.equal(PLAN_INTENT_QUERY_PARAM, "plan");
assert.equal(buildSignupPlanPath("standard"), "/signup?plan=standard");
assert.equal(buildSignupPlanPath("enterprise"), "/signup?plan=enterprise");
assert.equal(buildSignupPlanPath("custom"), "/signup?plan=custom");
assert.equal(resolvePricingPlanHref("standard"), "/signup?plan=standard");
assert.equal(resolvePricingPlanHref("enterprise"), "/signup?plan=enterprise");
assert.equal(resolvePricingPlanHref("custom"), BILLING_PATHS.customInquiry);
assert.equal(resolvePricingPlanHref("unknown"), BILLING_PATHS.customInquiry);
assert.equal(storePlanIntent("standard"), "standard");
assert.equal(storePlanIntent("not-a-plan"), null);
assert.equal(readPlanIntent(), null);
clearPlanIntent();
syncPlanIntentWithOverview(standardPaidOverview);
syncPlanIntentWithOverview(unsubscribedOverview);

assert.equal(
  formatAmountMinor(2000, "usd"),
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(20),
);
assert.equal(
  formatAmountMinor(48000, "gbp"),
  new Intl.NumberFormat("en-US", { style: "currency", currency: "GBP" }).format(480),
);
assert.equal(
  formatAmountMinor(240000, "gbp"),
  new Intl.NumberFormat("en-US", { style: "currency", currency: "GBP" }).format(2400),
);
assert.equal(
  formatAmountMinor(2000, "jpy"),
  new Intl.NumberFormat("en-US", { style: "currency", currency: "JPY" }).format(2000),
);
assert.equal(getCurrencyFractionDigits("usd"), 2);
assert.equal(getCurrencyFractionDigits("gbp"), 2);
assert.equal(getCurrencyFractionDigits("jpy"), 0);
assert.equal(formatAmountMinor(2000, "xxxx"), "2000 xxxx");
assert.equal(formatUtcDate("2026-09-10T10:00:00Z"), "2026-09-10");
assert.equal(formatUtcDateTime("2026-09-10T10:00:00Z"), "2026-09-10 10:00 UTC");
assert.equal(formatUtcDate("not-a-date"), "not-a-date");
assert.equal(formatUtcDateTime("not-a-date"), "not-a-date");
assert.equal(formatPlanName("standard"), "Standard");
assert.equal(formatPlanName("enterprise"), "Enterprise");
assert.equal(formatPlanName("custom"), "Custom");
assert.equal(formatStatusLabel("past_due"), "past due");
assert.equal(formatStatusLabel("active"), "active");
assert.equal(formatBillingIntervalSuffix("month"), "/mo");
assert.equal(formatBillingIntervalCopy("month"), "monthly");

const overlappingOverview = parseOverview({
  subscription: buildStandardSubscription(),
  checkout: openCheckout,
  plan_change: pendingInvoice,
  quota: standardPaidOverview.quota,
  can_use_paid_features: true,
});
assert.equal(selectBillingOverviewUiKind(overlappingOverview), "subscription");
const overlappingUi = selectBillingOverviewUiState(overlappingOverview);
assert.equal(overlappingUi.kind, "subscription");
if (overlappingUi.kind === "subscription") {
  assert.equal(overlappingUi.planChange?.plan_change_id, pendingInvoice.plan_change_id);
  assert.equal(overlappingUi.checkout?.checkout_id, openCheckout.checkout_id);
}

const planChangeOnlyOverview = parseOverview({ plan_change: pendingInvoice });
assert.equal(selectBillingOverviewUiKind(planChangeOnlyOverview), "plan_change");
const planChangeUi = selectBillingOverviewUiState(planChangeOnlyOverview);
assert.equal(planChangeUi.kind, "plan_change");
if (planChangeUi.kind === "plan_change") {
  assert.equal(planChangeUi.planChange.hosted_invoice_url, pendingInvoice.hosted_invoice_url);
}

const checkoutOnlyOverview = parseOverview({ checkout: openCheckout });
assert.equal(selectBillingOverviewUiKind(checkoutOnlyOverview), "checkout");
assert.equal(selectBillingOverviewUiKind(unsubscribedOverview), "picker");
assert.equal(selectBillingOverviewUiState(unsubscribedOverview).kind, "picker");
assert.equal(selectCheckoutActionState({ ...openCheckout, status: "creating" }), "creating");
assert.equal(selectCheckoutActionState(openCheckout), "resume");
assert.equal(
  selectCheckoutActionState({ ...openCheckout, status: "payment_pending" }),
  "payment_pending",
);
assert.equal(selectCheckoutActionState({ ...openCheckout, status: "expired" }), "resume");
assert.equal(getResumableCheckoutUrl(openCheckout), openCheckout.checkout_url);
assert.equal(
  getResumableCheckoutUrl({ ...openCheckout, status: "payment_pending" }),
  openCheckout.checkout_url,
);
assert.equal(
  getResumableCheckoutUrl({ ...openCheckout, status: "creating" }),
  null,
);
assert.equal(
  getResumableCheckoutUrl({ ...openCheckout, status: "expired" }),
  null,
);
assert.equal(getResumableCheckoutUrl({ ...openCheckout, checkout_url: null }), null);
assert.equal(getHostedInvoiceUrl(pendingInvoice), pendingInvoice.hosted_invoice_url);
assert.equal(getHostedInvoiceUrl({ ...pendingInvoice, hosted_invoice_url: null }), null);
assert.equal(getBillingOverviewPollInterval(undefined), false);
assert.equal(
  getBillingOverviewPollInterval(parseOverview({ checkout: { ...openCheckout, status: "creating" } })),
  BILLING_RECONCILIATION_BACKOFF_MS,
);
assert.equal(getBillingOverviewPollInterval(checkoutOnlyOverview), false);
assert.equal(
  getBillingOverviewPollInterval(parseOverview({ plan_change: { ...pendingInvoice, status: "requested" } })),
  BILLING_RECONCILIATION_BACKOFF_MS,
);
assert.equal(getBillingOverviewPollInterval(standardPaidOverview), false);

const cancellingStandardOverview = parseOverview({
  subscription: {
    ...buildStandardSubscription(),
    cancel_at_period_end: true,
  },
  quota: standardPaidOverview.quota,
  can_use_paid_features: true,
});
const pendingUpgradeOverview = parseOverview({
  subscription: buildStandardSubscription(),
  plan_change: pendingInvoice,
  quota: standardPaidOverview.quota,
  can_use_paid_features: true,
});
assert.equal(
  shouldStopBillingReconciliation(pendingUpgradeOverview, personalMe),
  false,
);
assert.equal(
  isBillingReconciliationReady(pendingUpgradeOverview, personalMe),
  false,
);
assert.equal(
  selectBillingReconciliationUiState({
    overview: pendingUpgradeOverview,
    error: undefined,
    timedOut: false,
    me: personalMe,
  }).kind,
  "processing",
);
assert.equal(
  shouldEnableEnterpriseAuthReconciliation({
    enabled: true,
    timedOut: false,
    overview: pendingUpgradeOverview,
    me: personalMe,
  }),
  false,
);
const customPlanOverview = parseOverview({
  subscription: {
    ...buildStandardSubscription(),
    plan_type: "custom",
  },
  can_use_paid_features: true,
});

assert.equal(isBillingOwner(standardPaidOverview, personalMe), true);
assert.equal(isBillingOwner(standardPaidOverview, companyAdminMe), false);
assert.equal(isBillingOwner(enterprisePaidOverview, companyAdminMe), true);
assert.equal(isBillingOwner(enterprisePaidOverview, companySeatMe), false);
assert.equal(isBillingOwner(enterprisePaidOverview, personalMe), false);
assert.equal(isBillingOwner(unsubscribedOverview, personalMe), false);
assert.equal(isBillingOwner(emptySuperAdminOverview, superAdminMe), false);

assert.deepEqual(selectBillingOwnerCapabilities(standardPaidOverview, personalMe), {
  isOwner: true,
  canOpenPortal: true,
  canUpgradeToEnterprise: true,
  requiresPortalBeforeUpgrade: false,
  canDowngradeToStandard: false,
  canRequestCustom: true,
  canScheduleEnterpriseDowngrade: false,
  canCancelEnterpriseDowngrade: false,
});
assert.deepEqual(
  selectBillingOwnerCapabilities(cancellingStandardOverview, personalMe),
  {
    isOwner: true,
    canOpenPortal: true,
    canUpgradeToEnterprise: false,
    requiresPortalBeforeUpgrade: true,
    canDowngradeToStandard: false,
    canRequestCustom: true,
    canScheduleEnterpriseDowngrade: false,
    canCancelEnterpriseDowngrade: false,
  },
);
assert.deepEqual(
  selectBillingOwnerCapabilities(pendingUpgradeOverview, personalMe),
  {
    isOwner: true,
    canOpenPortal: true,
    canUpgradeToEnterprise: false,
    requiresPortalBeforeUpgrade: false,
    canDowngradeToStandard: false,
    canRequestCustom: true,
    canScheduleEnterpriseDowngrade: false,
    canCancelEnterpriseDowngrade: false,
  },
);
assert.deepEqual(
  selectBillingOwnerCapabilities(enterprisePaidOverview, companyAdminMe),
  {
    isOwner: true,
    canOpenPortal: true,
    canUpgradeToEnterprise: false,
    requiresPortalBeforeUpgrade: false,
    canDowngradeToStandard: false,
    canRequestCustom: true,
    canScheduleEnterpriseDowngrade: false,
    canCancelEnterpriseDowngrade: false,
  },
);
assert.deepEqual(
  selectBillingOwnerCapabilities(enterprisePaidOverview, companySeatMe),
  {
    isOwner: false,
    canOpenPortal: false,
    canUpgradeToEnterprise: false,
    requiresPortalBeforeUpgrade: false,
    canDowngradeToStandard: false,
    canRequestCustom: false,
    canScheduleEnterpriseDowngrade: false,
    canCancelEnterpriseDowngrade: false,
  },
);
assert.deepEqual(selectBillingOwnerCapabilities(customPlanOverview, personalMe), {
  isOwner: true,
  canOpenPortal: true,
  canUpgradeToEnterprise: false,
  requiresPortalBeforeUpgrade: false,
  canDowngradeToStandard: false,
  canRequestCustom: true,
  canScheduleEnterpriseDowngrade: false,
  canCancelEnterpriseDowngrade: false,
});
assert.deepEqual(
  selectBillingOwnerCapabilities(emptySuperAdminOverview, superAdminMe),
  {
    isOwner: false,
    canOpenPortal: false,
    canUpgradeToEnterprise: false,
    requiresPortalBeforeUpgrade: false,
    canDowngradeToStandard: false,
    canRequestCustom: false,
    canScheduleEnterpriseDowngrade: false,
    canCancelEnterpriseDowngrade: false,
  },
);

const expiredButAuthorized = parseOverview({
  subscription: {
    ...buildStandardSubscription(),
    current_period_end: "2020-01-01T00:00:00Z",
  },
  quota: {
    quota_total: 30,
    quota_used: 0,
    quota_remaining: 30,
    period_start: "2020-01-01T00:00:00Z",
    period_end: "2020-02-01T00:00:00Z",
  },
  can_use_paid_features: true,
});
const futureButUnauthorized = parseOverview({
  subscription: {
    ...buildStandardSubscription(),
    current_period_end: "2099-01-01T00:00:00Z",
  },
  quota: {
    quota_total: 30,
    quota_used: 0,
    quota_remaining: 30,
    period_start: "2026-09-10T10:00:00Z",
    period_end: "2099-01-01T00:00:00Z",
  },
  can_use_paid_features: false,
});
assert.equal(hasPaidAccess(expiredButAuthorized, personalMe), true);
assert.equal(hasPaidAccess(futureButUnauthorized, personalMe), false);
assert.equal(
  canUsePaidFeature(futureButUnauthorized, "report_generation", personalMe),
  false,
);
assert.equal(
  resolvePaidFeatureDestination({
    overview: futureButUnauthorized,
    me: personalMe,
    feature: "report_generation",
    allowedPath: "/reports/new",
  }),
  BILLING_PATHS.settings,
);

const pastDueStandardOverview = parseOverview({
  subscription: {
    ...buildStandardSubscription(),
    status: "past_due",
  },
  quota: null,
  can_use_paid_features: false,
});
assert.equal(
  resolvePostAuthBillingDestination({
    me: personalMe,
    overview: pastDueStandardOverview,
  }),
  BILLING_PATHS.settings,
);
assert.equal(
  resolveOnboardingExitPath({
    me: personalMe,
    overview: pastDueStandardOverview,
  }),
  BILLING_PATHS.settings,
);

assert.equal(
  resolvePostAuthBillingDestination({
    me: personalMe,
    overview: unsubscribedOverview,
  }),
  BILLING_PATHS.onboarding,
);
assert.equal(hasPaidAccess(unsubscribedOverview, reviewerMe), false);
assert.equal(
  resolvePostAuthBillingDestination({
    me: reviewerMe,
    overview: unsubscribedOverview,
  }),
  "/reviewer/assignments",
);
assert.equal(
  resolvePostAuthBillingDestination({
    me: reviewerMe,
    overview: unsubscribedOverview,
    returnTo: "/reports/new",
  }),
  "/reviewer/assignments",
);
assert.equal(
  resolvePostAuthBillingDestination({
    me: reviewerMe,
    overview: unsubscribedOverview,
    returnTo: "/reviewer/assignments/assignment-1?view=notes",
  }),
  "/reviewer/assignments/assignment-1?view=notes",
);
assert.equal(
  resolveOnboardingExitPath({
    me: reviewerMe,
    overview: unsubscribedOverview,
  }),
  "/reviewer/assignments",
);
assert.equal(
  resolvePostAuthBillingDestination({
    me: personalMe,
    overview: unsubscribedOverview,
    returnTo: "/reports/new",
  }),
  buildSubscriptionOnboardingPath("/reports/new"),
);
assert.equal(
  resolvePostAuthBillingDestination({
    me: personalMe,
    overview: unsubscribedOverview,
    returnTo: BILLING_PATHS.success,
  }),
  BILLING_PATHS.onboarding,
);
assert.equal(
  resolvePostAuthBillingDestination({
    me: personalMe,
    overview: standardPaidOverview,
    returnTo: "/reports/new",
  }),
  "/reports/new",
);
assert.equal(
  resolvePostAuthBillingDestination({
    me: personalMe,
    overview: standardPaidOverview,
    returnTo: BILLING_PATHS.onboarding,
  }),
  "/dashboard",
);
assert.equal(
  resolvePostAuthBillingDestination({
    me: superAdminMe,
    overview: unsubscribedOverview,
    returnTo: "/super-admin/users",
  }),
  "/super-admin/users",
);
assert.equal(
  resolveOnboardingExitPath({
    me: personalMe,
    overview: unsubscribedOverview,
  }),
  null,
);
assert.equal(
  resolveOnboardingExitPath({
    me: personalMe,
    overview: standardPaidOverview,
    returnTo: "/reports/new",
  }),
  "/reports/new",
);

const validationError = billingError({
  status: 422,
  code: "validation_error",
  message: "Please correct the highlighted fields and try again.",
  fieldErrors: { company_name: "Company name is required." },
});
const classifiedValidation = classifyBillingError(validationError);
assert.equal(classifiedValidation.kind, "validation_error");
assert.equal(classifiedValidation.retryable, false);
assert.equal(classifiedValidation.fieldErrors.company_name, "Company name is required.");
assert.equal(shouldRetryBillingQuery(0, validationError), false);
assert.equal(shouldRetryBillingMutation(0, validationError), false);

try {
  checkoutRequestSchema.parse({ plan_type: "enterprise" });
  assert.fail("enterprise checkout must require company_name");
} catch (error) {
  const classified = classifyBillingError(error);
  assert.equal(classified.kind, "validation_error");
  assert.equal(classified.retryable, false);
  assert.ok(Object.keys(classified.fieldErrors).length > 0);
}

const classifiedNotRequired = classifyBillingError(
  billingError({
    status: 403,
    code: "subscription_not_required",
    message: "A subscription is not required for this account.",
  }),
);
assert.equal(classifiedNotRequired.kind, "subscription_not_required");
assert.equal(classifiedNotRequired.refetchAuth, true);
assert.equal(classifiedNotRequired.retryable, false);

const classifiedActiveAccess = classifyBillingError(
  billingError({
    status: 409,
    code: "active_access_exists",
    message: "An access mode already exists.",
  }),
);
assert.equal(classifiedActiveAccess.reloadOverview, true);
assert.equal(classifiedActiveAccess.refetchAuth, true);

const classifiedCheckoutConflict = classifyBillingError(
  billingError({
    status: 409,
    code: "checkout_state_conflict",
    message: "Checkout could not continue from its current state.",
  }),
);
assert.equal(classifiedCheckoutConflict.reloadOverview, true);
assert.equal(classifiedCheckoutConflict.retryable, false);

const classifiedOwnerRequired = classifyBillingError(
  billingError({
    status: 403,
    code: "billing_owner_required",
    message: "Only the billing owner can manage this subscription.",
  }),
);
assert.equal(classifiedOwnerRequired.hideOwnerControls, true);
assert.equal(classifiedOwnerRequired.retryable, false);

const classifiedUnsupportedChange = classifyBillingError(
  billingError({
    status: 409,
    code: "unsupported_plan_change",
    message: "Only an active Standard subscription can be upgraded to Enterprise.",
  }),
);
assert.equal(classifiedUnsupportedChange.reloadOverview, true);

const classifiedCancellationPending = classifyBillingError(
  billingError({
    status: 409,
    code: "subscription_cancellation_pending",
    message: "Resume this subscription in the billing portal before upgrading.",
  }),
);
assert.equal(classifiedCancellationPending.openPortal, true);
assert.equal(classifiedCancellationPending.reloadOverview, true);

const classifiedChangePending = classifyBillingError(
  billingError({
    status: 409,
    code: "subscription_change_pending",
    message: "An Enterprise upgrade is already in progress.",
  }),
);
assert.equal(classifiedChangePending.reloadOverview, true);

const notConfiguredError = billingError({
  status: 503,
  code: "billing_not_configured",
  message: "Billing is temporarily unavailable because it is not configured.",
});
const classifiedNotConfigured = classifyBillingError(notConfiguredError);
assert.equal(classifiedNotConfigured.kind, "billing_not_configured");
assert.equal(classifiedNotConfigured.retryable, false);
assert.equal(shouldRetryBillingQuery(0, notConfiguredError), false);
assert.equal(shouldRetryBillingMutation(0, notConfiguredError), false);
assert.equal(getBillingErrorRefetchIntervalMs(notConfiguredError), false);

const providerWithRetryAfter = billingError({
  status: 503,
  code: "billing_provider_unavailable",
  message: "The billing provider is temporarily unavailable.",
  retryAfterSeconds: 7,
});
assert.equal(classifyBillingError(providerWithRetryAfter).retryAfterSeconds, 7);
assert.equal(getBillingRetryDelay(0, providerWithRetryAfter), 7000);
assert.equal(getBillingErrorRefetchIntervalMs(providerWithRetryAfter), 7000);
assert.equal(
  shouldRetryBillingQuery(BILLING_MAX_PROVIDER_FAILURES - 1, providerUnavailableError),
  true,
);
assert.equal(
  shouldRetryBillingQuery(BILLING_MAX_PROVIDER_FAILURES, providerUnavailableError),
  false,
);
assert.equal(
  shouldRetryBillingMutation(
    BILLING_MAX_MUTATION_PROVIDER_FAILURES - 1,
    providerUnavailableError,
  ),
  true,
);
assert.equal(
  shouldRetryBillingMutation(
    BILLING_MAX_MUTATION_PROVIDER_FAILURES,
    providerUnavailableError,
  ),
  false,
);
assert.equal(
  shouldRetryBillingQuery(BILLING_MAX_QUERY_FAILURES, reconciliationFailedError),
  false,
);
assert.equal(
  getBillingRetryDelay(0, providerUnavailableError),
  BILLING_RECONCILIATION_BACKOFF_MS,
);
assert.equal(
  getBillingRetryDelay(1, providerUnavailableError),
  BILLING_RECONCILIATION_BACKOFF_MS * 2,
);

const abortError = new Error("Aborted");
abortError.name = "AbortError";
assert.equal(classifyBillingError(abortError).kind, "aborted");
assert.equal(shouldRetryBillingQuery(0, abortError), false);
assert.equal(shouldRetryBillingMutation(0, abortError), false);
assert.equal(getBillingErrorRefetchIntervalMs(abortError), false);

assert.equal(classifiedReconciliation.showRequestId, true);
assert.equal(classifiedReconciliation.requestId, "req-reconciliation");
assert.equal(isTerminalClassifiedBillingError(classifiedNotConfigured), true);
assert.equal(isTerminalClassifiedBillingError(classifiedProvider), false);

assert.equal(BILLING_RECONCILIATION_TIMEOUT_MS, 30_000);
assert.equal(BILLING_PATHS.onboarding, "/onboarding/subscription");
assert.equal(BILLING_PATHS.success, "/billing/success");
assert.equal(BILLING_PATHS.settings, "/settings/billing");
assert.equal(BILLING_PATHS.customInquiry, "/#contact");
assert.deepEqual(billingQueryKeys.overview("user-1"), ["billing", "overview", "user-1"]);
assert.deepEqual(billingQueryKeys.checkout(), ["billing", "mutation", "checkout"]);
assert.deepEqual(billingQueryKeys.portal(), ["billing", "mutation", "portal"]);
assert.deepEqual(billingQueryKeys.upgrade(), ["billing", "mutation", "upgrade"]);

assert.equal(isBillingReconciliationReady(unsubscribedOverview, personalMe), false);
assert.equal(hasPaidAccess(unsubscribedOverview, personalMe), false);
assert.equal(
  selectBillingOwnerCapabilities(standardPaidOverview, personalMe).canDowngradeToStandard,
  false,
);
assert.equal(
  selectBillingOwnerCapabilities(enterprisePaidOverview, companyAdminMe).canRequestCustom,
  true,
);
assert.equal(
  selectBillingOwnerCapabilities(enterprisePaidOverview, companySeatMe).canRequestCustom,
  false,
);
assert.equal(
  selectPaidFeatureAccess(standardPaidOverview, personalMe).report_generation,
  true,
);
assert.equal(
  selectPaidFeatureAccess(unsubscribedOverview, personalMe).report_generation,
  false,
);

// --- Custom subscriptions: operation lock, downgrade, Custom routing ---

const COMPANY_LOCK = {
  reason: "custom_subscription_payment_pending",
  blocked_actions: [
    "report_generation",
    "seat_changes",
    "invitation_create",
    "invitation_resend",
    "invitation_accept",
    "quota_changes",
  ],
  can_manage_payment: false,
} as const;
const PERSONAL_LOCK = {
  reason: "custom_subscription_payment_pending",
  blocked_actions: ["report_generation"],
  can_manage_payment: true,
} as const;

assert.equal(operationLockSchema.safeParse(COMPANY_LOCK).success, true);
assert.equal(operationLockSchema.safeParse(PERSONAL_LOCK).success, true);
assert.equal(
  operationLockSchema.safeParse({ ...PERSONAL_LOCK, reason: "other" }).success,
  false,
);
assert.equal(
  operationLockSchema.safeParse({
    ...PERSONAL_LOCK,
    blocked_actions: ["invitation_revoke"],
  }).success,
  false,
);
assert.equal(unsubscribedOverview.operation_lock, null);

const lockedCompanyOverview = parseOverview({
  subscription: buildEnterpriseSubscription(),
  can_use_paid_features: true,
  operation_lock: COMPANY_LOCK,
});
const lockedPersonalOverview = parseOverview({
  subscription: buildStandardSubscription(),
  can_use_paid_features: true,
  operation_lock: PERSONAL_LOCK,
});

assert.deepEqual(selectOperationLock(lockedCompanyOverview), COMPANY_LOCK);
assert.equal(selectOperationLock(standardPaidOverview), null);
assert.equal(selectOperationLock(undefined), null);
assert.equal(isOperationBlocked(lockedCompanyOverview, "seat_changes"), true);
assert.equal(isOperationBlocked(lockedPersonalOverview, "seat_changes"), false);
assert.equal(isOperationBlocked(lockedPersonalOverview, "report_generation"), true);
assert.equal(isOperationBlocked(standardPaidOverview, "report_generation"), false);
assert.equal(selectOperationLockScope(operationLockSchema.parse(COMPANY_LOCK)), "company");
assert.equal(selectOperationLockScope(operationLockSchema.parse(PERSONAL_LOCK)), "personal");
assert.match(
  getOperationLockMessage(operationLockSchema.parse(PERSONAL_LOCK)),
  /Report generation is paused/,
);
assert.match(
  getOperationLockMessage(operationLockSchema.parse(COMPANY_LOCK)),
  /company's plan is being updated/,
);
assert.equal(
  isOperationLockError(
    billingError({
      status: 409,
      code: "custom_subscription_payment_in_progress",
      message: "paused",
    }),
  ),
  true,
);
assert.equal(
  isOperationLockError(billingError({ status: 409, code: "other", message: "x" })),
  false,
);

// A Standard plan is still paid while a Standard -> Custom payment is open, so
// the return page must keep waiting instead of treating it as reconciled.
assert.equal(isBillingReconciliationReady(lockedPersonalOverview, personalMe), false);
assert.equal(shouldStopBillingReconciliation(lockedPersonalOverview, personalMe), false);
assert.equal(isBillingReconciliationReady(lockedCompanyOverview, companyAdminMe), false);

function buildCustomSubscription(overrides: Record<string, unknown> = {}) {
  return {
    ...buildEnterpriseSubscription(),
    id: "subscription_01CUSTOM",
    plan_type: "custom" as const,
    amount_minor: 75000,
    limits: { seats: 15, reports: 150 },
    ...overrides,
  };
}

const customCompanyOverview = parseOverview({
  subscription: buildCustomSubscription(),
  can_use_paid_features: true,
});
assert.equal(isBillingReconciliationReady(customCompanyOverview, personalMe), false);
assert.equal(shouldRefetchAuthAfterBilling(customCompanyOverview, personalMe), true);
assert.equal(isBillingReconciliationReady(customCompanyOverview, companyAdminMe), true);
assert.equal(shouldRefetchAuthAfterBilling(customCompanyOverview, companyAdminMe), false);

const scheduledDowngrade = {
  plan_change_id: "subscription_plan_change_30c7e09a-61dc-423f-94e7-51ff250fab1d",
  from_plan: "custom" as const,
  to_plan: "enterprise" as const,
  company_name: "Acme Pharma",
  status: "scheduled" as const,
  hosted_invoice_url: null,
  effective_at: "2026-10-29T12:00:00Z",
};
assert.equal(planChangeStateSchema.parse(scheduledDowngrade).effective_at, "2026-10-29T12:00:00Z");
assert.equal(planChangeStateSchema.parse(pendingInvoice).effective_at, null);
assert.equal(
  downgradeResponseSchema.safeParse({
    plan_change_id: scheduledDowngrade.plan_change_id,
    status: "scheduled",
    effective_at: "2026-10-29T12:00:00Z",
  }).success,
  true,
);
assert.equal(
  downgradeResponseSchema.safeParse({
    plan_change_id: scheduledDowngrade.plan_change_id,
    status: "completed",
    effective_at: "2026-10-29T12:00:00Z",
  }).success,
  false,
);

const scheduledDowngradeOverview = parseOverview({
  subscription: buildCustomSubscription(),
  plan_change: scheduledDowngrade,
  can_use_paid_features: true,
});
assert.equal(hasScheduledEnterpriseDowngrade(scheduledDowngradeOverview), true);
assert.equal(hasScheduledEnterpriseDowngrade(processingOverview), false);
// A scheduled downgrade keeps Custom active; it is not an in-flight payment.
assert.equal(getBillingOverviewPollInterval(scheduledDowngradeOverview), false);
assert.equal(
  isBillingReconciliationReady(scheduledDowngradeOverview, companyAdminMe),
  true,
);

const customAdminCapabilities = selectBillingOwnerCapabilities(
  customCompanyOverview,
  companyAdminMe,
);
assert.equal(customAdminCapabilities.canScheduleEnterpriseDowngrade, true);
assert.equal(customAdminCapabilities.canCancelEnterpriseDowngrade, false);
assert.equal(customAdminCapabilities.canRequestCustom, true);

const scheduledCapabilities = selectBillingOwnerCapabilities(
  scheduledDowngradeOverview,
  companyAdminMe,
);
assert.equal(scheduledCapabilities.canScheduleEnterpriseDowngrade, false);
assert.equal(scheduledCapabilities.canCancelEnterpriseDowngrade, true);

assert.equal(
  selectBillingOwnerCapabilities(
    parseOverview({
      subscription: buildCustomSubscription({ cancel_at_period_end: true }),
      can_use_paid_features: true,
    }),
    companyAdminMe,
  ).canScheduleEnterpriseDowngrade,
  false,
);
assert.equal(
  selectBillingOwnerCapabilities(
    parseOverview({
      subscription: buildCustomSubscription(),
      can_use_paid_features: true,
      operation_lock: { ...COMPANY_LOCK, can_manage_payment: true },
    }),
    companyAdminMe,
  ).canScheduleEnterpriseDowngrade,
  false,
);
assert.equal(
  selectBillingOwnerCapabilities(customCompanyOverview, companySeatMe)
    .canScheduleEnterpriseDowngrade,
  false,
);
assert.equal(
  selectBillingOwnerCapabilities(enterprisePaidOverview, companyAdminMe)
    .canScheduleEnterpriseDowngrade,
  false,
);

assert.equal(canRequestCustomPlan(personalMe), true);
assert.equal(canRequestCustomPlan(companyAdminMe), true);
assert.equal(canRequestCustomPlan(companySeatMe), false);
assert.equal(canRequestCustomPlan(superAdminMe), false);
assert.equal(canRequestCustomPlan(reviewerMe), false);
assert.equal(canRequestCustomPlan(undefined), false);

function findPlanCard(
  overview: SubscriptionOverview,
  me: AuthMeResponse,
  plan: "standard" | "enterprise" | "custom",
) {
  const card = selectBillingPlanCards(
    overview,
    selectBillingOwnerCapabilities(overview, me),
  ).find((option) => option.id === plan);
  assert.ok(card);
  return card;
}

assert.equal(findPlanCard(unsubscribedOverview, personalMe, "custom").action, "custom");
assert.equal(findPlanCard(unsubscribedOverview, personalMe, "custom").priceLabel, "Custom");
assert.equal(findPlanCard(enterprisePaidOverview, companyAdminMe, "custom").action, "custom");
assert.equal(findPlanCard(enterprisePaidOverview, companySeatMe, "custom").action, "none");
assert.equal(
  findPlanCard(lockedPersonalOverview, personalMe, "custom").ctaLabel,
  "Manage Custom payment",
);
assert.equal(findPlanCard(lockedPersonalOverview, personalMe, "enterprise").action, "none");
assert.equal(
  findPlanCard(lockedPersonalOverview, personalMe, "enterprise").ctaLabel,
  "Payment in progress",
);
assert.equal(findPlanCard(customCompanyOverview, companyAdminMe, "custom").action, "none");
assert.equal(
  findPlanCard(customCompanyOverview, companyAdminMe, "enterprise").action,
  "downgrade",
);
assert.equal(
  findPlanCard(scheduledDowngradeOverview, companyAdminMe, "enterprise").ctaLabel,
  "Downgrade scheduled",
);
assert.equal(
  findPlanCard(scheduledDowngradeOverview, companyAdminMe, "enterprise").action,
  "none",
);

assert.equal(BILLING_PATHS.custom, "/settings/billing/custom");
assert.equal(BILLING_PATHS.customOffer, "/settings/billing/custom-offer");
assert.equal(BILLING_PATHS.companySeats, "/company-admin/seats");
assert.equal(isCustomSubscriptionPath("/settings/billing/custom"), true);
assert.equal(
  isCustomSubscriptionPath("/settings/billing/custom-offer?offer_id=custom_subscription_offer_1"),
  true,
);
assert.equal(isCustomSubscriptionPath("/settings/billing"), false);

// An unpaid user following the offer email must land on the offer, not onboarding.
assert.equal(
  resolvePostAuthBillingDestination({
    me: personalMe,
    overview: unsubscribedOverview,
    returnTo: "/settings/billing/custom-offer?offer_id=custom_subscription_offer_1",
  }),
  "/settings/billing/custom-offer?offer_id=custom_subscription_offer_1",
);
assert.equal(
  resolvePostAuthBillingDestination({
    me: personalMe,
    overview: pastDueStandardOverview,
    returnTo: BILLING_PATHS.custom,
  }),
  BILLING_PATHS.custom,
);
assert.equal(
  resolvePostAuthBillingDestination({
    me: superAdminMe,
    overview: unsubscribedOverview,
    returnTo: BILLING_PATHS.custom,
  }),
  BILLING_PATHS.custom,
);
assert.equal(
  resolvePostAuthBillingDestination({
    me: personalMe,
    overview: unsubscribedOverview,
    returnTo: "//evil.example/settings/billing/custom",
  }),
  BILLING_PATHS.onboarding,
);

for (const [code, destination] of [
  ["subscription_payment_pending", BILLING_PATHS.custom],
  ["enterprise_capacity_exceeded", BILLING_PATHS.companySeats],
  ["custom_subscription_request_active", BILLING_PATHS.custom],
  ["custom_subscription_payment_in_progress", null],
  ["scheduled_downgrade_not_found", null],
] as const) {
  const classified = classifyBillingError(
    billingError({ status: 409, code, message: "server message" }),
  );
  assert.equal(classified.kind, code);
  assert.equal(classified.destination, destination);
  assert.equal(billingErrorCodeSchema.parse(code), code);
}
assert.equal(
  classifyBillingError(
    billingError({ status: 409, code: "scheduled_downgrade_not_found", message: "x" }),
  ).reloadOverview,
  true,
);
assert.equal(
  getPaidActionFailureKind(
    billingError({
      status: 409,
      code: "custom_subscription_payment_in_progress",
      message: "paused",
    }),
  ),
  null,
);

assert.equal(
  resolveHostedBillingUrl("https://invoice.stripe.com/i/acct_123/test_abc"),
  "https://invoice.stripe.com/i/acct_123/test_abc",
);
assert.equal(resolveHostedBillingUrl("javascript:alert(1)"), null);
assert.equal(resolveHostedBillingUrl("not a url"), null);
assert.equal(resolveHostedBillingUrl(null), null);

assert.deepEqual(billingQueryKeys.downgrade(), ["billing", "mutation", "downgrade"]);
assert.deepEqual(billingQueryKeys.cancelDowngrade(), [
  "billing",
  "mutation",
  "cancel-downgrade",
]);
