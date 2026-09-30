"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useConfirmedUserId } from "@/features/auth";

import {
  cancelEnterpriseDowngrade,
  createBillingPortalSession,
  createSubscriptionCheckout,
  scheduleEnterpriseDowngrade,
  upgradeSubscription,
} from "../api/billingApi";
import { billingQueryKeys } from "../api/billingQueryKeys";
import type {
  CheckoutRequest,
  UpgradeRequest,
} from "../schemas/billingSchemas";
import {
  invalidateBillingOverview,
  recoverBillingMutationFailure,
} from "../utils/refreshBillingQueries";
import {
  getBillingRetryDelay,
  shouldRetryBillingMutation,
} from "../utils/shouldRetryBillingQuery";

export function useCreateCheckoutMutation() {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId();

  return useMutation({
    mutationKey: billingQueryKeys.checkout(),
    mutationFn: (input: CheckoutRequest) => createSubscriptionCheckout(input),
    retry: shouldRetryBillingMutation,
    retryDelay: getBillingRetryDelay,
    onSuccess: async () => {
      await invalidateBillingOverview(queryClient, userId);
    },
    onError: async (error) => {
      await recoverBillingMutationFailure(queryClient, userId, error);
    },
  });
}

export function useCreatePortalMutation() {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId();

  return useMutation({
    mutationKey: billingQueryKeys.portal(),
    mutationFn: () => createBillingPortalSession(),
    retry: shouldRetryBillingMutation,
    retryDelay: getBillingRetryDelay,
    onSuccess: async () => {
      await invalidateBillingOverview(queryClient, userId);
    },
    onError: async (error) => {
      await recoverBillingMutationFailure(queryClient, userId, error);
    },
  });
}

export function useUpgradeSubscriptionMutation() {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId();

  return useMutation({
    mutationKey: billingQueryKeys.upgrade(),
    mutationFn: (input: UpgradeRequest) => upgradeSubscription(input),
    retry: shouldRetryBillingMutation,
    retryDelay: getBillingRetryDelay,
    onSuccess: async () => {
      await invalidateBillingOverview(queryClient, userId);
    },
    onError: async (error) => {
      await recoverBillingMutationFailure(queryClient, userId, error);
    },
  });
}

export function useScheduleEnterpriseDowngradeMutation() {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId();

  return useMutation({
    mutationKey: billingQueryKeys.downgrade(),
    mutationFn: () => scheduleEnterpriseDowngrade(),
    retry: shouldRetryBillingMutation,
    retryDelay: getBillingRetryDelay,
    onSuccess: async () => {
      await invalidateBillingOverview(queryClient, userId);
    },
    onError: async (error) => {
      await recoverBillingMutationFailure(queryClient, userId, error);
    },
  });
}

export function useCancelEnterpriseDowngradeMutation() {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId();

  return useMutation({
    mutationKey: billingQueryKeys.cancelDowngrade(),
    mutationFn: () => cancelEnterpriseDowngrade(),
    retry: shouldRetryBillingMutation,
    retryDelay: getBillingRetryDelay,
    onSuccess: async () => {
      await invalidateBillingOverview(queryClient, userId);
    },
    onError: async (error) => {
      await recoverBillingMutationFailure(queryClient, userId, error);
    },
  });
}
