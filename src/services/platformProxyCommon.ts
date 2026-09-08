import { getPlatformApiBaseUrl } from "@/services/env/platformApiBaseUrl";

export const STATE_CHANGING_METHODS = new Set([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "authorization",
  "content-type",
  "cookie",
  "x-correlation-id",
  "x-request-id",
] as const;

export const NO_CACHE_RESPONSE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

const GENERIC_PROXY_ERROR_BODY = JSON.stringify({
  message: "Service unavailable",
});

function getRequestOrigin(request: Request): string {
  return new URL(request.url).origin;
}

export function hasValidOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  return origin === getRequestOrigin(request);
}

export function buildUpstreamRequestHeaders(request: Request): Headers {
  const headers = new Headers();

  for (const headerName of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

export function createProxyResponse(
  upstreamResponse: Response,
  extraHeaders?: (headers: Headers) => void,
): Response {
  const headers = new Headers(NO_CACHE_RESPONSE_HEADERS);
  const contentType = upstreamResponse.headers.get("content-type");
  const retryAfter = upstreamResponse.headers.get("retry-after");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (retryAfter) {
    headers.set("Retry-After", retryAfter);
  }

  extraHeaders?.(headers);

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
}

export function methodNotAllowedResponse(): Response {
  return new Response(null, {
    status: 405,
    headers: NO_CACHE_RESPONSE_HEADERS,
  });
}

export function notFoundResponse(): Response {
  return new Response(null, {
    status: 404,
    headers: NO_CACHE_RESPONSE_HEADERS,
  });
}

export function forbiddenResponse(): Response {
  return new Response(null, {
    status: 403,
    headers: NO_CACHE_RESPONSE_HEADERS,
  });
}

export function missingConfigResponse(): Response {
  return new Response(GENERIC_PROXY_ERROR_BODY, {
    status: 500,
    headers: {
      ...NO_CACHE_RESPONSE_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

export function getPlatformUpstreamBaseUrl(): string | null {
  const platformApiBaseUrl = getPlatformApiBaseUrl();

  if (!platformApiBaseUrl) {
    return null;
  }

  return platformApiBaseUrl;
}

export async function forwardToUpstream(
  request: Request,
  upstreamUrl: string,
  method: string,
): Promise<Response> {
  const upstreamResponse = await fetch(upstreamUrl, {
    method,
    headers: buildUpstreamRequestHeaders(request),
    body:
      method === "GET" || method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    cache: "no-store",
    signal: request.signal,
  });

  return createProxyResponse(upstreamResponse);
}
