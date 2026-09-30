"use client";

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useConfirmedUserId, useIsAuthenticated } from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import {
  getAdminCustomRequest,
  listAdminCustomRequests,
} from "../api/adminCustomSubscriptionApi";
import {
  customSubscriptionQueryKeys,
  type AdminCustomRequestListQueryParams,
} from "../api/customSubscriptionQueryKeys";
import type { CustomRequestStatus } from "../schemas/customSubscriptionSchemas";
import { shouldRetryCustomSubscriptionQuery } from "../utils/shouldRetryCustomSubscriptionQuery";

const DEFAULT_LIST_LIMIT = 20;

export type UseAdminCustomRequestsParams = {
  statuses: readonly CustomRequestStatus[];
  search?: string;
  limit?: number;
  enabled?: boolean;
};

function isInvalidCursorError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.code === "invalid_cursor"
  );
}

/**
 * Always sends `active=all` with the tab's statuses so `counts_by_status`
 * covers every queue tab from one response.
 */
export function useAdminCustomRequests(params: UseAdminCustomRequestsParams) {
  const queryClient = useQueryClient();
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const listParams: AdminCustomRequestListQueryParams = {
    statuses: params.statuses,
    active: "all",
    search: params.search?.trim() || undefined,
    limit: params.limit ?? DEFAULT_LIST_LIMIT,
  };
  const listQueryKey = customSubscriptionQueryKeys.adminList(
    userId ?? "",
    listParams,
  );
  const enabled =
    isAuthenticated && Boolean(userId) && (params.enabled ?? true);

  const query = useInfiniteQuery({
    queryKey: listQueryKey,
    queryFn: ({ pageParam, signal }) =>
      listAdminCustomRequests(
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
    retry: shouldRetryCustomSubscriptionQuery,
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

export type UseAdminCustomRequestDetailParams = {
  requestId: string;
  enabled?: boolean;
};

export function useAdminCustomRequestDetail(
  params: UseAdminCustomRequestDetailParams,
) {
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const enabled =
    isAuthenticated &&
    Boolean(userId) &&
    Boolean(params.requestId) &&
    (params.enabled ?? true);

  return useQuery({
    queryKey: customSubscriptionQueryKeys.adminDetail(
      userId ?? "",
      params.requestId,
    ),
    queryFn: ({ signal }) => getAdminCustomRequest(params.requestId, signal),
    enabled,
    staleTime: 10_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryCustomSubscriptionQuery,
  });
}
