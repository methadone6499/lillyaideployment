"use client";

import { useQuery } from "@tanstack/react-query";

import {
  hasPermission,
  useConfirmedUserId,
  useCurrentUserQuery,
  useIsAuthenticated,
} from "@/features/auth";

import {
  getAdminPopularDrugs,
  getAdminReportTotals,
  getAdminTopReportCompanies,
  getAdminTopReportUsers,
} from "../api/adminReportAnalyticsApi";
import { adminReportAnalyticsQueryKeys } from "../api/adminReportAnalyticsQueryKeys";
import { shouldRetryCompanyReportQuery } from "../utils/shouldRetryCompanyReportQuery";

const DEFAULT_LEADERBOARD_LIMIT = 10;
const ANALYTICS_STALE_TIME_MS = 30_000;
const ANALYTICS_GC_TIME_MS = 5 * 60_000;

export type UseAdminReportAnalyticsLeaderboardParams = {
  limit?: number;
  enabled?: boolean;
};

export type UseAdminReportTotalsParams = {
  enabled?: boolean;
};

function useAdminReportAnalyticsQueryEnabled(enabled = true) {
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const { data: authMe } = useCurrentUserQuery();
  const canReadAdminReports = hasPermission(authMe, "admin:reports_read");

  return {
    userId,
    enabled:
      isAuthenticated &&
      Boolean(userId) &&
      canReadAdminReports &&
      enabled,
  };
}

export function useAdminPopularDrugs(
  params: UseAdminReportAnalyticsLeaderboardParams = {},
) {
  const limit = params.limit ?? DEFAULT_LEADERBOARD_LIMIT;
  const { userId, enabled } = useAdminReportAnalyticsQueryEnabled(
    params.enabled,
  );

  return useQuery({
    queryKey: adminReportAnalyticsQueryKeys.popularDrugs(userId ?? "", {
      limit,
    }),
    queryFn: ({ signal }) => getAdminPopularDrugs({ limit }, signal),
    enabled,
    staleTime: ANALYTICS_STALE_TIME_MS,
    gcTime: ANALYTICS_GC_TIME_MS,
    refetchOnWindowFocus: true,
    retry: shouldRetryCompanyReportQuery,
  });
}

export function useAdminTopReportUsers(
  params: UseAdminReportAnalyticsLeaderboardParams = {},
) {
  const limit = params.limit ?? DEFAULT_LEADERBOARD_LIMIT;
  const { userId, enabled } = useAdminReportAnalyticsQueryEnabled(
    params.enabled,
  );

  return useQuery({
    queryKey: adminReportAnalyticsQueryKeys.topUsers(userId ?? "", { limit }),
    queryFn: ({ signal }) => getAdminTopReportUsers({ limit }, signal),
    enabled,
    staleTime: ANALYTICS_STALE_TIME_MS,
    gcTime: ANALYTICS_GC_TIME_MS,
    refetchOnWindowFocus: true,
    retry: shouldRetryCompanyReportQuery,
  });
}

export function useAdminTopReportCompanies(
  params: UseAdminReportAnalyticsLeaderboardParams = {},
) {
  const limit = params.limit ?? DEFAULT_LEADERBOARD_LIMIT;
  const { userId, enabled } = useAdminReportAnalyticsQueryEnabled(
    params.enabled,
  );

  return useQuery({
    queryKey: adminReportAnalyticsQueryKeys.topCompanies(userId ?? "", {
      limit,
    }),
    queryFn: ({ signal }) => getAdminTopReportCompanies({ limit }, signal),
    enabled,
    staleTime: ANALYTICS_STALE_TIME_MS,
    gcTime: ANALYTICS_GC_TIME_MS,
    refetchOnWindowFocus: true,
    retry: shouldRetryCompanyReportQuery,
  });
}

export function useAdminReportTotals(params: UseAdminReportTotalsParams = {}) {
  const { userId, enabled } = useAdminReportAnalyticsQueryEnabled(
    params.enabled,
  );

  return useQuery({
    queryKey: adminReportAnalyticsQueryKeys.totals(userId ?? ""),
    queryFn: ({ signal }) => getAdminReportTotals(signal),
    enabled,
    staleTime: ANALYTICS_STALE_TIME_MS,
    gcTime: ANALYTICS_GC_TIME_MS,
    refetchOnWindowFocus: true,
    retry: shouldRetryCompanyReportQuery,
  });
}
