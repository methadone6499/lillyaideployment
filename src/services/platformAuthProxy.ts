import { getPlatformApiBaseUrl } from "@/services/env/platformApiBaseUrl";

const AUTH_PROXY_ALLOWLIST = {
  signup: ["POST"],
  "email/verify": ["POST"],
  "email/resend-verification": ["POST"],
  login: ["POST"],
  refresh: ["POST"],
  logout: ["POST"],
  "password/forgot": ["POST"],
  "password/reset": ["POST"],
  me: ["GET"],
} as const satisfies Record<string, readonly string[]>;

type AuthProxyPath = keyof typeof AUTH_PROXY_ALLOWLIST;

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

function isAuthProxyPath(path: string): path is AuthProxyPath {
  return Object.prototype.hasOwnProperty.call(AUTH_PROXY_ALLOWLIST, path);
}

function isMethodAllowedForPath(
  path: AuthProxyPath,
  method: string,
): boolean {
  const allowedMethods = AUTH_PROXY_ALLOWLIST[path] as readonly string[];

  return allowedMethods.includes(method);
}

function buildUpstreamAuthUrl(path: AuthProxyPath): string | null {
  const platformApiBaseUrl = getPlatformApiBaseUrl();

  if (!platformApiBaseUrl) {
    return null;
  }

  return `${platformApiBaseUrl}/auth/${path}`;
}

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

/**
 * Remove only the Domain attribute so host-only cookies work on the frontend.
 * Preserves Max-Age, Expires, Path, Secure, HttpOnly, and SameSite.
 */
export function normalizeSetCookieForRelay(setCookie: string): string {
  return setCookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !/^domain=/i.test(part))
    .join("; ");
}

function readUpstreamSetCookies(response: Response): string[] {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const singleCookie = response.headers.get("set-cookie");

  return singleCookie ? [singleCookie] : [];
}

function buildProxyResponse(upstreamResponse: Response): Response {
  const headers = new Headers(NO_CACHE_RESPONSE_HEADERS);

  const contentType = upstreamResponse.headers.get("content-type");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  for (const setCookie of readUpstreamSetCookies(upstreamResponse)) {
    headers.append("Set-Cookie", normalizeSetCookieForRelay(setCookie));
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

function notFoundResponse(): Response {
  return new Response(null, {
    status: 404,
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

export async function proxyPlatformAuthRequest(
  request: Request,
  authPathSegments: string[],
): Promise<Response> {
  const method = request.method.toUpperCase();
  const path = authPathSegments.join("/");

  if (!isAuthProxyPath(path)) {
    return notFoundResponse();
  }

  if (!isMethodAllowedForPath(path, method)) {
    return methodNotAllowedResponse();
  }

  if (STATE_CHANGING_METHODS.has(method) && !hasValidOrigin(request)) {
    return forbiddenResponse();
  }

  const upstreamUrl = buildUpstreamAuthUrl(path);

  if (!upstreamUrl) {
    return missingConfigResponse();
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method,
    headers: buildUpstreamRequestHeaders(request),
    body: method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
  });

  return buildProxyResponse(upstreamResponse);
}
