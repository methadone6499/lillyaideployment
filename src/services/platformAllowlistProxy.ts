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
  "reviewer-invitations",
  "reviewer",
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
    pattern: ["me"],
    methods: ["GET"],
  },
  {
    prefix: "subscriptions",
    pattern: ["checkout"],
    methods: ["POST"],
  },
  {
    prefix: "subscriptions",
    pattern: ["portal"],
    methods: ["POST"],
  },
  {
    prefix: "subscriptions",
    pattern: ["upgrade"],
    methods: ["POST"],
  },
  {
    prefix: "subscriptions",
    pattern: ["downgrade"],
    methods: ["POST"],
  },
  {
    prefix: "subscriptions",
    pattern: ["downgrade", "cancel"],
    methods: ["POST"],
  },
  {
    prefix: "subscriptions",
    pattern: ["custom", "requests"],
    methods: ["POST"],
  },
  {
    prefix: "subscriptions",
    pattern: ["custom", "requests", "me"],
    methods: ["GET"],
  },
  {
    prefix: "subscriptions",
    pattern: ["custom", "requests", ":request_id"],
    methods: ["PATCH"],
  },
  {
    prefix: "subscriptions",
    pattern: ["custom", "requests", ":request_id", "cancel"],
    methods: ["POST"],
  },
  {
    prefix: "subscriptions",
    pattern: ["custom", "offers", "current"],
    methods: ["GET"],
  },
  {
    prefix: "subscriptions",
    pattern: ["custom", "offers", ":offer_id", "accept"],
    methods: ["POST"],
  },
  {
    prefix: "subscriptions",
    pattern: ["custom", "offers", ":offer_id", "request-changes"],
    methods: ["POST"],
  },
  {
    prefix: "subscriptions",
    pattern: ["custom", "offers", ":offer_id", "decline"],
    methods: ["POST"],
  },
  {
    prefix: "subscriptions",
    pattern: ["custom", "offers", ":offer_id", "resend-email"],
    methods: ["POST"],
  },
  {
    prefix: "subscriptions",
    pattern: ["custom", "offers", ":offer_id", "payment", "resume"],
    methods: ["POST"],
  },
  {
    prefix: "subscriptions",
    pattern: ["custom", "offers", ":offer_id", "payment", "cancel"],
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
    pattern: ["quota", "redistribution", "dismiss"],
    methods: ["POST"],
  },
  {
    prefix: "companies/me",
    pattern: ["branding", "logo"],
    methods: ["GET", "PUT", "DELETE"],
  },
  {
    prefix: "companies/me",
    pattern: ["branding", "logo", "content"],
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
    prefix: "reviewer-invitations",
    pattern: ["preview"],
    methods: ["POST"],
  },
  {
    prefix: "reviewer-invitations",
    pattern: ["register"],
    methods: ["POST"],
  },
  {
    prefix: "reviewer",
    pattern: ["dashboard"],
    methods: ["GET"],
  },
  {
    prefix: "reviewer",
    pattern: ["assignments"],
    methods: ["GET"],
  },
  {
    prefix: "reviewer",
    pattern: ["assignments", ":assignment_id"],
    methods: ["GET"],
  },
  {
    prefix: "reviewer",
    pattern: ["assignments", ":assignment_id", "start"],
    methods: ["POST"],
  },
  {
    prefix: "reviewer",
    pattern: ["assignments", ":assignment_id", "complete"],
    methods: ["POST"],
  },
  {
    prefix: "reviewer",
    pattern: ["assignments", ":assignment_id", "section-notes"],
    methods: ["GET", "PUT"],
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
    pattern: ["companies", ":company_id", "members"],
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
    pattern: ["reports", ":report_id", "review-history"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["reports", ":report_id", "comments"],
    methods: ["GET", "POST"],
  },
  {
    prefix: "admin",
    pattern: ["report-analytics", "popular-drugs"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["report-analytics", "top-users"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["report-analytics", "top-companies"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["report-analytics", "totals"],
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
  {
    prefix: "admin",
    pattern: ["users", ":user_id", "disable"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["users", ":user_id", "enable"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["reviewer-invitations"],
    methods: ["GET", "POST"],
  },
  {
    prefix: "admin",
    pattern: ["reviewer-invitations", ":invitation_id", "resend"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["reviewer-invitations", ":invitation_id", "revoke"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["reviewers"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["reviewers", ":reviewer_id", "suspend"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["reviewers", ":reviewer_id", "activate"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["reviewer-assignment-settings"],
    methods: ["GET", "PUT"],
  },
  {
    prefix: "admin",
    pattern: ["review-dashboard"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["review-assignments"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["review-assignments", ":assignment_id", "reassign"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["review-assignments", ":assignment_id", "section-notes"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["review-assignments", "queue", ":report_id", "retry"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["custom-subscriptions", "requests"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["custom-subscriptions", "requests", ":request_id"],
    methods: ["GET"],
  },
  {
    prefix: "admin",
    pattern: ["custom-subscriptions", "requests", ":request_id", "review"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: [
      "custom-subscriptions",
      "requests",
      ":request_id",
      "action-required",
    ],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["custom-subscriptions", "requests", ":request_id", "close"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: [
      "custom-subscriptions",
      "requests",
      ":request_id",
      "resend-close-email",
    ],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["custom-subscriptions", "requests", ":request_id", "notes"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["custom-subscriptions", "requests", ":request_id", "offers"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["custom-subscriptions", "offers", ":offer_id"],
    methods: ["PATCH"],
  },
  {
    prefix: "admin",
    pattern: ["custom-subscriptions", "offers", ":offer_id", "publish"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["custom-subscriptions", "offers", ":offer_id", "cancel"],
    methods: ["POST"],
  },
  {
    prefix: "admin",
    pattern: ["custom-subscriptions", "offers", ":offer_id", "resend-email"],
    methods: ["POST"],
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
 * Allowlisted BFF proxy for company, subscription, invitation, reviewer, and admin
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
