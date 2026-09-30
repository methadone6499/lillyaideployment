import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";

import {
  acceptanceResultSchema,
  createCustomRequestBodySchema,
  customRequestSchema,
  customerOfferStateSchema,
  declineOfferBodySchema,
  emailDeliverySchema,
  expectedRevisionBodySchema,
  requestChangesBodySchema,
  updateCustomRequestBodySchema,
  type AcceptanceResult,
  type CreateCustomRequestBody,
  type CustomRequest,
  type CustomerOfferState,
  type DeclineOfferBody,
  type EmailDelivery,
  type RequestChangesBody,
  type UpdateCustomRequestBody,
} from "../schemas/customSubscriptionSchemas";
import { isCustomRequestNotFoundError } from "../utils/classifyCustomSubscriptionError";

const CUSTOM_API_PREFIX = "/api/v1/subscriptions/custom";
const CUSTOM_REQUESTS_URL = `${CUSTOM_API_PREFIX}/requests`;
const CURRENT_OFFER_URL = `${CUSTOM_API_PREFIX}/offers/current`;

function bearerHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

function requestPath(requestId: string, action?: string): string {
  const base = `${CUSTOM_REQUESTS_URL}/${encodeURIComponent(requestId)}`;
  return action ? `${base}/${action}` : base;
}

function offerPath(offerId: string, action: string): string {
  return `${CUSTOM_API_PREFIX}/offers/${encodeURIComponent(offerId)}/${action}`;
}

/**
 * Status-page source of truth. `null` means the user has no active request
 * (never requested, or the last one finished).
 */
export async function getCurrentCustomOfferState(
  signal?: AbortSignal,
): Promise<CustomerOfferState | null> {
  try {
    return await authenticatedAuthRequest(
      (accessToken, requestSignal) =>
        apiRequest(CURRENT_OFFER_URL, {
          headers: bearerHeaders(accessToken),
          schema: customerOfferStateSchema,
          signal: requestSignal,
        }),
      signal,
    );
  } catch (error) {
    if (isCustomRequestNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

export function createCustomRequest(
  input: CreateCustomRequestBody,
  signal?: AbortSignal,
): Promise<CustomRequest> {
  const body = createCustomRequestBodySchema.parse(input);

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(CUSTOM_REQUESTS_URL, {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: customRequestSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function updateCustomRequest(
  requestId: string,
  input: UpdateCustomRequestBody,
  signal?: AbortSignal,
): Promise<CustomRequest> {
  const body = updateCustomRequestBodySchema.parse(input);

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(requestPath(requestId), {
        method: "PATCH",
        headers: bearerHeaders(accessToken),
        body,
        schema: customRequestSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function cancelCustomRequest(
  requestId: string,
  expectedRevision: number,
  signal?: AbortSignal,
): Promise<CustomRequest> {
  const body = expectedRevisionBodySchema.parse({
    expected_revision: expectedRevision,
  });

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(requestPath(requestId, "cancel"), {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: customRequestSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

function postAcceptanceAction(
  offerId: string,
  action: "accept" | "payment/resume",
  signal?: AbortSignal,
): Promise<AcceptanceResult> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(offerPath(offerId, action), {
        method: "POST",
        headers: bearerHeaders(accessToken),
        schema: acceptanceResultSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function acceptCustomOffer(
  offerId: string,
  signal?: AbortSignal,
): Promise<AcceptanceResult> {
  return postAcceptanceAction(offerId, "accept", signal);
}

export function resumeCustomOfferPayment(
  offerId: string,
  signal?: AbortSignal,
): Promise<AcceptanceResult> {
  return postAcceptanceAction(offerId, "payment/resume", signal);
}

export function cancelCustomOfferPayment(
  offerId: string,
  signal?: AbortSignal,
): Promise<CustomRequest> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(offerPath(offerId, "payment/cancel"), {
        method: "POST",
        headers: bearerHeaders(accessToken),
        schema: customRequestSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function requestCustomOfferChanges(
  offerId: string,
  input: RequestChangesBody,
  signal?: AbortSignal,
): Promise<CustomRequest> {
  const body = requestChangesBodySchema.parse(input);

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(offerPath(offerId, "request-changes"), {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: customRequestSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function declineCustomOffer(
  offerId: string,
  input: DeclineOfferBody,
  signal?: AbortSignal,
): Promise<CustomRequest> {
  const body = declineOfferBodySchema.parse(input);

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(offerPath(offerId, "decline"), {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: customRequestSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function resendCustomOfferEmail(
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
