"use client";

import { useQuery } from "@tanstack/react-query";

import { useConfirmedUserId, useIsAuthenticated } from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import { getAdminUser } from "../api/adminUserApi";
import { adminUserQueryKeys } from "../api/adminUserQueryKeys";

export function useAdminUser(targetUserId: string, enabled = true) {
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();

  return useQuery({
    queryKey: adminUserQueryKeys.detail(userId ?? "", targetUserId),
    queryFn: ({ signal }) => getAdminUser(targetUserId, signal),
    enabled:
      isAuthenticated && Boolean(userId) && Boolean(targetUserId) && enabled,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiRequestError && error.status < 500) {
        return false;
      }

      return failureCount < 1;
    },
  });
}
