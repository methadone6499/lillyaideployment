import { authenticatedAuthRequest } from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";
import { apiRequest } from "@/services/apiRequest";

import {
  companyReportListResponseSchema,
  type CompanyReportListResponse,
  type ListCompanyReportsParams,
} from "../schemas/companyReportSchemas";
import {
  reportSchema,
  type Report,
} from "../schemas/platformReportSchemas";
import { getAdminReport } from "./adminReportApi";
import { getPlatformReport } from "./platformReportApi";

const COMPANY_REPORTS_API_PREFIX = "/api/v1/companies/me/reports";
const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;
const MAX_CURSOR_LENGTH = 1024;
const MAX_CREATOR_USER_ID_LENGTH = 256;

function bearerHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

function buildListUrl(params: ListCompanyReportsParams): string {
  const query = new URLSearchParams();
  const limit = Math.min(
    MAX_LIST_LIMIT,
    Math.max(1, params.limit ?? DEFAULT_LIST_LIMIT),
  );

  query.set("limit", String(limit));

  if (params.cursor) {
    query.set("cursor", params.cursor.slice(0, MAX_CURSOR_LENGTH));
  }

  const search = params.search?.trim();

  if (search) {
    query.set("search", search.slice(0, MAX_SEARCH_LENGTH));
  }

  if (params.generationStatus) {
    query.set("generation_status", params.generationStatus);
  }

  if (params.reviewStatus) {
    query.set("review_status", params.reviewStatus);
  }

  const creatorUserId = params.creatorUserId?.trim();

  if (creatorUserId) {
    query.set(
      "creator_user_id",
      creatorUserId.slice(0, MAX_CREATOR_USER_ID_LENGTH),
    );
  }

  return `${COMPANY_REPORTS_API_PREFIX}?${query.toString()}`;
}

export function listCompanyReports(
  params: ListCompanyReportsParams = {},
  signal?: AbortSignal,
): Promise<CompanyReportListResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(buildListUrl(params), {
        headers: bearerHeaders(accessToken),
        schema: companyReportListResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function getCompanyReport(
  platformReportId: string,
  signal?: AbortSignal,
): Promise<Report> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(
        `${COMPANY_REPORTS_API_PREFIX}/${encodeURIComponent(platformReportId)}`,
        {
          headers: bearerHeaders(accessToken),
          schema: reportSchema,
          signal: requestSignal,
        },
      ),
    signal,
  );
}

export async function getResolvedPlatformReport(
  platformReportId: string,
  options: { companyFallback: boolean; adminFallback: boolean },
  signal?: AbortSignal,
): Promise<Report> {
  try {
    return await getPlatformReport(platformReportId, signal);
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 404) {
      throw error;
    }

    if (options.companyFallback) {
      try {
        return await getCompanyReport(platformReportId, signal);
      } catch (companyError) {
        if (
          options.adminFallback &&
          companyError instanceof ApiRequestError &&
          companyError.status === 404
        ) {
          return getAdminReport(platformReportId, signal);
        }

        throw companyError;
      }
    }

    if (options.adminFallback) {
      return getAdminReport(platformReportId, signal);
    }

    throw error;
  }
}
