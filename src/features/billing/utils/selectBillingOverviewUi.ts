import type { AuthMeResponse } from "@/features/auth";

import type {
  CheckoutState,
  PlanChangeState,
  SubscriptionOverview,
  SubscriptionSummary,
} from "../schemas/billingSchemas";
import { BILLING_RECONCILIATION_BACKOFF_MS } from "./billingConstants";
import { isSuperAdminContext } from "./selectBillingCapabilities";

export type BillingOverviewUiKind =
  | "subscription"
  | "plan_change"
  | "checkout"
  | "picker";

export type BillingSettingsKind = "super_admin" | BillingOverviewUiKind;

export type BillingOverviewUiState =
  | {
      kind: "subscription";
      subscription: SubscriptionSummary;
      planChange: PlanChangeState | null;
      checkout: CheckoutState | null;
    }
  | {
      kind: "plan_change";
      planChange: PlanChangeState;
    }
  | {
      kind: "checkout";
      checkout: CheckoutState;
    }
  | {
      kind: "picker";
    };

export type CheckoutActionState = "creating" | "resume" | "payment_pending";

export function selectBillingOverviewUiKind(
  overview: SubscriptionOverview,
): BillingOverviewUiKind {
  if (overview.subscription) {
    return "subscription";
  }

  if (overview.plan_change) {
    return "plan_change";
  }

  if (overview.checkout) {
    return "checkout";
  }

  return "picker";
}

export function selectBillingSettingsKind(
  overview: SubscriptionOverview,
  me?: AuthMeResponse | null,
): BillingSettingsKind {
  if (isSuperAdminContext(me)) {
    return "super_admin";
  }

  return selectBillingOverviewUiKind(overview);
}

export function selectBillingOverviewUiState(
  overview: SubscriptionOverview,
): BillingOverviewUiState {
  if (overview.subscription) {
    return {
      kind: "subscription",
      subscription: overview.subscription,
      planChange: overview.plan_change,
      checkout: overview.checkout,
    };
  }

  if (overview.plan_change) {
    return {
      kind: "plan_change",
      planChange: overview.plan_change,
    };
  }

  if (overview.checkout) {
    return {
      kind: "checkout",
      checkout: overview.checkout,
    };
  }

  return { kind: "picker" };
}

export function selectCheckoutActionState(
  checkout: CheckoutState,
): CheckoutActionState {
  if (checkout.status === "creating") {
    return "creating";
  }

  if (checkout.status === "payment_pending") {
    return "payment_pending";
  }

  return "resume";
}

export function getResumableCheckoutUrl(
  checkout: CheckoutState | null | undefined,
): string | null {
  if (!checkout?.checkout_url) {
    return null;
  }

  if (checkout.status === "open" || checkout.status === "payment_pending") {
    return checkout.checkout_url;
  }

  return null;
}

export function getHostedInvoiceUrl(
  planChange: PlanChangeState | null | undefined,
): string | null {
  return planChange?.hosted_invoice_url ?? null;
}

export const SUBSCRIPTION_OVERVIEW_DEFAULT_REFETCH_INTERVAL = false;
export const SUBSCRIPTION_OVERVIEW_REFETCH_INTERVAL_IN_BACKGROUND = false;

export type SubscriptionOverviewRefetchInterval =
  | number
  | false
  | ((query: {
      state: {
        data: SubscriptionOverview | undefined;
        error: unknown;
      };
    }) => number | false | undefined);

export function resolveSubscriptionOverviewRefetchInterval(
  configured: SubscriptionOverviewRefetchInterval | undefined,
  query: {
    state: {
      data: SubscriptionOverview | undefined;
      error: unknown;
    };
  },
): number | false {
  if (configured === undefined) {
    return SUBSCRIPTION_OVERVIEW_DEFAULT_REFETCH_INTERVAL;
  }

  if (typeof configured === "function") {
    return configured(query) ?? false;
  }

  return configured;
}

export function getBillingOverviewPollInterval(
  overview: SubscriptionOverview | undefined,
): number | false {
  if (!overview) {
    return false;
  }

  if (overview.checkout?.status === "creating") {
    return BILLING_RECONCILIATION_BACKOFF_MS;
  }

  if (overview.checkout?.status === "payment_pending") {
    return BILLING_RECONCILIATION_BACKOFF_MS;
  }

  if (
    overview.plan_change?.status === "requested" ||
    overview.plan_change?.status === "payment_pending"
  ) {
    return BILLING_RECONCILIATION_BACKOFF_MS;
  }

  return false;
}
