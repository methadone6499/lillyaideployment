import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";

import {
  popularDrugListResponseSchema,
  reportTotalsResponseSchema,
  topReportCompanyListResponseSchema,
  topReportUserListResponseSchema,
  type AdminReportAnalyticsLeaderboardParams,
  type PopularDrugListResponse,
  type ReportTotalsResponse,
  type TopReportCompanyListResponse,
  type TopReportUserListResponse,
} from "../schemas/adminReportAnalyticsSchemas";

const ADMIN_REPORT_ANALYTICS_API_PREFIX = "/api/v1/admin/report-analytics";
const DEFAULT_LEADERBOARD_LIMIT = 10;
const MAX_LEADERBOARD_LIMIT = 50;

function bearerHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

function clampLeaderboardLimit(limit?: number): number {
  return Math.min(
    MAX_LEADERBOARD_LIMIT,
    Math.max(1, limit ?? DEFAULT_LEADERBOARD_LIMIT),
  );
}

function buildLeaderboardUrl(path: string, limit?: number): string {
  const query = new URLSearchParams();
  query.set("limit", String(clampLeaderboardLimit(limit)));

  return `${ADMIN_REPORT_ANALYTICS_API_PREFIX}/${path}?${query.toString()}`;
}

export function getAdminPopularDrugs(
  params: AdminReportAnalyticsLeaderboardParams = {},
  signal?: AbortSignal,
): Promise<PopularDrugListResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(buildLeaderboardUrl("popular-drugs", params.limit), {
        headers: bearerHeaders(accessToken),
        schema: popularDrugListResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function getAdminTopReportUsers(
  params: AdminReportAnalyticsLeaderboardParams = {},
  signal?: AbortSignal,
): Promise<TopReportUserListResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(buildLeaderboardUrl("top-users", params.limit), {
        headers: bearerHeaders(accessToken),
        schema: topReportUserListResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function getAdminTopReportCompanies(
  params: AdminReportAnalyticsLeaderboardParams = {},
  signal?: AbortSignal,
): Promise<TopReportCompanyListResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(buildLeaderboardUrl("top-companies", params.limit), {
        headers: bearerHeaders(accessToken),
        schema: topReportCompanyListResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function getAdminReportTotals(
  signal?: AbortSignal,
): Promise<ReportTotalsResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(`${ADMIN_REPORT_ANALYTICS_API_PREFIX}/totals`, {
        headers: bearerHeaders(accessToken),
        schema: reportTotalsResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}
