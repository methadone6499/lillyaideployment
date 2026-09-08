"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import {
  useConfirmedUserId,
  useIsAuthenticated,
  type UserStatus,
} from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import { listAdminUsers } from "../api/adminUserApi";
import { adminUserQueryKeys } from "../api/adminUserQueryKeys";

const DEFAULT_LIST_LIMIT = 20;

export type UseAdminUsersParams = {
  limit?: number;
  search?: string;
  status?: UserStatus;
  enabled?: boolean;
};

function isInvalidCursorError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.code === "invalid_cursor"
  );
}

function shouldRetryAdminUserQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (error instanceof ApiRequestError && error.status < 500) {
    return false;
  }

  return failureCount < 1;
}

export function useAdminUsers(params: UseAdminUsersParams = {}) {
  const queryClient = useQueryClient();
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const normalizedSearch = params.search?.trim() || undefined;
  const listParams = {
    limit,
    search: normalizedSearch,
    status: params.status,
  };
  const listQueryKey = adminUserQueryKeys.list(userId ?? "", listParams);
  const enabled =
    isAuthenticated && Boolean(userId) && (params.enabled ?? true);

  const query = useInfiniteQuery({
    queryKey: listQueryKey,
    queryFn: ({ pageParam, signal }) =>
      listAdminUsers(
        {
          ...listParams,
          cursor: pageParam,
        },
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryAdminUserQuery,
  });

  const fetchNextPage = async () => {
    const result = await query.fetchNextPage();

    if (result.isError && isInvalidCursorError(result.error)) {
      await queryClient.resetQueries({ queryKey: listQueryKey });
    }

    return result;
  };

  return {
    ...query,
    fetchNextPage,
  };
}
