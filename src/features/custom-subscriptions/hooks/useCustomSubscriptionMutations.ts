"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useConfirmedUserId } from "@/features/auth";

import {
  acceptCustomOffer,
  cancelCustomOfferPayment,
  cancelCustomRequest,
  createCustomRequest,
  declineCustomOffer,
  requestCustomOfferChanges,
  resendCustomOfferEmail,
  resumeCustomOfferPayment,
  updateCustomRequest,
} from "../api/customSubscriptionApi";
import { customSubscriptionQueryKeys } from "../api/customSubscriptionQueryKeys";
import type {
  CreateCustomRequestBody,
  CustomRequest,
  CustomerOfferState,
  DeclineOfferBody,
  RequestChangesBody,
  UpdateCustomRequestBody,
} from "../schemas/customSubscriptionSchemas";
import { classifyCustomSubscriptionError } from "../utils/classifyCustomSubscriptionError";
import {
  invalidateAfterCustomActivation,
  invalidateAfterCustomPaymentChange,
  invalidateCustomOfferState,
} from "../utils/refreshCustomSubscriptionQueries";
import {
  getCustomSubscriptionRetryDelay,
  shouldRetryCustomSubscriptionMutation,
} from "../utils/shouldRetryCustomSubscriptionQuery";

export type UpdateCustomRequestVariables = {
  requestId: string;
  body: UpdateCustomRequestBody;
};

export type CancelCustomRequestVariables = {
  requestId: string;
  expectedRevision: number;
};

export type OfferActionVariables = {
  offerId: string;
};

export type RequestOfferChangesVariables = OfferActionVariables & {
  body: RequestChangesBody;
};

export type DeclineCustomOfferVariables = OfferActionVariables & {
  body: DeclineOfferBody;
};

function useOfferStateCache() {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId();

  const setRequest = (request: CustomRequest) => {
    if (!userId) {
      return;
    }

    queryClient.setQueryData<CustomerOfferState | null>(
      customSubscriptionQueryKeys.offerState(userId),
      (current) =>
        request.active
          ? {
              request,
              offer: current?.request.id === request.id ? current.offer : null,
              communications:
                current?.request.id === request.id ? current.communications : [],
            }
          : null,
    );
  };

  const recoverFromError = async (error: unknown) => {
    const classified = classifyCustomSubscriptionError(error);

    if (classified.refetch || classified.action === "poll_activation") {
      await invalidateAfterCustomPaymentChange(queryClient, userId);
    }
  };

  return { queryClient, userId, setRequest, recoverFromError };
}

export function useCreateCustomRequestMutation() {
  const { queryClient, userId, setRequest, recoverFromError } =
    useOfferStateCache();

  return useMutation({
    mutationKey: customSubscriptionQueryKeys.createRequest(),
    mutationFn: (body: CreateCustomRequestBody) => createCustomRequest(body),
    retry: false,
    onSuccess: async (request) => {
      setRequest(request);
      await invalidateCustomOfferState(queryClient, userId);
    },
    onError: recoverFromError,
  });
}

export function useUpdateCustomRequestMutation() {
  const { queryClient, userId, setRequest, recoverFromError } =
    useOfferStateCache();

  return useMutation({
    mutationKey: customSubscriptionQueryKeys.updateRequest(),
    mutationFn: ({ requestId, body }: UpdateCustomRequestVariables) =>
      updateCustomRequest(requestId, body),
    retry: false,
    onSuccess: async (request) => {
      setRequest(request);
      await invalidateCustomOfferState(queryClient, userId);
    },
    onError: recoverFromError,
  });
}

export function useCancelCustomRequestMutation() {
  const { queryClient, userId, setRequest, recoverFromError } =
    useOfferStateCache();

  return useMutation({
    mutationKey: customSubscriptionQueryKeys.cancelRequest(),
    mutationFn: ({ requestId, expectedRevision }: CancelCustomRequestVariables) =>
      cancelCustomRequest(requestId, expectedRevision),
    retry: false,
    onSuccess: async (request) => {
      setRequest(request);
      await invalidateCustomOfferState(queryClient, userId);
    },
    onError: recoverFromError,
  });
}

export function useAcceptCustomOfferMutation() {
  const { queryClient, userId, recoverFromError } = useOfferStateCache();

  return useMutation({
    mutationKey: customSubscriptionQueryKeys.acceptOffer(),
    mutationFn: ({ offerId }: OfferActionVariables) => acceptCustomOffer(offerId),
    retry: shouldRetryCustomSubscriptionMutation,
    retryDelay: getCustomSubscriptionRetryDelay,
    onSuccess: async (result) => {
      if (result.request_status === "activated") {
        await invalidateAfterCustomActivation(queryClient, userId);
        return;
      }

      await invalidateAfterCustomPaymentChange(queryClient, userId);
    },
    onError: recoverFromError,
  });
}

export function useResumeCustomPaymentMutation() {
  const { queryClient, userId, recoverFromError } = useOfferStateCache();

  return useMutation({
    mutationKey: customSubscriptionQueryKeys.resumePayment(),
    mutationFn: ({ offerId }: OfferActionVariables) =>
      resumeCustomOfferPayment(offerId),
    retry: shouldRetryCustomSubscriptionMutation,
    retryDelay: getCustomSubscriptionRetryDelay,
    onSuccess: async () => {
      await invalidateAfterCustomPaymentChange(queryClient, userId);
    },
    onError: recoverFromError,
  });
}

export function useCancelCustomPaymentMutation() {
  const { queryClient, userId, recoverFromError } = useOfferStateCache();

  return useMutation({
    mutationKey: customSubscriptionQueryKeys.cancelPayment(),
    mutationFn: ({ offerId }: OfferActionVariables) =>
      cancelCustomOfferPayment(offerId),
    retry: shouldRetryCustomSubscriptionMutation,
    retryDelay: getCustomSubscriptionRetryDelay,
    onSuccess: async () => {
      await invalidateAfterCustomPaymentChange(queryClient, userId);
    },
    onError: recoverFromError,
  });
}

export function useRequestOfferChangesMutation() {
  const { queryClient, userId, setRequest, recoverFromError } =
    useOfferStateCache();

  return useMutation({
    mutationKey: customSubscriptionQueryKeys.requestChanges(),
    mutationFn: ({ offerId, body }: RequestOfferChangesVariables) =>
      requestCustomOfferChanges(offerId, body),
    retry: false,
    onSuccess: async (request) => {
      setRequest(request);
      await invalidateCustomOfferState(queryClient, userId);
    },
    onError: recoverFromError,
  });
}

export function useDeclineCustomOfferMutation() {
  const { queryClient, userId, setRequest, recoverFromError } =
    useOfferStateCache();

  return useMutation({
    mutationKey: customSubscriptionQueryKeys.declineOffer(),
    mutationFn: ({ offerId, body }: DeclineCustomOfferVariables) =>
      declineCustomOffer(offerId, body),
    retry: false,
    onSuccess: async (request) => {
      setRequest(request);
      await invalidateCustomOfferState(queryClient, userId);
    },
    onError: recoverFromError,
  });
}

export function useResendCustomOfferEmailMutation() {
  const { recoverFromError } = useOfferStateCache();

  return useMutation({
    mutationKey: customSubscriptionQueryKeys.resendOfferEmail(),
    mutationFn: ({ offerId }: OfferActionVariables) =>
      resendCustomOfferEmail(offerId),
    retry: false,
    onError: recoverFromError,
  });
}
