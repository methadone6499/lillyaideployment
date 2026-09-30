import {
  getActiveContext,
  hasPermission,
  type AuthMeResponse,
} from "@/features/auth";

import type {
  SubscriptionFeaturesSnapshot,
  SubscriptionOverview,
  SubscriptionQuota,
} from "../schemas/billingSchemas";

export type BillingQuotaView =
  | { kind: "unlimited" }
  | { kind: "unavailable" }
  | { kind: "known"; quota: SubscriptionQuota };

export type BillingOwnerCapabilities = {
  isOwner: boolean;
  canOpenPortal: boolean;
  canUpgradeToEnterprise: boolean;
  requiresPortalBeforeUpgrade: boolean;
  canDowngradeToStandard: false;
  canRequestCustom: boolean;
  canScheduleEnterpriseDowngrade: boolean;
  canCancelEnterpriseDowngrade: boolean;
};

export type PaidFeatureName = keyof SubscriptionFeaturesSnapshot;

export type ReportQuotaSource =
  | "unlimited"
  | "company_allocation"
  | "subscription_overview";

export function isSuperAdminContext(
  me: AuthMeResponse | null | undefined,
): boolean {
  const context = getActiveContext(me);
  return context?.type === "global" && context.role === "super_admin";
}

export function hasPaidAccess(
  overview: SubscriptionOverview,
  me?: AuthMeResponse | null,
): boolean {
  if (isSuperAdminContext(me)) {
    return true;
  }

  return overview.can_use_paid_features;
}

export function hasReconciledPaidSubscription(
  overview: SubscriptionOverview,
): boolean {
  return overview.subscription !== null && overview.can_use_paid_features;
}

function hasActivePlanChange(overview: SubscriptionOverview): boolean {
  return (
    overview.plan_change?.status === "requested" ||
    overview.plan_change?.status === "payment_pending"
  );
}

function hasOpenPlanChange(overview: SubscriptionOverview): boolean {
  return (
    hasActivePlanChange(overview) || overview.plan_change?.status === "scheduled"
  );
}

function requiresCompanyContext(overview: SubscriptionOverview): boolean {
  return overview.subscription?.scope_type === "company";
}

export function hasScheduledEnterpriseDowngrade(
  overview: SubscriptionOverview,
): boolean {
  return (
    overview.plan_change?.status === "scheduled" &&
    overview.plan_change.from_plan === "custom" &&
    overview.plan_change.to_plan === "enterprise"
  );
}

export function canRequestCustomPlan(
  me: AuthMeResponse | null | undefined,
): boolean {
  const context = getActiveContext(me);

  if (context?.type === "personal") {
    return context.role === "standard_user";
  }

  return context?.type === "company" && context.role === "company_admin";
}

export function shouldStopBillingReconciliation(
  overview: SubscriptionOverview,
  me?: AuthMeResponse | null,
): boolean {
  if (isSuperAdminContext(me)) {
    return true;
  }

  if (hasActivePlanChange(overview) || overview.operation_lock !== null) {
    return false;
  }

  return hasReconciledPaidSubscription(overview);
}

export function isBillingReconciliationReady(
  overview: SubscriptionOverview,
  me?: AuthMeResponse | null,
): boolean {
  if (isSuperAdminContext(me)) {
    return true;
  }

  if (hasActivePlanChange(overview) || overview.operation_lock !== null) {
    return false;
  }

  if (!hasReconciledPaidSubscription(overview)) {
    return false;
  }

  if (requiresCompanyContext(overview)) {
    return getActiveContext(me)?.type === "company";
  }

  return true;
}

export function shouldRefetchAuthAfterBilling(
  overview: SubscriptionOverview,
  me?: AuthMeResponse | null,
): boolean {
  if (!hasReconciledPaidSubscription(overview)) {
    return false;
  }

  if (!requiresCompanyContext(overview)) {
    return false;
  }

  return getActiveContext(me)?.type !== "company";
}

export function isBillingOwner(
  overview: SubscriptionOverview,
  me: AuthMeResponse | null | undefined,
): boolean {
  const subscription = overview.subscription;
  const context = getActiveContext(me);

  if (!subscription || !context) {
    return false;
  }

  if (subscription.scope_type === "user") {
    return context.type === "personal";
  }

  return context.type === "company" && context.role === "company_admin";
}

