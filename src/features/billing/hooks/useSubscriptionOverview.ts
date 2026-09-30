"use client";

import { useQuery } from "@tanstack/react-query";

import { useConfirmedUserId, useIsAuthenticated } from "@/features/auth";

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
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const enabled =
    isAuthenticated && Boolean(userId) && (params.enabled ?? true);

  return useQuery({
    queryKey: billingQueryKeys.overview(userId ?? ""),
    queryFn: async ({ signal }) => {
      const overview = await getSubscriptionOverview(signal);
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
