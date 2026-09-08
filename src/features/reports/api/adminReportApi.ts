import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";

import {
  adminReportListResponseSchema,
  type AdminReportListResponse,
  type ListAdminReportsParams,
} from "../schemas/adminReportSchemas";
import {
  reportSchema,
  type Report,
} from "../schemas/platformReportSchemas";

const ADMIN_REPORTS_API_PREFIX = "/api/v1/admin/reports";
const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;
const MAX_CURSOR_LENGTH = 1024;
const MAX_FILTER_ID_LENGTH = 256;

function bearerHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

function setOptionalTrimmedParam(
  query: URLSearchParams,
  key: string,
  value: string | undefined,
  maxLength: number,
) {
  const trimmed = value?.trim();

  if (trimmed) {
    query.set(key, trimmed.slice(0, maxLength));
  }
}

function buildListUrl(params: ListAdminReportsParams): string {
  const query = new URLSearchParams();
  const limit = Math.min(
    MAX_LIST_LIMIT,
    Math.max(1, params.limit ?? DEFAULT_LIST_LIMIT),
  );

  query.set("limit", String(limit));

  if (params.cursor) {
    query.set("cursor", params.cursor.slice(0, MAX_CURSOR_LENGTH));
  }

  setOptionalTrimmedParam(query, "search", params.search, MAX_SEARCH_LENGTH);
  setOptionalTrimmedParam(
    query,
    "company_id",
    params.companyId,
    MAX_FILTER_ID_LENGTH,
  );
  setOptionalTrimmedParam(
    query,
    "creator_user_id",
    params.creatorUserId,
    MAX_FILTER_ID_LENGTH,
  );
  setOptionalTrimmedParam(
    query,
    "reviewer_user_id",
    params.reviewerUserId,
    MAX_FILTER_ID_LENGTH,
  );

  if (params.generationStatus) {
    query.set("generation_status", params.generationStatus);
  }

  if (params.reviewStatus) {
    query.set("review_status", params.reviewStatus);
  }

  if (params.createdFrom) {
    query.set("created_from", params.createdFrom);
  }

  if (params.createdTo) {
    query.set("created_to", params.createdTo);
  }

  return `${ADMIN_REPORTS_API_PREFIX}?${query.toString()}`;
}

export function listAdminReports(
  params: ListAdminReportsParams = {},
  signal?: AbortSignal,
): Promise<AdminReportListResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(buildListUrl(params), {
        headers: bearerHeaders(accessToken),
        schema: adminReportListResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function getAdminReport(
  platformReportId: string,
  signal?: AbortSignal,
): Promise<Report> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(
        `${ADMIN_REPORTS_API_PREFIX}/${encodeURIComponent(platformReportId)}`,
        {
          headers: bearerHeaders(accessToken),
          schema: reportSchema,
          signal: requestSignal,
        },
      ),
    signal,
  );
}
