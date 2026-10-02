import { authenticatedAuthRequest } from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";
import { apiRequest } from "@/services/apiRequest";
import { parseApiErrorResponse } from "@/services/parseApiErrorResponse";

import {
  companyLogoResponseSchema,
  type CompanyLogoResponse,
} from "../schemas/companyBrandingSchemas";

const COMPANY_LOGO_API_PATH = "/api/v1/companies/me/branding/logo";

function bearerHeaders(accessToken: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` };
}

async function parseCompanyLogoJson(
  response: Response,
): Promise<CompanyLogoResponse> {
  const json: unknown = await response.json();
  const parsed = companyLogoResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new ApiRequestError({
      status: response.status,
      message: "Response did not match the company logo schema",
      rawCause: parsed.error,
    });
  }

  return parsed.data;
}

export function getCompanyLogo(
  signal?: AbortSignal,
): Promise<CompanyLogoResponse> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(COMPANY_LOGO_API_PATH, {
        headers: bearerHeaders(accessToken),
        schema: companyLogoResponseSchema,
        signal: requestSignal,
      }),
    signal,
  );
}

export function putCompanyLogo(
  file: File,
  signal?: AbortSignal,
): Promise<CompanyLogoResponse> {
  return authenticatedAuthRequest(async (accessToken, requestSignal) => {
    const response = await fetch(COMPANY_LOGO_API_PATH, {
      method: "PUT",
      headers: {
        ...bearerHeaders(accessToken),
        Accept: "application/json",
        "Content-Type": "image/png",
      },
      body: file,
      signal: requestSignal,
    });

    if (!response.ok) {
      throw await parseApiErrorResponse(response);
    }

    return parseCompanyLogoJson(response);
  }, signal);
}

export function getCompanyLogoBlob(signal?: AbortSignal): Promise<Blob> {
  return authenticatedAuthRequest(async (accessToken, requestSignal) => {
    const response = await fetch(`${COMPANY_LOGO_API_PATH}/content`, {
      headers: {
        ...bearerHeaders(accessToken),
        Accept: "image/png",
      },
      cache: "no-cache",
      signal: requestSignal,
    });

    if (!response.ok) {
      throw await parseApiErrorResponse(response);
    }

    const contentType = response.headers.get("content-type")
      ?.split(";", 1)[0]
      .trim()
      .toLowerCase();

    if (contentType !== "image/png") {
      throw new ApiRequestError({
        status: response.status,
        message: "Expected the company logo endpoint to return a PNG image",
      });
    }

    return response.blob();
  }, signal);
}

export function deleteCompanyLogo(signal?: AbortSignal): Promise<void> {
  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(COMPANY_LOGO_API_PATH, {
        method: "DELETE",
        headers: bearerHeaders(accessToken),
        expectEmpty: true,
        signal: requestSignal,
      }),
    signal,
  );
}
