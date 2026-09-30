"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useConfirmedUserId } from "@/features/auth";
import { useSubscriptionReconciliation } from "@/features/billing";

import { invalidateAfterCustomActivation } from "../utils/refreshCustomSubscriptionQueries";

export const CUSTOM_ACTIVATION_TIMEOUT_MS = 60_000;

export type UseCustomActivationParams = {
  enabled: boolean;
};

/**
 * Activation is confirmed only by the server: `/subscriptions/me` must show a
 * paid subscription with no open payment lock and, for a company plan, `/auth/me`
 * must expose the company context. The Stripe redirect alone proves nothing.
 */
export function useCustomActivation({ enabled }: UseCustomActivationParams) {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId();
  const reconciliation = useSubscriptionReconciliation({
    enabled,
    timeoutMs: CUSTOM_ACTIVATION_TIMEOUT_MS,
  });
  const isActivated = enabled && reconciliation.uiState.kind === "reconciled";

  useEffect(() => {
    if (isActivated) {
      void invalidateAfterCustomActivation(queryClient, userId);
    }
  }, [isActivated, queryClient, userId]);

  return {
    uiState: reconciliation.uiState,
    isActivated,
    isFetching: reconciliation.isFetching,
    restart: reconciliation.restart,
  };
}
