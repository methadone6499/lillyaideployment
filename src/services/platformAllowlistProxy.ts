import {
  forbiddenResponse,
  forwardToUpstream,
  getPlatformUpstreamBaseUrl,
  hasValidOrigin,
  methodNotAllowedResponse,
  missingConfigResponse,
  notFoundResponse,
  STATE_CHANGING_METHODS,
} from "./platformProxyCommon";

export const PLATFORM_PROXY_PREFIXES = [
  "subscriptions",
  "companies/me",
  "company-invitations",
  "admin",
] as const;

export type PlatformProxyPrefix = (typeof PLATFORM_PROXY_PREFIXES)[number];

type PlatformProxyRule = {
  prefix: PlatformProxyPrefix;
  pattern: readonly string[];
  methods: readonly string[];
};

const PARAM_SEGMENT_PATTERN = /^[A-Za-z0-9._~-]+$/;

const PLATFORM_PROXY_ALLOWLIST = [
  {
    prefix: "subscriptions",
    pattern: ["enterprise", "activate"],
    methods: ["POST"],
  },
  {
    prefix: "companies/me",
    pattern: ["invitations"],
    methods: ["GET", "POST"],
  },
  {
    prefix: "companies/me",
    pattern: ["invitations", ":invitation_id", "resend"],
    methods: ["POST"],
  },
  {
    prefix: "companies/me",
    pattern: ["invitations", ":invitation_id", "revoke"],
    methods: ["POST"],
  },
  {
    prefix: "companies/me",
    pattern: ["quota"],
    methods: ["GET"],
  },
  {
    prefix: "companies/me",
    pattern: ["quota", "me"],
    methods: ["GET"],
  },
  {
    prefix: "companies/me",
    pattern: ["reports"],
    methods: ["GET"],
  },
  {
    prefix: "companies/me",
    pattern: ["reports", ":report_id"],
    methods: ["GET"],
  },
  {
    prefix: "companies/me",
    pattern: ["seats"],
    methods: ["GET"],
  },
  {
    prefix: "companies/me",
    pattern: ["seats", ":membership_id"],
    methods: ["DELETE"],
  },
  {
    prefix: "companies/me",
    pattern: ["seats", ":membership_id", "disable"],
    methods: ["POST"],
  },
  {
    prefix: "companies/me",
    pattern: ["seats", ":membership_id", "enable"],
    methods: ["POST"],
  },
  {
    prefix: "companies/me",
    pattern: ["seats", ":membership_id", "quota"],
    methods: ["PUT"],
  },
  {
    prefix: "company-invitations",
    pattern: ["accept"],
    methods: ["POST"],
  },
  {
    prefix: "company-invitations",
    pattern: ["preview"],
    methods: ["POST"],
  },
  {
    prefix: "company-invitations",
    pattern: ["register"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["companies"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["companies", ":company_id"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["reports"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["reports", ":report_id"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["users"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["users", ":user_id"],
    methods: ["GET"],
  },
] as const satisfies readonly PlatformProxyRule[];

function isParamSegment(patternPart: string): boolean {
  return patternPart.startsWith(":");
}

function isSafeParamValue(value: string): boolean {
  return value.length > 0 && PARAM_SEGMENT_PATTERN.test(value);
}

function matchAllowlistedPath(
  prefix: PlatformProxyPrefix,
  pathSegments: string[],
): { methods: readonly string[]; upstreamPath: string } | null {
  for (const rule of PLATFORM_PROXY_ALLOWLIST) {
    if (rule.prefix !== prefix || rule.pattern.length !== pathSegments.length) {
      continue;
    }

    const encodedSegments: string[] = [];
    let matches = true;

    for (let index = 0; index < rule.pattern.length; index += 1) {
      const patternPart = rule.pattern[index];
      const actualPart = pathSegments[index];

      if (isParamSegment(patternPart)) {
        if (!isSafeParamValue(actualPart)) {
          matches = false;
          break;
        }

        encodedSegments.push(encodeURIComponent(actualPart));
        continue;
      }

      if (patternPart !== actualPart) {
        matches = false;
        break;
      }

      encodedSegments.push(actualPart);
    }

    if (!matches) {
      continue;
    }

    return {
      methods: rule.methods,
      upstreamPath: `${prefix}/${encodedSegments.join("/")}`,
    };
  }

  return null;
}

/**
 * Allowlisted BFF proxy for company, subscription, invitation, and admin
 * Platform API paths. Never forwards acting user, role, or company headers.
 */
export async function proxyAllowlistedPlatformRequest(
  request: Request,
  prefix: PlatformProxyPrefix,
  pathSegments: string[],
): Promise<Response> {
  const method = request.method.toUpperCase();
  const match = matchAllowlistedPath(prefix, pathSegments);

  if (!match) {
    return notFoundResponse();
  }

  if (!match.methods.includes(method)) {
    return methodNotAllowedResponse();
  }

  if (STATE_CHANGING_METHODS.has(method) && !hasValidOrigin(request)) {
    return forbiddenResponse();
  }

  const platformApiBaseUrl = getPlatformUpstreamBaseUrl();

  if (!platformApiBaseUrl) {
    return missingConfigResponse();
  }

  const upstreamUrl = new URL(`${platformApiBaseUrl}/${match.upstreamPath}`);
  upstreamUrl.search = new URL(request.url).search;

  return forwardToUpstream(request, upstreamUrl.toString(), method);
}

export async function handleAllowlistedPlatformRoute(
  request: Request,
  prefix: PlatformProxyPrefix,
  params: Promise<{ path: string[] }>,
): Promise<Response> {
  const { path } = await params;
  return proxyAllowlistedPlatformRequest(request, prefix, path);
}
