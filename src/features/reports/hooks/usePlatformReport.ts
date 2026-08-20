"use client";

import { useQuery } from "@tanstack/react-query";

import {
  hasPermission,
  useConfirmedUserId,
  useCurrentUserQuery,
  useIsAuthenticated,
} from "@/features/auth";

import { getResolvedPlatformReport } from "../api/companyReportApi";
import { platformReportQueryKeys } from "../api/platformReportQueryKeys";
import { shouldRetryCompanyReportQuery } from "../utils/shouldRetryCompanyReportQuery";

const GENERATING_POLL_INTERVAL_MS = 25_000;

export function usePlatformReport(platformReportId: string | null | undefined) {
  const isAuthenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  const { data: authMe } = useCurrentUserQuery();
  const canReadCompany = hasPermission(authMe, "report:read_company");
  const enabled =
    isAuthenticated &&
    Boolean(userId) &&
    Boolean(platformReportId) &&
    Boolean(authMe);

  return useQuery({
    queryKey: platformReportQueryKeys.resolvedDetail(
      userId ?? "",
      platformReportId ?? "",
      canReadCompany,
    ),
    queryFn: ({ signal }) =>
      getResolvedPlatformReport(
        platformReportId!,
        { companyFallback: canReadCompany },
        signal,
      ),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    retry: shouldRetryCompanyReportQuery,
    refetchIntervalInBackground: false,
    refetchInterval: (query) =>
      enabled && query.state.data?.generation_status === "generating"
        ? GENERATING_POLL_INTERVAL_MS
        : false,
  });
}
