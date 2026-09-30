"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getActiveContext,
  useAuthUser,
  useConfirmedUserId,
  useIsAuthenticated,
} from "@/features/auth";

import { getCurrentCustomOfferState } from "../api/customSubscriptionApi";
import { customSubscriptionQueryKeys } from "../api/customSubscriptionQueryKeys";
import { getCustomOfferStatePollInterval } from "../utils/selectCustomRequestView";
import { shouldRetryCustomSubscriptionQuery } from "../utils/shouldRetryCustomSubscriptionQuery";

const OFFER_STATE_STALE_TIME_MS = 5_000;
const OFFER_STATE_GC_TIME_MS = 5 * 60_000;

export type UseCustomOfferStateParams = {
  enabled?: boolean;
  /** Epoch ms until which a payment/return flow polls every few seconds. */
  fastPollUntil?: number | null;
};

export function useCustomOfferState(params: UseCustomOfferStateParams = {}) {
  const { authMe } = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const contextType = getActiveContext(authMe)?.type;
  const isCustomerContext = contextType === "personal" || contextType === "company";
  const fastPollUntil = params.fastPollUntil ?? null;
  const enabled =
    isAuthenticated &&
    Boolean(userId) &&
    isCustomerContext &&
    (params.enabled ?? true);

  const query = useQuery({
    queryKey: customSubscriptionQueryKeys.offerState(userId ?? ""),
    queryFn: ({ signal }) => getCurrentCustomOfferState(signal),
    enabled,
    staleTime: OFFER_STATE_STALE_TIME_MS,
    gcTime: OFFER_STATE_GC_TIME_MS,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
    refetchIntervalInBackground: false,
    retry: shouldRetryCustomSubscriptionQuery,
    refetchInterval: (current) =>
      getCustomOfferStatePollInterval({
        state: current.state.data,
        fastPollUntil,
        nowMs: Date.now(),
      }),
  });

  return {
    ...query,
    authMe,
    isContextKnown: Boolean(authMe),
    isCustomerContext,
  };
}
