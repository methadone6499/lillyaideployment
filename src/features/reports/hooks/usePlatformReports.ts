"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { useIsAuthenticated } from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import { listPlatformReports } from "../api/platformReportApi";
import { platformReportQueryKeys } from "../api/platformReportQueryKeys";
import type { GenerationStatus } from "../schemas/platformReportSchemas";

const GENERATING_POLL_INTERVAL_MS = 25_000;
const DEFAULT_LIST_LIMIT = 6;

export type UsePlatformReportsParams = {
  limit?: number;
  search?: string;
  generationStatus?: GenerationStatus;
  enabled?: boolean;
};

function isInvalidCursorError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.code === "invalid_cursor"
  );
}

export function usePlatformReports(params: UsePlatformReportsParams = {}) {
  const queryClient = useQueryClient();
  const isAuthenticated = useIsAuthenticated();
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const normalizedSearch = params.search?.trim() || undefined;
  const listParams = {
    limit,
    search: normalizedSearch,
    generationStatus: params.generationStatus,
  };
  const listQueryKey = platformReportQueryKeys.list(listParams);
  const enabled = isAuthenticated && (params.enabled ?? true);

  const query = useInfiniteQuery({
    queryKey: listQueryKey,
    queryFn: ({ pageParam, signal }) =>
      listPlatformReports(
        {
          ...listParams,
          cursor: pageParam,
        },
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchIntervalInBackground: false,
    refetchInterval: (queryState) => {
      if (!enabled) {
        return false;
      }

      const hasGeneratingReports =
        queryState.state.data?.pages.some((page) =>
          page.items.some(
            (report) => report.generation_status === "generating",
          ),
        ) ?? false;

      return hasGeneratingReports ? GENERATING_POLL_INTERVAL_MS : false;
    },
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
