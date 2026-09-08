"use client";

import { useQuery } from "@tanstack/react-query";

import { useConfirmedUserId, useIsAuthenticated } from "@/features/auth";

import { getOwnCompanyQuota } from "../api/companyQuotaApi";
import { companyQuotaQueryKeys } from "../api/companyQuotaQueryKeys";
import { shouldRetryCompanyQuotaQuery } from "../utils/shouldRetryCompanyQuotaQuery";

export type UseOwnCompanyQuotaParams = {
  enabled?: boolean;
};

export function useOwnCompanyQuota(params: UseOwnCompanyQuotaParams = {}) {
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const enabled =
    isAuthenticated && Boolean(userId) && (params.enabled ?? true);

  return useQuery({
    queryKey: companyQuotaQueryKeys.own(userId ?? ""),
    queryFn: ({ signal }) => getOwnCompanyQuota(signal),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryCompanyQuotaQuery,
  });
}
