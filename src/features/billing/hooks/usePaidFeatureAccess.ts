"use client";

import { useAuthUser } from "@/features/auth";

import { useSubscriptionOverview } from "./useSubscriptionOverview";
import {
  canUsePaidFeature,
  hasPaidAccess,
  selectBillingQuotaView,
  selectPaidFeatureAccess,
  selectReportQuotaSource,
  type PaidFeatureName,
} from "../utils/selectBillingCapabilities";

export function usePaidFeatureAccess() {
  const { authMe } = useAuthUser();
  const overviewQuery = useSubscriptionOverview();
  const overview = overviewQuery.data;

  return {
    me: authMe,
    overview,
    features: overview ? selectPaidFeatureAccess(overview, authMe) : null,
    hasPaidAccess: overview ? hasPaidAccess(overview, authMe) : false,
    quotaView: overview ? selectBillingQuotaView(overview, authMe) : null,
    quotaSource: selectReportQuotaSource(authMe),
    isPending: overviewQuery.isPending,
    isFetching: overviewQuery.isFetching,
    isError: overviewQuery.isError,
    error: overviewQuery.error,
    refetch: overviewQuery.refetch,
    canUseFeature: (feature: PaidFeatureName) =>
      overview ? canUsePaidFeature(overview, feature, authMe) : false,
  };
}