export function selectBillingOwnerCapabilities(
  overview: SubscriptionOverview,
  me: AuthMeResponse | null | undefined,
): BillingOwnerCapabilities {
  const subscription = overview.subscription;
  const context = getActiveContext(me);
  const owner = isBillingOwner(overview, me);
  const isPersonalStandardOwner =
    owner &&
    context?.type === "personal" &&
    context.role === "standard_user" &&
    subscription?.scope_type === "user" &&
    subscription.plan_type === "standard" &&
    overview.can_use_paid_features;
  const requiresPortalBeforeUpgrade = Boolean(
    isPersonalStandardOwner && subscription?.cancel_at_period_end,
  );
  const isCustomCompanyAdmin =
    owner &&
    context?.type === "company" &&
    context.role === "company_admin" &&
    subscription?.scope_type === "company" &&
    subscription.plan_type === "custom";
  const hasChangeableCustomPlan =
    isCustomCompanyAdmin &&
    (subscription?.status === "active" || subscription?.status === "trialing") &&
    !subscription?.cancel_at_period_end;

  return {
    isOwner: owner,
    canOpenPortal: owner,
    canUpgradeToEnterprise: Boolean(
      isPersonalStandardOwner &&
        !subscription?.cancel_at_period_end &&
        overview.plan_change === null,
    ),
    requiresPortalBeforeUpgrade,
    canDowngradeToStandard: false,
    canRequestCustom: canRequestCustomPlan(me),
    canScheduleEnterpriseDowngrade: Boolean(
      hasChangeableCustomPlan &&
        !hasOpenPlanChange(overview) &&
        overview.operation_lock === null,
    ),
    canCancelEnterpriseDowngrade: Boolean(
      isCustomCompanyAdmin && hasScheduledEnterpriseDowngrade(overview),
    ),
  };
}

export function canUsePaidFeature(
  overview: SubscriptionOverview,
  feature: PaidFeatureName,
  me?: AuthMeResponse | null,
): boolean {
  if (!hasPaidAccess(overview, me)) {
    return false;
  }

  if (isSuperAdminContext(me)) {
    return true;
  }

  return overview.subscription?.features[feature] === true;
}

export function canUsePaidSources(
  overview: SubscriptionOverview,
  me?: AuthMeResponse | null,
): boolean {
  return canUsePaidFeature(overview, "paid_sources", me);
}

export function canUseAdvancedAnalytics(
  overview: SubscriptionOverview,
  me?: AuthMeResponse | null,
): boolean {
  return canUsePaidFeature(overview, "advanced_analytics", me);
}

export function selectPaidFeatureAccess(
  overview: SubscriptionOverview,
  me?: AuthMeResponse | null,
): Record<PaidFeatureName, boolean> {
  return {
    report_generation: canUsePaidFeature(overview, "report_generation", me),
    dosage_calculator: canUsePaidFeature(overview, "dosage_calculator", me),
    paid_sources: canUsePaidSources(overview, me),
    ai_presentation: canUsePaidFeature(overview, "ai_presentation", me),
    advanced_analytics: canUseAdvancedAnalytics(overview, me),
    company_seats: canUsePaidFeature(overview, "company_seats", me),
    review_submission_enabled: canUsePaidFeature(
      overview,
      "review_submission_enabled",
      me,
    ),
  };
}

export function selectReportQuotaSource(
  me?: AuthMeResponse | null,
): ReportQuotaSource {
  if (isSuperAdminContext(me)) {
    return "unlimited";
  }

  if (hasPermission(me, "company:quota_read_own")) {
    return "company_allocation";
  }

  return "subscription_overview";
}

export function selectBillingQuotaView(
  overview: SubscriptionOverview,
  me?: AuthMeResponse | null,
): BillingQuotaView {
  if (isSuperAdminContext(me)) {
    return { kind: "unlimited" };
  }

  if (overview.quota === null) {
    return { kind: "unavailable" };
  }

  return { kind: "known", quota: overview.quota };
}
