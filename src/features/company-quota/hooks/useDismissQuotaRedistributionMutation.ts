"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useConfirmedUserId } from "@/features/auth";

import { dismissQuotaRedistribution } from "../api/companyQuotaApi";
import { companyQuotaQueryKeys } from "../api/companyQuotaQueryKeys";
import { classifyQuotaRedistributionError } from "../utils/classifyQuotaError";

export function useDismissQuotaRedistributionMutation() {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId();

  return useMutation({
    mutationKey: companyQuotaQueryKeys.dismissRedistribution(),
    mutationFn: (quotaPeriodId: string) =>
      dismissQuotaRedistribution(quotaPeriodId),
    retry: false,
    onSuccess: (summary) => {
      if (userId) {
        queryClient.setQueryData(companyQuotaQueryKeys.company(userId), summary);
      }
    },
    onError: async (error) => {
      // A stale or already-resolved period: refetch so a newer prompt is
      // shown rather than hiding it locally.
      if (classifyQuotaRedistributionError(error).refetch && userId) {
        await queryClient.invalidateQueries({
          queryKey: companyQuotaQueryKeys.company(userId),
        });
      }
    },
  });
}
