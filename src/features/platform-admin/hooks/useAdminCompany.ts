"use client";

import { useQuery } from "@tanstack/react-query";

import { useConfirmedUserId, useIsAuthenticated } from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import { getAdminCompany } from "../api/adminCompanyApi";
import { adminCompanyQueryKeys } from "../api/adminCompanyQueryKeys";

export function useAdminCompany(companyId: string, enabled = true) {
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();

  return useQuery({
    queryKey: adminCompanyQueryKeys.detail(userId ?? "", companyId),
    queryFn: ({ signal }) => getAdminCompany(companyId, signal),
    enabled: isAuthenticated && Boolean(userId) && Boolean(companyId) && enabled,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiRequestError && error.status < 500) {
        return false;
      }

      return failureCount < 1;
    },
  });
}
