"use client";

import { useQuery } from "@tanstack/react-query";

import { useIsAuthenticated } from "@/features/auth";

import { getPlatformReport } from "../api/platformReportApi";
import { platformReportQueryKeys } from "../api/platformReportQueryKeys";

const GENERATING_POLL_INTERVAL_MS = 25_000;

export function usePlatformReport(platformReportId: string | null | undefined) {
  const isAuthenticated = useIsAuthenticated();
  const enabled = isAuthenticated && Boolean(platformReportId);

  return useQuery({
    queryKey: platformReportQueryKeys.detail(platformReportId ?? ""),
    queryFn: ({ signal }) => getPlatformReport(platformReportId!, signal),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchIntervalInBackground: false,
    refetchInterval: (query) =>
      enabled && query.state.data?.generation_status === "generating"
        ? GENERATING_POLL_INTERVAL_MS
        : false,
  });
}
