"use client";
import { getActiveContext, hasPermission, useAuthUser } from "@/features/auth";
import { useOwnCompanyQuota } from "@/features/company-quota";
import { useSubscriptionOverview } from "./useSubscriptionOverview";
import { useTopUpOverview } from "./useTopUps";
import { isSuperAdminContext } from "../utils/selectBillingCapabilities";
import { selectReportQuotaAvailability } from "../utils/selectReportQuotaAvailability";

export function useReportQuotaAccess() {
  const { authMe } = useAuthUser();
  const context = getActiveContext(authMe);
  const unlimited = isSuperAdminContext(authMe);
  const subscription = useSubscriptionOverview();
  const purchased = useTopUpOverview();
  const usesOwnQuota = context?.type === "company" && hasPermission(authMe, "company:quota_read_own");
  const ownQuota = useOwnCompanyQuota({ enabled: usesOwnQuota });
  const monthlyRemaining = usesOwnQuota ? ownQuota.data?.quota_remaining : subscription.data ? subscription.data.quota?.quota_remaining ?? 0 : undefined;
  const purchasedRemaining = purchased.data?.usable_balance;
  const blocked = subscription.data?.operation_lock?.blocked_actions.includes("report_generation") ?? false;
  const entitlement = hasPermission(authMe, "report:create") && subscription.data?.can_use_paid_features === true &&
    subscription.data.subscription?.features.report_generation === true && !blocked;
  const availability = selectReportQuotaAvailability({ unlimited, entitled: entitlement, blocked, monthlyRemaining, purchasedRemaining,
    pending: subscription.isPending || (usesOwnQuota && ownQuota.isPending) || purchased.isPending });
  const { checking, unavailable, exhausted } = availability;
  return {
    ...availability,
    monthlyRemaining, purchasedRemaining,
    reason: blocked ? "Report generation is paused while a Custom plan payment is in progress." : checking ? "Checking report availability…" :
      unavailable ? "We could not confirm report availability. Refresh balances before generating." :
      exhausted ? "Your monthly and usable additional reports are exhausted." : !entitlement && !unlimited ? "Your current account does not have report-generation access." : null,
    refetch: () => Promise.all([subscription.refetch(), purchased.refetch(), ...(usesOwnQuota ? [ownQuota.refetch()] : [])]),
  };
}
