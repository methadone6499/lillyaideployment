"use client";

import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import {
  createInvitation,
  resendInvitation,
  revokeInvitation,
} from "../api/companyInvitationApi";
import { companyInvitationQueryKeys } from "../api/companyInvitationQueryKeys";

/**
 * Must match `companySeatQueryKeys.root` in seat-management.
 * Invitation mutations cannot import that feature (seat UI imports this one).
 */
const COMPANY_SEATS_QUERY_ROOT = ["company-seats"] as const;

export type CreateInvitationVariables = {
  email: string;
};

export type InvitationIdVariables = {
  invitationId: string;
};

async function afterInvitationMutation(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: companyInvitationQueryKeys.root,
    }),
    queryClient.invalidateQueries({
      queryKey: COMPANY_SEATS_QUERY_ROOT,
    }),
  ]);
}

export function useCreateInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: companyInvitationQueryKeys.create(),
    mutationFn: ({ email }: CreateInvitationVariables) =>
      createInvitation(email),
    retry: false,
    onSuccess: async () => {
      await afterInvitationMutation(queryClient);
    },
  });
}

export function useResendInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: companyInvitationQueryKeys.resend(),
    mutationFn: ({ invitationId }: InvitationIdVariables) =>
      resendInvitation(invitationId),
    retry: false,
    onSuccess: async () => {
      await afterInvitationMutation(queryClient);
    },
  });
}

export function useRevokeInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: companyInvitationQueryKeys.revoke(),
    mutationFn: ({ invitationId }: InvitationIdVariables) =>
      revokeInvitation(invitationId),
    retry: false,
    onSuccess: async () => {
      await afterInvitationMutation(queryClient);
    },
  });
}
