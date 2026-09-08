"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import {
  useConfirmedUserId,
  useIsAuthenticated,
} from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import { listCompanySeats } from "../api/companySeatApi";
import { companySeatQueryKeys } from "../api/companySeatQueryKeys";
import type {
  CompanyRole,
  MembershipStatus,
} from "../schemas/seatManagementSchemas";
import { shouldRetryCompanySeatQuery } from "../utils/shouldRetryCompanySeatQuery";

const DEFAULT_LIST_LIMIT = 20;

export type UseCompanySeatsParams = {
  limit?: number;
  search?: string;
  status?: MembershipStatus;
  role?: CompanyRole;
  enabled?: boolean;
};

function isInvalidCursorError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.code === "invalid_cursor"
  );
}

export function useCompanySeats(params: UseCompanySeatsParams = {}) {
  const queryClient = useQueryClient();
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const normalizedSearch = params.search?.trim() || undefined;
  const listParams = {
    limit,
    search: normalizedSearch,
    status: params.status,
    role: params.role,
  };
  const listQueryKey = companySeatQueryKeys.list(userId ?? "", listParams);
  const enabled =
    isAuthenticated && Boolean(userId) && (params.enabled ?? true);

  const query = useInfiniteQuery({
    queryKey: listQueryKey,
    queryFn: ({ pageParam, signal }) =>
      listCompanySeats(
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
    retry: shouldRetryCompanySeatQuery,
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
