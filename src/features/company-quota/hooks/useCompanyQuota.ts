"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getActiveContext,
  hasPermission,
  useAuthUser,
  useConfirmedUserId,
  useIsAuthenticated,
} from "@/features/auth";

import { getCompanyQuota } from "../api/companyQuotaApi";
import { companyQuotaQueryKeys } from "../api/companyQuotaQueryKeys";
import { shouldRetryCompanyQuotaQuery } from "../utils/shouldRetryCompanyQuotaQuery";

export type UseCompanyQuotaParams = {
  enabled?: boolean;
  refetchOnMount?: boolean | "always";
};

export function useCompanyQuota(params: UseCompanyQuotaParams = {}) {
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const { authMe } = useAuthUser();
  const context = getActiveContext(authMe);
  const companyId = context?.type === "company" ? context.company_id : null;
  const enabled =
    isAuthenticated && Boolean(userId) && Boolean(companyId) &&
    hasPermission(authMe, "company:quota_read") && (params.enabled ?? true);

  return useQuery({
    queryKey: companyQuotaQueryKeys.company(userId ?? "", companyId),
    queryFn: ({ signal }) => getCompanyQuota(signal),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnMount: params.refetchOnMount ?? true,
    retry: shouldRetryCompanyQuotaQuery,
  });
}
