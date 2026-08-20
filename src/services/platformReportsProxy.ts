import {
  forbiddenResponse,
  forwardToUpstream,
  getPlatformUpstreamBaseUrl,
  hasValidOrigin,
  methodNotAllowedResponse,
  missingConfigResponse,
  STATE_CHANGING_METHODS,
} from "./platformProxyCommon";

const LIST_ALLOWED_METHODS = ["GET", "POST"] as const;
const DETAIL_ALLOWED_METHODS = ["GET"] as const;

function buildUpstreamReportsBaseUrl(): string | null {
  const platformApiBaseUrl = getPlatformUpstreamBaseUrl();

  if (!platformApiBaseUrl) {
    return null;
  }

  return `${platformApiBaseUrl}/reports`;
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
