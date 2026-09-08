"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import {
  useConfirmedUserId,
  useIsAuthenticated,
} from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import { listCompanyReports } from "../api/companyReportApi";
import { platformReportQueryKeys } from "../api/platformReportQueryKeys";
import type {
  GenerationStatus,
  ReviewStatus,
} from "../schemas/platformReportSchemas";
import { shouldRetryCompanyReportQuery } from "../utils/shouldRetryCompanyReportQuery";

const GENERATING_POLL_INTERVAL_MS = 25_000;
const DEFAULT_LIST_LIMIT = 20;

export type UseCompanyReportsParams = {
  limit?: number;
  search?: string;
  generationStatus?: GenerationStatus;
  reviewStatus?: ReviewStatus;
  enabled?: boolean;
};

function isInvalidCursorError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.code === "invalid_cursor"
  );
}

export function useCompanyReports(params: UseCompanyReportsParams = {}) {
  const queryClient = useQueryClient();
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const normalizedSearch = params.search?.trim() || undefined;
  const listParams = {
    limit,
    search: normalizedSearch,
    generationStatus: params.generationStatus,
    reviewStatus: params.reviewStatus,
  };
  const listQueryKey = platformReportQueryKeys.companyList(
    userId ?? "",
    listParams,
  );
  const enabled =
    isAuthenticated && Boolean(userId) && (params.enabled ?? true);

  const query = useInfiniteQuery({
    queryKey: listQueryKey,
    queryFn: ({ pageParam, signal }) =>
      listCompanyReports(
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
    retry: shouldRetryCompanyReportQuery,
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
