"use client";

import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { refetchAuthMe, useConfirmedUserId } from "@/features/auth";
import { companyInvitationQueryKeys } from "@/features/company-invitations";
import { companyQuotaQueryKeys } from "@/features/company-quota";

import {
  disableCompanySeat,
  enableCompanySeat,
  removeCompanySeat,
} from "../api/companySeatApi";
import { companySeatQueryKeys } from "../api/companySeatQueryKeys";

export type SeatLifecycleVariables = {
  membershipId: string;
  targetUserId: string;
};

async function afterSeatMutation(
  queryClient: QueryClient,
  userId: string | null,
  targetUserId: string,
): Promise<void> {
  if (userId) {
    await queryClient.invalidateQueries({
      queryKey: companySeatQueryKeys.lists(userId),
    });
    await queryClient.invalidateQueries({
      queryKey: companyInvitationQueryKeys.root,
    });
    await queryClient.invalidateQueries({
      queryKey: companyQuotaQueryKeys.root,
    });
  }

  if (targetUserId !== userId) {
    return;
  }

  try {
    await refetchAuthMe();
  } catch {
    // Disabling or removing the acting user can close the company session.
  }
}

export function useDisableSeatMutation() {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId();

  return useMutation({
    mutationKey: companySeatQueryKeys.disable(),
    mutationFn: ({ membershipId }: SeatLifecycleVariables) =>
      disableCompanySeat(membershipId),
    retry: false,
    onSuccess: async (_seat, variables) => {
      await afterSeatMutation(queryClient, userId, variables.targetUserId);
    },
  });
}

export function useEnableSeatMutation() {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId();

  return useMutation({
    mutationKey: companySeatQueryKeys.enable(),
    mutationFn: ({ membershipId }: SeatLifecycleVariables) =>
      enableCompanySeat(membershipId),
    retry: false,
    onSuccess: async (_seat, variables) => {
      await afterSeatMutation(queryClient, userId, variables.targetUserId);
    },
  });
}

export function useRemoveSeatMutation() {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId();

  return useMutation({
    mutationKey: companySeatQueryKeys.remove(),
    mutationFn: ({ membershipId }: SeatLifecycleVariables) =>
      removeCompanySeat(membershipId),
    retry: false,
    onSuccess: async (_seat, variables) => {
      await afterSeatMutation(queryClient, userId, variables.targetUserId);
    },
  });
}
