"use client";

import { useQuery } from "@tanstack/react-query";

import {
  useConfirmedUserId,
  useIsAuthenticated,
} from "@/features/auth";

import { getCompanyReport } from "../api/companyReportApi";
import { platformReportQueryKeys } from "../api/platformReportQueryKeys";
import { shouldRetryCompanyReportQuery } from "../utils/shouldRetryCompanyReportQuery";

const GENERATING_POLL_INTERVAL_MS = 25_000;

export function useCompanyReport(platformReportId: string | null | undefined) {
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const enabled =
    isAuthenticated && Boolean(userId) && Boolean(platformReportId);

  return useQuery({
    queryKey: platformReportQueryKeys.companyDetail(
      userId ?? "",
      platformReportId ?? "",
    ),
    queryFn: ({ signal }) => getCompanyReport(platformReportId!, signal),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: shouldRetryCompanyReportQuery,
    refetchIntervalInBackground: false,
    refetchInterval: (query) =>
      enabled && query.state.data?.generation_status === "generating"
        ? GENERATING_POLL_INTERVAL_MS
        : false,
  });
}
