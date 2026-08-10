import { getPlatformApiBaseUrl } from "@/services/env/platformApiBaseUrl";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "authorization",
  "content-type",
  "cookie",
  "x-correlation-id",
  "x-request-id",
] as const;

const NO_CACHE_RESPONSE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

const GENERIC_PROXY_ERROR_BODY = JSON.stringify({
  message: "Service unavailable",
});

const LIST_ALLOWED_METHODS = ["GET", "POST"] as const;
const DETAIL_ALLOWED_METHODS = ["GET"] as const;

function getRequestOrigin(request: Request): string {
  return new URL(request.url).origin;
}

function hasValidOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  return origin === getRequestOrigin(request);
}

function buildUpstreamRequestHeaders(request: Request): Headers {
  const headers = new Headers();

  for (const headerName of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

function buildProxyResponse(upstreamResponse: Response): Response {
  const headers = new Headers(NO_CACHE_RESPONSE_HEADERS);

  const contentType = upstreamResponse.headers.get("content-type");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
}

function methodNotAllowedResponse(): Response {
  return new Response(null, {
    status: 405,
    headers: NO_CACHE_RESPONSE_HEADERS,
  });
}

function forbiddenResponse(): Response {
  return new Response(null, {
    status: 403,
    headers: NO_CACHE_RESPONSE_HEADERS,
  });
}

function missingConfigResponse(): Response {
  return new Response(GENERIC_PROXY_ERROR_BODY, {
    status: 500,
    headers: {
      ...NO_CACHE_RESPONSE_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function buildUpstreamReportsBaseUrl(): string | null {
  const platformApiBaseUrl = getPlatformApiBaseUrl();

  if (!platformApiBaseUrl) {
    return null;
  }

  return `${platformApiBaseUrl}/reports`;
}

async function forwardToUpstream(
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

  return buildProxyResponse(upstreamResponse);
}

/**
 * Proxy list/create Platform reports requests.
 * Forwards the incoming query string on GET so limit/cursor/search/generation_status are preserved.
 */
export async function proxyPlatformReportsCollectionRequest(
  request: Request,
): Promise<Response> {
  const method = request.method.toUpperCase();

  if (!(LIST_ALLOWED_METHODS as readonly string[]).includes(method)) {
    return methodNotAllowedResponse();
  }

  if (STATE_CHANGING_METHODS.has(method) && !hasValidOrigin(request)) {
    return forbiddenResponse();
  }

  const reportsBaseUrl = buildUpstreamReportsBaseUrl();

  if (!reportsBaseUrl) {
    return missingConfigResponse();
  }

  const upstreamUrl = new URL(reportsBaseUrl);
  upstreamUrl.search = new URL(request.url).search;

  return forwardToUpstream(request, upstreamUrl.toString(), method);
}

/**
 * Proxy Platform report detail requests by Platform report ID.
 * Never injects user, company, role, reviewer, or status fields.
 */
export async function proxyPlatformReportDetailRequest(
  request: Request,
  id: string,
): Promise<Response> {
  const method = request.method.toUpperCase();

  if (!(DETAIL_ALLOWED_METHODS as readonly string[]).includes(method)) {
    return methodNotAllowedResponse();
  }

  const reportsBaseUrl = buildUpstreamReportsBaseUrl();

  if (!reportsBaseUrl) {
    return missingConfigResponse();
  }

  const upstreamUrl = `${reportsBaseUrl}/${encodeURIComponent(id)}`;

  return forwardToUpstream(request, upstreamUrl, method);
}
