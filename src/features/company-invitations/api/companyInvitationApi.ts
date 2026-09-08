import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";
import { ApiRequestError } from "@/services/ApiRequestError";

import {
  createInvitationRequestSchema,
  invitationAcceptanceSchema,
  invitationListResponseSchema,
  invitationPreviewSchema,
  invitationSchema,
  invitationTokenRequestSchema,
  registerInvitationRequestSchema,
  type Invitation,
  type InvitationAcceptance,
  type InvitationListResponse,
  type InvitationPreview,
  type ListCompanyInvitationsParams,
  type RegisterInvitationRequest,
} from "../schemas/companyInvitationSchemas";

const COMPANY_INVITATIONS_API_PREFIX = "/api/v1/companies/me/invitations";
const RECIPIENT_INVITATIONS_API_PREFIX = "/api/v1/company-invitations";
const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 50;
const MAX_CURSOR_LENGTH = 1024;

const INVALID_INVITATION_TOKEN_ERROR = new ApiRequestError({
  status: 400,
  code: "invalid_or_expired_invitation",
  message: "This invitation link is invalid or has expired.",
});

function bearerHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

function invitationPath(invitationId: string): string {
  return `${COMPANY_INVITATIONS_API_PREFIX}/${encodeURIComponent(invitationId)}`;
}

function buildListUrl(params: ListCompanyInvitationsParams): string {
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

  return `${COMPANY_INVITATIONS_API_PREFIX}?${query.toString()}`;
}

export function createInvitation(
  email: string,
  signal?: AbortSignal,
): Promise<Invitation> {
  const body = createInvitationRequestSchema.parse({ email });

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(COMPANY_INVITATIONS_API_PREFIX, {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: invitationSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function listCompanyInvitations(
  params: ListCompanyInvitationsParams = {},
  signal?: AbortSignal,
): Promise<InvitationListResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(buildListUrl(params), {
        headers: bearerHeaders(accessToken),
        schema: invitationListResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function resendInvitation(
  invitationId: string,
  signal?: AbortSignal,
): Promise<Invitation> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(`${invitationPath(invitationId)}/resend`, {
        method: "POST",
        headers: bearerHeaders(accessToken),
        schema: invitationSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function revokeInvitation(
  invitationId: string,
  signal?: AbortSignal,
): Promise<Invitation> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(`${invitationPath(invitationId)}/revoke`, {
        method: "POST",
        headers: bearerHeaders(accessToken),
        schema: invitationSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

function parseInvitationToken(token: string) {
  const parsed = invitationTokenRequestSchema.safeParse({ token });

  if (!parsed.success) {
    throw INVALID_INVITATION_TOKEN_ERROR;
  }

  return parsed.data;
}

export function previewInvitation(
  token: string,
  signal?: AbortSignal,
): Promise<InvitationPreview> {
  return apiRequest(`${RECIPIENT_INVITATIONS_API_PREFIX}/preview`, {
    method: "POST",
    body: parseInvitationToken(token),
    schema: invitationPreviewSchema,
    signal,
  });
}

export function acceptInvitation(
  token: string,
  signal?: AbortSignal,
): Promise<InvitationAcceptance> {
  const body = parseInvitationToken(token);

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(`${RECIPIENT_INVITATIONS_API_PREFIX}/accept`, {
        method: "POST",
        headers: bearerHeaders(accessToken),
        body,
        schema: invitationAcceptanceSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function registerInvitation(
  input: RegisterInvitationRequest,
  signal?: AbortSignal,
): Promise<InvitationAcceptance> {
  const parsed = registerInvitationRequestSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }

    if (fieldErrors.token && Object.keys(fieldErrors).length === 1) {
      throw INVALID_INVITATION_TOKEN_ERROR;
    }

    throw new ApiRequestError({
      status: 422,
      message: "Please check the highlighted fields.",
      fieldErrors,
    });
  }

  return apiRequest(`${RECIPIENT_INVITATIONS_API_PREFIX}/register`, {
    method: "POST",
    body: parsed.data,
    schema: invitationAcceptanceSchema,
    signal,
  });
}
