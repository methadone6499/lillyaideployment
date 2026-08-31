import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";

import {
  adminUserListResponseSchema,
  type AdminUserListResponse,
  type ListAdminUsersParams,
} from "../schemas/adminUserSchemas";

const ADMIN_USERS_API_PREFIX = "/api/v1/admin/users";
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

function buildListUrl(params: ListAdminUsersParams): string {
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

  return `${ADMIN_USERS_API_PREFIX}?${query.toString()}`;
}

export function listAdminUsers(
  params: ListAdminUsersParams = {},
  signal?: AbortSignal,
): Promise<AdminUserListResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(buildListUrl(params), {
        headers: bearerHeaders(accessToken),
        schema: adminUserListResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}
