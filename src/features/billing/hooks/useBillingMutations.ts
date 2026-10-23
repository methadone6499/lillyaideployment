"use client";
import { withTopUpForfeitureConfirmation } from "../utils/withTopUpForfeitureConfirmation";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useConfirmedUserId } from "@/features/auth";

import {
  cancelEnterpriseDowngrade,
  createBillingPortalSession,
  createSubscriptionCheckout,
  scheduleEnterpriseDowngrade,
  upgradeSubscription,
  resumeSubscription,
} from "../api/billingApi";
import { billingQueryKeys } from "../api/billingQueryKeys";
import type {
  CheckoutRequest,
  UpgradeRequest,
  SubscriptionOverview,
} from "../schemas/billingSchemas";
import {
  invalidateBillingOverview,
  recoverBillingMutationFailure,
} from "../utils/refreshBillingQueries";
import {
  getBillingRetryDelay,
  shouldRetryBillingMutation,
} from "../utils/shouldRetryBillingQuery";

export function useResumeSubscriptionMutation() {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId();
  return useMutation({
    mutationKey: billingQueryKeys.resume(), mutationFn: () => resumeSubscription(),
    retry: shouldRetryBillingMutation, retryDelay: getBillingRetryDelay,
    onSuccess: async (subscription) => {
      if (userId) queryClient.setQueryData<SubscriptionOverview>(billingQueryKeys.overview(userId), (old) => old ? { ...old, subscription } : old);
      await invalidateBillingOverview(queryClient, userId);
    },
    onError: (error) => recoverBillingMutationFailure(queryClient, userId, error),
  });
}

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
    mutationFn: (input: UpgradeRequest) => withTopUpForfeitureConfirmation(queryClient, userId,
      (acknowledged) => upgradeSubscription({ ...input, acknowledge_top_up_forfeiture: acknowledged })),
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
