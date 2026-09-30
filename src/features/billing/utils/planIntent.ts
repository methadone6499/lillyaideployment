import {
  planIntentSchema,
  type PlanIntent,
  type SubscriptionOverview,
} from "../schemas/billingSchemas";
import { BILLING_PATHS } from "./billingConstants";
import { hasReconciledPaidSubscription } from "./selectBillingCapabilities";

const PLAN_INTENT_STORAGE_KEY = "lillyai.plan-intent";

export const PLAN_INTENT_QUERY_PARAM = "plan";

export function sanitizePlanIntent(value: unknown): PlanIntent | null {
  const parsed = planIntentSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function sanitizePlanIntentParam(
  value: string | string[] | undefined | null,
): PlanIntent | null {
  if (Array.isArray(value)) {
    return sanitizePlanIntent(value[0]);
  }

  return sanitizePlanIntent(value);
}

export function storePlanIntent(value: unknown): PlanIntent | null {
  const intent = sanitizePlanIntent(value);

  if (typeof window === "undefined" || !intent) {
    return intent;
  }

  sessionStorage.setItem(PLAN_INTENT_STORAGE_KEY, intent);
  return intent;
}

export function readPlanIntent(): PlanIntent | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = sessionStorage.getItem(PLAN_INTENT_STORAGE_KEY);
  const intent = sanitizePlanIntent(stored);

  if (stored !== null && intent === null) {
    sessionStorage.removeItem(PLAN_INTENT_STORAGE_KEY);
  }

  return intent;
}

export function clearPlanIntent(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(PLAN_INTENT_STORAGE_KEY);
}

export function syncPlanIntentWithOverview(
  overview: SubscriptionOverview,
): void {
  if (hasReconciledPaidSubscription(overview)) {
    clearPlanIntent();
  }
}

export function buildSignupPlanPath(plan: PlanIntent): string {
  return `/signup?${PLAN_INTENT_QUERY_PARAM}=${plan}`;
}

export function resolvePricingPlanHref(plan: unknown): string {
  const intent = sanitizePlanIntent(plan);

  if (intent === "standard" || intent === "enterprise") {
    return buildSignupPlanPath(intent);
  }

  return BILLING_PATHS.customInquiry;
}
