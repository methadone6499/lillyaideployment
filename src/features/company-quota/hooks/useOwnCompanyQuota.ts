"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getActiveContext,
  hasPermission,
  useAuthUser,
  useConfirmedUserId,
  useIsAuthenticated,
} from "@/features/auth";

import { getOwnCompanyQuota } from "../api/companyQuotaApi";
import { companyQuotaQueryKeys } from "../api/companyQuotaQueryKeys";
import { shouldRetryCompanyQuotaQuery } from "../utils/shouldRetryCompanyQuotaQuery";

export type UseOwnCompanyQuotaParams = {
  enabled?: boolean;
};

export function useOwnCompanyQuota(params: UseOwnCompanyQuotaParams = {}) {
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const { authMe } = useAuthUser();
  const context = getActiveContext(authMe);
  const companyId = context?.type === "company" ? context.company_id : null;
  const enabled =
    isAuthenticated && Boolean(userId) && Boolean(companyId) &&
    hasPermission(authMe, "company:quota_read_own") && (params.enabled ?? true);

  return useQuery({
    queryKey: companyQuotaQueryKeys.own(userId ?? "", companyId, context?.membership_id),
    queryFn: ({ signal }) => getOwnCompanyQuota(signal),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryCompanyQuotaQuery,
  });
}
