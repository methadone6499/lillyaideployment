import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";

import {
  actionRequiredBodySchema,
  adminCommunicationSchema,
  adminCustomRequestClosedSchema,
  adminCustomRequestDetailSchema,
  adminCustomRequestListSchema,
  adminCustomRequestSchema,
  closeRequestBodySchema,
  CUSTOM_SEARCH_MAX_LENGTH,
  createOfferDraftBodySchema,
  customOfferSchema,
  emailDeliverySchema,
  expectedRevisionBodySchema,
  internalNoteBodySchema,
  offerTermsSchema,
  type ActionRequiredBody,
  type AdminActiveFilter,
  type AdminCommunication,
  type AdminCustomRequest,
  type AdminCustomRequestClosed,
  type AdminCustomRequestDetail,
  type AdminCustomRequestList,
  type CloseRequestBody,
  type CreateOfferDraftBody,
  type CustomOffer,
  type CustomRequestStatus,
  type EmailDelivery,
  type InternalNoteBody,
  type OfferTerms,
} from "../schemas/customSubscriptionSchemas";

const ADMIN_CUSTOM_API_PREFIX = "/api/v1/admin/custom-subscriptions";
const ADMIN_REQUESTS_URL = `${ADMIN_CUSTOM_API_PREFIX}/requests`;
const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 100;
const MAX_CURSOR_LENGTH = 1024;

export type ListAdminCustomRequestsParams = {
  statuses?: readonly CustomRequestStatus[];
  active?: AdminActiveFilter;
  search?: string;
  limit?: number;
  cursor?: string | null;
};

function bearerHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

function requestPath(requestId: string, action?: string): string {
  const base = `${ADMIN_REQUESTS_URL}/${encodeURIComponent(requestId)}`;
  return action ? `${base}/${action}` : base;
}

function offerPath(offerId: string, action?: string): string {
  const base = `${ADMIN_CUSTOM_API_PREFIX}/offers/${encodeURIComponent(offerId)}`;
  return action ? `${base}/${action}` : base;
}

export function buildAdminCustomRequestListUrl(
  params: ListAdminCustomRequestsParams = {},
): string {
  const query = new URLSearchParams();
  const limit = Math.min(
    MAX_LIST_LIMIT,
    Math.max(1, params.limit ?? DEFAULT_LIST_LIMIT),
  );

  query.set("limit", String(limit));

  for (const status of new Set(params.statuses ?? [])) {
    query.append("statuses", status);
  }

  if (params.active) {
    query.set("active", params.active);
  }

  const search = params.search?.trim();
  if (search) {
    query.set("search", search.slice(0, CUSTOM_SEARCH_MAX_LENGTH));
  }

  if (params.cursor) {
    query.set("cursor", params.cursor.slice(0, MAX_CURSOR_LENGTH));
  }

  return `${ADMIN_REQUESTS_URL}?${query.toString()}`;
}

export function listAdminCustomRequests(
  params: ListAdminCustomRequestsParams = {},
  signal?: AbortSignal,
): Promise<AdminCustomRequestList> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(buildAdminCustomRequestListUrl(params), {
        headers: bearerHeaders(accessToken),
        schema: adminCustomRequestListSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function getAdminCustomRequest(
  requestId: string,
  signal?: AbortSignal,
): Promise<AdminCustomRequestDetail> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(requestPath(requestId), {
        headers: bearerHeaders(accessToken),
        schema: adminCustomRequestDetailSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function startAdminCustomRequestReview(
  requestId: string,
  expectedRevision: number,
  signal?: AbortSignal,
): Promise<AdminCustomRequest> {
  const body = expectedRevisionBodySchema.parse({
    expected_revision: expectedRevision,
  });

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(requestPath(requestId, "review"), {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: adminCustomRequestSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function markAdminCustomRequestActionRequired(
  requestId: string,
  input: ActionRequiredBody,
  signal?: AbortSignal,
): Promise<AdminCustomRequest> {
  const body = actionRequiredBodySchema.parse(input);

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(requestPath(requestId, "action-required"), {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: adminCustomRequestSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function closeAdminCustomRequest(
  requestId: string,
  input: CloseRequestBody,
  signal?: AbortSignal,
): Promise<AdminCustomRequestClosed> {
  const body = closeRequestBodySchema.parse(input);

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(requestPath(requestId, "close"), {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: adminCustomRequestClosedSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function resendAdminCustomRequestCloseEmail(
  requestId: string,
  signal?: AbortSignal,
): Promise<EmailDelivery> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(requestPath(requestId, "resend-close-email"), {
        method: "POST",
        headers: bearerHeaders(accessToken),
        schema: emailDeliverySchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function addAdminCustomRequestNote(
  requestId: string,
  input: InternalNoteBody,
  signal?: AbortSignal,
): Promise<AdminCommunication> {
  const body = internalNoteBodySchema.parse(input);

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(requestPath(requestId, "notes"), {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: adminCommunicationSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function createAdminCustomOfferDraft(
  requestId: string,
  input: CreateOfferDraftBody,
  signal?: AbortSignal,
): Promise<CustomOffer> {
  const body = createOfferDraftBodySchema.parse(input);

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(requestPath(requestId, "offers"), {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: customOfferSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function updateAdminCustomOfferDraft(
  offerId: string,
  input: OfferTerms,
  signal?: AbortSignal,
): Promise<CustomOffer> {
  const body = offerTermsSchema.parse(input);

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(offerPath(offerId), {
        method: "PATCH",
        headers: bearerHeaders(accessToken),
        body,
        schema: customOfferSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

function postRevisionedOfferAction(
  offerId: string,
  action: "publish" | "cancel",
  expectedRevision: number,
  signal?: AbortSignal,
): Promise<CustomOffer> {
  const body = expectedRevisionBodySchema.parse({
    expected_revision: expectedRevision,
  });

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(offerPath(offerId, action), {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: customOfferSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function publishAdminCustomOffer(
  offerId: string,
  expectedRevision: number,
  signal?: AbortSignal,
): Promise<CustomOffer> {
  return postRevisionedOfferAction(offerId, "publish", expectedRevision, signal);
}

export function cancelAdminCustomOffer(
  offerId: string,
  expectedRevision: number,
  signal?: AbortSignal,
): Promise<CustomOffer> {
  return postRevisionedOfferAction(offerId, "cancel", expectedRevision, signal);
}

export function resendAdminCustomOfferEmail(
  offerId: string,
  signal?: AbortSignal,
): Promise<EmailDelivery> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(offerPath(offerId, "resend-email"), {
        method: "POST",
        headers: bearerHeaders(accessToken),
        schema: emailDeliverySchema,
        signal: requestSignal,
      }),
    signal,
  );
}
