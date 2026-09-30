import {
  buildPathWithReturnTo,
  getPostAuthHomePath,
  getReviewerDestination,
  sanitizeReturnTo,
  type AuthMeResponse,
} from "@/features/auth";

import type { SubscriptionOverview } from "../schemas/billingSchemas";
import { BILLING_PATHS } from "./billingConstants";
import {
  getPaidActionFailureKind,
  type ClassifiedBillingError,
  type PaidActionFailureKind,
} from "./classifyBillingError";
import {
  canUsePaidFeature,
  hasPaidAccess,
  isSuperAdminContext,
  type PaidFeatureName,
} from "./selectBillingCapabilities";

function pathNameOf(path: string): string {
  const queryIndex = path.indexOf("?");
  const hashIndex = path.indexOf("#");
  const end =
    queryIndex === -1
      ? hashIndex
      : hashIndex === -1
        ? queryIndex
        : Math.min(queryIndex, hashIndex);

  return end === -1 ? path : path.slice(0, end);
}

function sanitizeOptionalReturnTo(
  returnTo: string | null | undefined,
): string | null {
  if (!returnTo) {
    return null;
  }

  const sanitized = sanitizeReturnTo(returnTo, "");
  return sanitized || null;
}

export function isCustomSubscriptionPath(path: string): boolean {
  const pathname = pathNameOf(path);
  return (
    pathname === BILLING_PATHS.custom || pathname === BILLING_PATHS.customOffer
  );
}

function isTransientBillingPath(path: string): boolean {
  const pathname = pathNameOf(path);
  return (
    pathname === BILLING_PATHS.onboarding || pathname === BILLING_PATHS.success
  );
}

export function buildSubscriptionOnboardingPath(
  returnTo?: string | null,
): string {
  const sanitized = sanitizeOptionalReturnTo(returnTo);

  if (!sanitized || isTransientBillingPath(sanitized)) {
    return BILLING_PATHS.onboarding;
  }

  return buildPathWithReturnTo(
    BILLING_PATHS.onboarding,
    sanitized,
    BILLING_PATHS.onboarding,
  );
}

export function resolveOnboardingExitPath(input: {
  me: AuthMeResponse;
  overview: SubscriptionOverview;
  returnTo?: string | null;
}): string | null {
  const destination = resolvePostAuthBillingDestination(input);

  if (pathNameOf(destination) === BILLING_PATHS.onboarding) {
    return null;
  }

  return destination;
}

export function resolvePostAuthBillingDestination(input: {
  me: AuthMeResponse;
  overview: SubscriptionOverview;
  returnTo?: string | null;
}): string {
  const reviewerDestination = getReviewerDestination(input.me, input.returnTo);
  if (reviewerDestination) {
    return reviewerDestination;
  }

  const homePath = getPostAuthHomePath(input.me);
  const safeReturnTo = sanitizeOptionalReturnTo(input.returnTo);

  if (
    safeReturnTo &&
    isCustomSubscriptionPath(safeReturnTo) &&
    !isSuperAdminContext(input.me)
  ) {
    return safeReturnTo;
  }

  if (isSuperAdminContext(input.me) || hasPaidAccess(input.overview, input.me)) {
    const sanitized = sanitizeReturnTo(input.returnTo, homePath);

    if (isTransientBillingPath(sanitized)) {
      return homePath;
    }

    return sanitized;
  }

  if (input.overview.subscription !== null) {
    return BILLING_PATHS.settings;
  }

  return buildSubscriptionOnboardingPath(input.returnTo);
}

export function resolvePaidActionFailurePath(
  kind: PaidActionFailureKind,
  overview: SubscriptionOverview | null | undefined,
): string {
  if (kind === "report_quota_exhausted") {
    return BILLING_PATHS.settings;
  }

  if (overview?.subscription) {
    return BILLING_PATHS.settings;
  }

  return BILLING_PATHS.onboarding;
}

export function resolvePaidActionErrorPath(
  error: unknown,
  overview?: SubscriptionOverview | null,
): string | null {
  const kind = getPaidActionFailureKind(error);
  if (!kind) {
    return null;
  }

  return resolvePaidActionFailurePath(kind, overview);
}

export function resolvePaidFeatureDestination(input: {
  overview: SubscriptionOverview | null | undefined;
  me?: AuthMeResponse | null;
  feature: PaidFeatureName;
  allowedPath: string;
}): string {
  if (!input.overview) {
    return input.allowedPath;
  }

  if (canUsePaidFeature(input.overview, input.feature, input.me)) {
    return input.allowedPath;
  }

  return resolvePaidActionFailurePath("subscription_required", input.overview);
}

export function resolveClassifiedBillingFailurePath(
  classified: Pick<ClassifiedBillingError, "kind" | "destination">,
  overview?: SubscriptionOverview | null,
): string | null {
  if (classified.kind === "invalid_session") {
    return "/login";
  }

  if (
    classified.kind === "subscription_required" ||
    classified.kind === "report_quota_exhausted"
  ) {
    return resolvePaidActionFailurePath(classified.kind, overview);
  }

  return classified.destination;
}
