import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";

import {
  adminCompanyListResponseSchema,
  adminCompanyResponseSchema,
  type AdminCompanyListResponse,
  type AdminCompanyResponse,
  type ListAdminCompaniesParams,
} from "../schemas/adminCompanySchemas";
import {
  adminCompanyMemberListResponseSchema,
  type AdminCompanyMemberListResponse,
  type ListAdminCompanyMembersParams,
} from "../schemas/adminCompanyMemberSchemas";

const ADMIN_COMPANIES_API_PREFIX = "/api/v1/admin/companies";
const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;
const MAX_CURSOR_LENGTH = 1024;

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

function buildListUrl(params: ListAdminCompaniesParams): string {
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

  if (params.subscriptionStatus) {
    query.set("subscription_status", params.subscriptionStatus);
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.type) {
    query.set("type", params.type);
  }

  if (params.planType) {
    query.set("plan_type", params.planType);
  }

  return `${ADMIN_COMPANIES_API_PREFIX}?${query.toString()}`;
}

export function listAdminCompanies(
  params: ListAdminCompaniesParams = {},
  signal?: AbortSignal,
): Promise<AdminCompanyListResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(buildListUrl(params), {
        headers: bearerHeaders(accessToken),
        schema: adminCompanyListResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

function companyPath(companyId: string): string {
  return `${ADMIN_COMPANIES_API_PREFIX}/${encodeURIComponent(companyId)}`;
}

export function getAdminCompany(
  companyId: string,
  signal?: AbortSignal,
): Promise<AdminCompanyResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(companyPath(companyId), {
        headers: bearerHeaders(accessToken),
        schema: adminCompanyResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

function buildMemberListUrl(
  companyId: string,
  params: ListAdminCompanyMembersParams,
): string {
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

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.role) {
    query.set("role", params.role);
  }

  if (params.userStatus) {
    query.set("user_status", params.userStatus);
  }

  return `${companyPath(companyId)}/members?${query.toString()}`;
}

export function listAdminCompanyMembers(
  companyId: string,
  params: ListAdminCompanyMembersParams = {},
  signal?: AbortSignal,
): Promise<AdminCompanyMemberListResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(buildMemberListUrl(companyId, params), {
        headers: bearerHeaders(accessToken),
        schema: adminCompanyMemberListResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}
