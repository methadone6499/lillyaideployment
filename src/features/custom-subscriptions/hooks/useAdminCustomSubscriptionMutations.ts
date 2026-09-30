"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useConfirmedUserId } from "@/features/auth";

import {
  addAdminCustomRequestNote,
  cancelAdminCustomOffer,
  closeAdminCustomRequest,
  createAdminCustomOfferDraft,
  markAdminCustomRequestActionRequired,
  publishAdminCustomOffer,
  resendAdminCustomOfferEmail,
  resendAdminCustomRequestCloseEmail,
  startAdminCustomRequestReview,
  updateAdminCustomOfferDraft,
} from "../api/adminCustomSubscriptionApi";
import { customSubscriptionQueryKeys } from "../api/customSubscriptionQueryKeys";
import type {
  ActionRequiredBody,
  CloseRequestBody,
  CreateOfferDraftBody,
  EmailDelivery,
  OfferTerms,
} from "../schemas/customSubscriptionSchemas";
import { invalidateAdminCustomRequest } from "../utils/refreshCustomSubscriptionQueries";

export type RevisionedOfferVariables = {
  offerId: string;
  expectedRevision: number;
};

export type UpdateOfferDraftVariables = {
  offerId: string;
  terms: OfferTerms;
};

/**
 * Every admin write is revision-checked by the backend. Refetch the detail and
 * the queue whether the write succeeded or conflicted, so the next attempt uses
 * the latest request revision.
 */
function useAdminCustomRequestMutation<TVariables, TResult>(
  requestId: string,
  action: string,
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId();

  return useMutation({
    mutationKey: customSubscriptionQueryKeys.adminMutation(action),
    mutationFn,
    retry: false,
    onSettled: async () => {
      await invalidateAdminCustomRequest(queryClient, userId, requestId);
    },
  });
}

export function useStartAdminReviewMutation(requestId: string) {
  return useAdminCustomRequestMutation(
    requestId,
    "review",
    (expectedRevision: number) =>
      startAdminCustomRequestReview(requestId, expectedRevision),
  );
}

export function useMarkActionRequiredMutation(requestId: string) {
  return useAdminCustomRequestMutation(
    requestId,
    "action-required",
    (body: ActionRequiredBody) =>
      markAdminCustomRequestActionRequired(requestId, body),
  );
}

export function useCloseAdminCustomRequestMutation(requestId: string) {
  return useAdminCustomRequestMutation(
    requestId,
    "close",
    (body: CloseRequestBody) => closeAdminCustomRequest(requestId, body),
  );
}

export function useResendAdminCloseEmailMutation(requestId: string) {
  return useAdminCustomRequestMutation<void, EmailDelivery>(
    requestId,
    "resend-close-email",
    () => resendAdminCustomRequestCloseEmail(requestId),
  );
}

export function useAddAdminNoteMutation(requestId: string) {
  return useAdminCustomRequestMutation(
    requestId,
    "notes",
    (message: string) => addAdminCustomRequestNote(requestId, { message }),
  );
}

export function useCreateOfferDraftMutation(requestId: string) {
  return useAdminCustomRequestMutation(
    requestId,
    "create-offer",
    (body: CreateOfferDraftBody) =>
      createAdminCustomOfferDraft(requestId, body),
  );
}

export function useUpdateOfferDraftMutation(requestId: string) {
  return useAdminCustomRequestMutation(
    requestId,
    "update-offer",
    ({ offerId, terms }: UpdateOfferDraftVariables) =>
      updateAdminCustomOfferDraft(offerId, terms),
  );
}

export function usePublishOfferMutation(requestId: string) {
  return useAdminCustomRequestMutation(
    requestId,
    "publish-offer",
    ({ offerId, expectedRevision }: RevisionedOfferVariables) =>
      publishAdminCustomOffer(offerId, expectedRevision),
  );
}

export function useCancelOfferMutation(requestId: string) {
  return useAdminCustomRequestMutation(
    requestId,
    "cancel-offer",
    ({ offerId, expectedRevision }: RevisionedOfferVariables) =>
      cancelAdminCustomOffer(offerId, expectedRevision),
  );
}

export function useResendAdminOfferEmailMutation(requestId: string) {
  return useAdminCustomRequestMutation(
    requestId,
    "resend-offer-email",
    (offerId: string) => resendAdminCustomOfferEmail(offerId),
  );
}
