import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";

import {
  seatListResponseSchema,
  seatSchema,
  type ListCompanySeatsParams,
  type Seat,
  type SeatListResponse,
} from "../schemas/seatManagementSchemas";

const COMPANY_SEATS_API_PREFIX = "/api/v1/companies/me/seats";
const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;
const MAX_CURSOR_LENGTH = 1024;

function bearerHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

function membershipPath(membershipId: string): string {
  return `${COMPANY_SEATS_API_PREFIX}/${encodeURIComponent(membershipId)}`;
}

function buildListUrl(params: ListCompanySeatsParams): string {
  const query = new URLSearchParams();
  const limit = Math.min(
    MAX_LIST_LIMIT,
    Math.max(1, params.limit ?? DEFAULT_LIST_LIMIT),
  );

  query.set("limit", String(limit));

  if (params.cursor) {
    query.set("cursor", params.cursor.slice(0, MAX_CURSOR_LENGTH));
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.role) {
    query.set("role", params.role);
  }

  const search = params.search?.trim();

  if (search) {
    query.set("search", search.slice(0, MAX_SEARCH_LENGTH));
  }

  return `${COMPANY_SEATS_API_PREFIX}?${query.toString()}`;
}

export function listCompanySeats(
  params: ListCompanySeatsParams = {},
  signal?: AbortSignal,
): Promise<SeatListResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(buildListUrl(params), {
        headers: bearerHeaders(accessToken),
        schema: seatListResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function disableCompanySeat(
  membershipId: string,
  signal?: AbortSignal,
): Promise<Seat> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(`${membershipPath(membershipId)}/disable`, {
        method: "POST",
        headers: bearerHeaders(accessToken),
        schema: seatSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function enableCompanySeat(
  membershipId: string,
  signal?: AbortSignal,
): Promise<Seat> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(`${membershipPath(membershipId)}/enable`, {
        method: "POST",
        headers: bearerHeaders(accessToken),
        schema: seatSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function removeCompanySeat(
  membershipId: string,
  signal?: AbortSignal,
): Promise<Seat> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(membershipPath(membershipId), {
        method: "DELETE",
        headers: bearerHeaders(accessToken),
        schema: seatSchema,
        signal: requestSignal,
      }),
    signal,
  );
}
