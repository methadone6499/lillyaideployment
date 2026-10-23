"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { useConfirmedUserId, useIsAuthenticated } from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import { getBillingHistory } from "../api/billingHistoryApi";
import { billingQueryKeys } from "../api/billingQueryKeys";

export function useBillingHistory() {
  const queryClient = useQueryClient();
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const queryKey = billingQueryKeys.history(userId ?? "");
  const enabled = isAuthenticated && Boolean(userId);
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      getBillingHistory(pageParam ?? undefined, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled,
    // Keep a pagination snapshot until Refresh. A new mount starts at page one.
    staleTime: Infinity,
    gcTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const retryAt = query.error instanceof ApiRequestError
    ? query.errorUpdatedAt + (query.error.retryAfterSeconds ?? 0) * 1000
    : 0;

  const refresh = async () => {
    if (!enabled || query.isFetching || Date.now() < retryAt) return;
    await queryClient.resetQueries({ queryKey, exact: true });
  };

  const loadMore = async () => {
    if (!enabled || query.isFetching || !query.hasNextPage || Date.now() < retryAt) return;
    const result = await query.fetchNextPage({ cancelRefetch: false });

    if (
      result.error instanceof ApiRequestError &&
      result.error.status === 400 &&
      result.error.code === "invalid_cursor"
    ) {
      // Reset drops all saved pages and cursors and requests page one once.
      await queryClient.resetQueries({ queryKey, exact: true });
    }
  };

  return {
    ...query,
    items: enabled ? query.data?.pages.flatMap((page) => page.items) ?? [] : [],
    retryAt,
    refresh,
    loadMore,
  };
}
