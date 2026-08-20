import { getPlatformApiBaseUrl } from "@/services/env/platformApiBaseUrl";
import {
  buildUpstreamRequestHeaders,
  createProxyResponse,
  forbiddenResponse,
  hasValidOrigin,
  methodNotAllowedResponse,
  missingConfigResponse,
  notFoundResponse,
  STATE_CHANGING_METHODS,
} from "./platformProxyCommon";

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

  return createProxyResponse(upstreamResponse, (headers) => {
    for (const setCookie of readUpstreamSetCookies(upstreamResponse)) {
      headers.append("Set-Cookie", normalizeSetCookieForRelay(setCookie));
    }
  });
}
