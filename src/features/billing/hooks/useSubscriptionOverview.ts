"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getActiveContext, useAuthUser, useConfirmedUserId, useIsAuthenticated } from "@/features/auth";
import { companyQuotaQueryKeys } from "@/features/company-quota";
import type { SubscriptionOverview } from "../schemas/billingSchemas";

import { getSubscriptionOverview } from "../api/billingApi";
import { billingQueryKeys } from "../api/billingQueryKeys";
import {
  BILLING_QUERY_GC_TIME_MS,
  BILLING_QUERY_STALE_TIME_MS,
} from "../utils/billingConstants";
import { syncPlanIntentWithOverview } from "../utils/planIntent";
import {
  resolveSubscriptionOverviewRefetchInterval,
  SUBSCRIPTION_OVERVIEW_REFETCH_INTERVAL_IN_BACKGROUND,
  type SubscriptionOverviewRefetchInterval,
} from "../utils/selectBillingOverviewUi";
import {
  getBillingRetryDelay,
  shouldRetryBillingQuery,
} from "../utils/shouldRetryBillingQuery";

export type UseSubscriptionOverviewParams = {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean | "always";
  refetchInterval?: SubscriptionOverviewRefetchInterval;
};

export function useSubscriptionOverview(
  params: UseSubscriptionOverviewParams = {},
) {
  const queryClient = useQueryClient();
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const { authMe } = useAuthUser();
  const context = getActiveContext(authMe);
  const overviewKey = [...billingQueryKeys.overview(userId ?? ""), context?.type ?? null, context?.company_id ?? null, context?.membership_id ?? null];
  const enabled =
    isAuthenticated && Boolean(userId) && (params.enabled ?? true);

  return useQuery({
    queryKey: overviewKey,
    queryFn: async ({ signal }) => {
      const overview = await getSubscriptionOverview(signal);
      const previous = queryClient.getQueryData<SubscriptionOverview>(
        overviewKey,
      );
      if (previous && userId && (
        previous.subscription?.id !== overview.subscription?.id
        || previous.subscription?.plan_type !== overview.subscription?.plan_type
        || previous.subscription?.limits.reports !== overview.subscription?.limits.reports
        || previous.subscription?.current_period_start !== overview.subscription?.current_period_start
        || previous.subscription?.current_period_end !== overview.subscription?.current_period_end
        || previous.can_use_paid_features !== overview.can_use_paid_features
        || previous.plan_change?.status !== overview.plan_change?.status
      )) {
        void queryClient.invalidateQueries({ queryKey: companyQuotaQueryKeys.company(userId) });
        void queryClient.invalidateQueries({ queryKey: companyQuotaQueryKeys.own(userId) });
      }
      syncPlanIntentWithOverview(overview);
      return overview;
    },
    enabled,
    staleTime: params.staleTime ?? BILLING_QUERY_STALE_TIME_MS,
    gcTime: params.gcTime ?? BILLING_QUERY_GC_TIME_MS,
    refetchOnWindowFocus: params.refetchOnWindowFocus ?? true,
    refetchOnReconnect: true,
    retry: shouldRetryBillingQuery,
    retryDelay: getBillingRetryDelay,
    refetchIntervalInBackground:
      SUBSCRIPTION_OVERVIEW_REFETCH_INTERVAL_IN_BACKGROUND,
    refetchInterval: (query) =>
      resolveSubscriptionOverviewRefetchInterval(params.refetchInterval, query),
  });
}
