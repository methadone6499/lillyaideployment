import {
  getActiveContext,
  hasPermission,
  type AuthMeResponse,
} from "@/features/auth";
import type { CompanyQuotaSummary } from "@/features/company-quota";
import type { SubscriptionOverview } from "../schemas/billingSchemas";
import {
  isSuperAdminContext,
  selectBillingQuotaView,
  type BillingQuotaView,
} from "./selectBillingCapabilities";

export type BillingPageQuotaView =
  | BillingQuotaView
  | { kind: "loading" }
  | { kind: "error"; message: string };

export function canReadCompanyBillingQuota(
  overview: SubscriptionOverview | undefined,
  me: AuthMeResponse | null | undefined,
): boolean {
  const context = getActiveContext(me);
  return (
    !isSuperAdminContext(me) &&
    overview?.subscription?.scope_type === "company" &&
    context?.type === "company" &&
    Boolean(context.company_id) &&
    hasPermission(me, "company:quota_read")
  );
}

export function selectBillingPageQuotaView(
  overview: SubscriptionOverview,
  me: AuthMeResponse | null | undefined,
  company: {
    data?: CompanyQuotaSummary;
    isPending: boolean;
    errorMessage: string | null;
  },
): BillingPageQuotaView {
  if (isSuperAdminContext(me) || overview.subscription?.scope_type !== "company") {
    return selectBillingQuotaView(overview, me);
  }

  if (!canReadCompanyBillingQuota(overview, me)) {
    return { kind: "unavailable" };
  }

  if (company.errorMessage) {
    return { kind: "error", message: company.errorMessage };
  }

  if (company.isPending && !company.data) {
    return { kind: "loading" };
  }

  const quota = company.data;
  const subscription = overview.subscription;
  if (
    !quota || !subscription ||
    quota.company_id !== getActiveContext(me)?.company_id ||
    quota.subscription_id !== subscription.id ||
    Date.parse(quota.period_start) !== Date.parse(subscription.current_period_start) ||
    Date.parse(quota.period_end) !== Date.parse(subscription.current_period_end)
  ) {
    return { kind: "unavailable" };
  }

  return {
    kind: "known",
    quota: {
      quota_total: quota.quota_total,
      quota_used: quota.quota_used,
      quota_remaining: quota.quota_remaining,
      period_start: quota.period_start,
      period_end: quota.period_end,
    },
  };
}
