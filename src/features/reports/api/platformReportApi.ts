import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";

import {
  createReportInputSchema,
  reportListResponseSchema,
  reportSchema,
  type CreateReportInput,
  type ListPlatformReportsParams,
  type Report,
  type ReportListResponse,
} from "../schemas/platformReportSchemas";

const REPORTS_API_PREFIX = "/api/v1/reports";

function bearerHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

function buildListUrl(params: ListPlatformReportsParams): string {
  const query = new URLSearchParams();

  if (params.limit !== undefined) {
    query.set("limit", String(params.limit));
  }

  if (params.cursor) {
    query.set("cursor", params.cursor);
  }

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.generationStatus) {
    query.set("generation_status", params.generationStatus);
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return `${REPORTS_API_PREFIX}${suffix}`;
}

export function createPlatformReport(
  input: CreateReportInput,
  signal?: AbortSignal,
): Promise<Report> {
  const body = createReportInputSchema.parse(input);

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(REPORTS_API_PREFIX, {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: reportSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function listPlatformReports(
  params: ListPlatformReportsParams = {},
  signal?: AbortSignal,
): Promise<ReportListResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(buildListUrl(params), {
        headers: bearerHeaders(accessToken),
        schema: reportListResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function getPlatformReport(
  platformReportId: string,
  signal?: AbortSignal,
): Promise<Report> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(`${REPORTS_API_PREFIX}/${encodeURIComponent(platformReportId)}`, {
        headers: bearerHeaders(accessToken),
        schema: reportSchema,
        signal: requestSignal,
      }),
    signal,
  );
}
