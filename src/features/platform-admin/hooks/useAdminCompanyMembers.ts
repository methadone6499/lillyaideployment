"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import {
  useConfirmedUserId,
  useIsAuthenticated,
  type UserStatus,
} from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import { listAdminCompanyMembers } from "../api/adminCompanyApi";
import { adminCompanyQueryKeys } from "../api/adminCompanyQueryKeys";
import type { AdminCompanyMemberRole } from "../schemas/adminCompanyMemberSchemas";
import type { MembershipStatus } from "../schemas/adminUserSchemas";

export type UseAdminCompanyMembersParams = {
  limit?: number;
  search?: string;
  status?: MembershipStatus;
  role?: AdminCompanyMemberRole;
  userStatus?: UserStatus;
  enabled?: boolean;
};

const DEFAULT_LIST_LIMIT = 20;

function isInvalidCursorError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.code === "invalid_cursor"
  );
}

export function useAdminCompanyMembers(
  companyId: string,
  params: UseAdminCompanyMembersParams = {},
) {
  const queryClient = useQueryClient();
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const listParams = {
    limit: params.limit ?? DEFAULT_LIST_LIMIT,
    search: params.search?.trim() || undefined,
    status: params.status,
    role: params.role,
    userStatus: params.userStatus,
  };
  const queryKey = adminCompanyQueryKeys.members(
    userId ?? "",
    companyId,
    listParams,
  );
  const enabled =
    isAuthenticated &&
    Boolean(userId) &&
    Boolean(companyId) &&
    (params.enabled ?? true);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      listAdminCompanyMembers(
        companyId,
        { ...listParams, cursor: pageParam },
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error instanceof ApiRequestError && error.status < 500) {
        return false;
      }

      return failureCount < 1;
    },
  });

  const fetchNextPage = async () => {
    const result = await query.fetchNextPage();

    if (result.isError && isInvalidCursorError(result.error)) {
      await queryClient.resetQueries({ queryKey });
    }

    return result;
  };

  return { ...query, fetchNextPage };
}
