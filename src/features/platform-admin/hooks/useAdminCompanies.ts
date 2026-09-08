"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { useConfirmedUserId, useIsAuthenticated } from "@/features/auth";
import type { SubscriptionStatus } from "@/features/enterprise-activation";
import { ApiRequestError } from "@/services/ApiRequestError";

import { listAdminCompanies } from "../api/adminCompanyApi";
import { adminCompanyQueryKeys } from "../api/adminCompanyQueryKeys";

const DEFAULT_LIST_LIMIT = 20;

export type UseAdminCompaniesParams = {
  limit?: number;
  search?: string;
  subscriptionStatus?: SubscriptionStatus;
  enabled?: boolean;
};

function isInvalidCursorError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.code === "invalid_cursor"
  );
}

function shouldRetryAdminCompanyQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (error instanceof ApiRequestError && error.status < 500) {
    return false;
  }

  return failureCount < 1;
}

export function useAdminCompanies(params: UseAdminCompaniesParams = {}) {
  const queryClient = useQueryClient();
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const normalizedSearch = params.search?.trim() || undefined;
  const listParams = {
    limit,
    search: normalizedSearch,
    subscriptionStatus: params.subscriptionStatus,
  };
  const listQueryKey = adminCompanyQueryKeys.list(userId ?? "", listParams);
  const enabled =
    isAuthenticated && Boolean(userId) && (params.enabled ?? true);

  const query = useInfiniteQuery({
    queryKey: listQueryKey,
    queryFn: ({ pageParam, signal }) =>
      listAdminCompanies(
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
    retry: shouldRetryAdminCompanyQuery,
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
