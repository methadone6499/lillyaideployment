"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  refetchAuthMe,
  useConfirmedUserId,
  useCurrentUserQuery,
  useIsAuthenticated,
} from "@/features/auth";

import { billingQueryKeys } from "../api/billingQueryKeys";
import type { SubscriptionOverview } from "../schemas/billingSchemas";
import {
  BILLING_QUERY_GC_TIME_MS,
  BILLING_RECONCILIATION_TIMEOUT_MS,
} from "../utils/billingConstants";
import {
  getEnterpriseAuthReconciliationInterval,
  getSubscriptionReconciliationOverviewInterval,
  selectBillingReconciliationError,
  selectBillingReconciliationUiState,
  shouldEnableEnterpriseAuthReconciliation,
} from "../utils/selectBillingReconciliation";
import {
  getBillingRetryDelay,
  shouldRetryBillingQuery,
} from "../utils/shouldRetryBillingQuery";
import { useSubscriptionOverview } from "./useSubscriptionOverview";

export type UseSubscriptionReconciliationParams = {
  enabled?: boolean;
  timeoutMs?: number;
};

export function useSubscriptionReconciliation(
  params: UseSubscriptionReconciliationParams = {},
) {
  const enabled = params.enabled ?? true;
  const timeoutMs = params.timeoutMs ?? BILLING_RECONCILIATION_TIMEOUT_MS;
  const [generation, setGeneration] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const queryClient = useQueryClient();
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const { data: me } = useCurrentUserQuery();

  const overviewQuery = useSubscriptionOverview({
    enabled,
    staleTime: 0,
    gcTime: BILLING_QUERY_GC_TIME_MS,
    refetchOnWindowFocus: "always",
    refetchInterval: (query) =>
      getSubscriptionReconciliationOverviewInterval({
        enabled,
        timedOut,
        overview: query.state.data,
        error: query.state.error,
        me,
      }),
  });

  const authReconciliationEnabled =
    isAuthenticated &&
    Boolean(userId) &&
    shouldEnableEnterpriseAuthReconciliation({
      enabled,
      timedOut,
      overview: overviewQuery.data,
      me,
    });

  const authReconciliationQuery = useQuery({
    queryKey: billingQueryKeys.authReconciliation(userId ?? "", generation),
    queryFn: ({ signal }) => refetchAuthMe(signal),
    enabled: authReconciliationEnabled,
    staleTime: 0,
    gcTime: BILLING_QUERY_GC_TIME_MS,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
    refetchIntervalInBackground: false,
    retry: shouldRetryBillingQuery,
    retryDelay: getBillingRetryDelay,
    refetchInterval: (query) =>
      getEnterpriseAuthReconciliationInterval({
        timedOut,
        me: query.state.data ?? me,
        error: query.state.error,
      }),
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTimedOut(true);
    }, timeoutMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [enabled, generation, timeoutMs]);

  const restart = () => {
    if (userId) {
      void queryClient.cancelQueries({
        queryKey: billingQueryKeys.authReconciliation(userId, generation),
      });
    }

    setTimedOut(false);
    setGeneration((current) => current + 1);
    void overviewQuery.refetch();
  };

  const uiState = selectBillingReconciliationUiState({
    overview: overviewQuery.data,
    error: selectBillingReconciliationError({
      overviewError: overviewQuery.error,
      authError: authReconciliationQuery.error,
    }),
    timedOut: enabled && timedOut,
    me,
  });

  return {
    ...overviewQuery,
    timedOut: enabled && timedOut,
    uiState,
    restart,
  };
}

export type SubscriptionReconciliationResult = ReturnType<
  typeof useSubscriptionReconciliation
> & {
  data: SubscriptionOverview | undefined;
};
