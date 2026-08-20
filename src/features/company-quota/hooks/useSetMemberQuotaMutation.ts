"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setMemberQuota } from "../api/companyQuotaApi";
import { companyQuotaQueryKeys } from "../api/companyQuotaQueryKeys";

/**
 * Must match `companySeatQueryKeys.root` in seat-management.
 * Quota mutations cannot import that feature (seat UI imports this one).
 */
const COMPANY_SEATS_QUERY_ROOT = ["company-seats"] as const;

export type SetMemberQuotaVariables = {
  membershipId: string;
  quotaTotal: number;
};

export function useSetMemberQuotaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: companyQuotaQueryKeys.setMemberQuota(),
    mutationFn: ({ membershipId, quotaTotal }: SetMemberQuotaVariables) =>
      setMemberQuota(membershipId, quotaTotal),
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: companyQuotaQueryKeys.root,
        }),
        queryClient.invalidateQueries({
          queryKey: COMPANY_SEATS_QUERY_ROOT,
        }),
      ]);
    },
  });
}
