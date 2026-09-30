import { getActiveContext, type AuthMeResponse } from "@/features/auth";

import type { SubscriptionOverview } from "../schemas/billingSchemas";
import { BILLING_RECONCILIATION_BACKOFF_MS } from "./billingConstants";
import {
  classifyBillingError,
  isTerminalClassifiedBillingError,
} from "./classifyBillingError";
import { isBillingAbortError } from "./isBillingAbortError";
import {
  isBillingReconciliationReady,
  shouldRefetchAuthAfterBilling,
  shouldStopBillingReconciliation,
} from "./selectBillingCapabilities";
import {
  getBillingOverviewPollInterval,
  getHostedInvoiceUrl,
  getResumableCheckoutUrl,
} from "./selectBillingOverviewUi";
import { getBillingErrorRefetchIntervalMs } from "./shouldRetryBillingQuery";

export type BillingReconciliationUiState =
  | {
      kind: "reconciled";
      overview: SubscriptionOverview;
    }
  | {
      kind: "processing";
      checkoutUrl: string | null;
      hostedInvoiceUrl: string | null;
    }
  | {
      kind: "timeout";
      checkoutUrl: string | null;
      hostedInvoiceUrl: string | null;
      overview: SubscriptionOverview | undefined;
      requestId: string | null;
    }
  | {
      kind: "terminal";
      message: string;
      requestId: string | null;
    };

function classifyPresentError(error: unknown) {
  if (!error || isBillingAbortError(error)) {
    return null;
  }

  return classifyBillingError(error);
}

export function selectBillingReconciliationError(input: {
  overviewError: unknown;
  authError: unknown;
}): unknown {
  const overviewClassified = classifyPresentError(input.overviewError);
  const authClassified = classifyPresentError(input.authError);

  if (
    overviewClassified &&
    isTerminalClassifiedBillingError(overviewClassified)
  ) {
    return input.overviewError;
  }

  if (authClassified && isTerminalClassifiedBillingError(authClassified)) {
    return input.authError;
  }

  return input.overviewError ?? input.authError;
}

export function selectBillingReconciliationUiState(input: {
  overview: SubscriptionOverview | undefined;
  error: unknown;
  timedOut: boolean;
  me?: AuthMeResponse | null;
}): BillingReconciliationUiState {
  const checkoutUrl = getResumableCheckoutUrl(input.overview?.checkout);
  const hostedInvoiceUrl = getHostedInvoiceUrl(input.overview?.plan_change);
  const classified = classifyPresentError(input.error);

  if (classified && isTerminalClassifiedBillingError(classified)) {
    return {
      kind: "terminal",
      message: classified.message,
      requestId: classified.requestId,
    };
  }

  if (
    input.overview &&
    isBillingReconciliationReady(input.overview, input.me)
  ) {
    return {
      kind: "reconciled",
      overview: input.overview,
    };
  }

  if (input.timedOut) {
    return {
      kind: "timeout",
      checkoutUrl,
      hostedInvoiceUrl,
      overview: input.overview,
      requestId: classified?.requestId ?? null,
    };
  }

  return {
    kind: "processing",
    checkoutUrl,
    hostedInvoiceUrl,
  };
}

export function getSubscriptionReconciliationOverviewInterval(input: {
  enabled: boolean;
  timedOut: boolean;
  overview: SubscriptionOverview | undefined;
  error: unknown;
  me?: AuthMeResponse | null;
}): number | false {
  if (!input.enabled || input.timedOut) {
    return false;
  }

  if (
    input.overview &&
    shouldStopBillingReconciliation(input.overview, input.me)
  ) {
    return false;
  }

  if (input.error) {
    return getBillingErrorRefetchIntervalMs(input.error);
  }

  const pendingInterval = getBillingOverviewPollInterval(input.overview);
  if (pendingInterval !== false) {
    return pendingInterval;
  }

  return BILLING_RECONCILIATION_BACKOFF_MS;
}

export function shouldEnableEnterpriseAuthReconciliation(input: {
  enabled: boolean;
  timedOut: boolean;
  overview: SubscriptionOverview | undefined;
  me?: AuthMeResponse | null;
}): boolean {
  if (!input.enabled || input.timedOut || !input.overview) {
    return false;
  }

  return shouldRefetchAuthAfterBilling(input.overview, input.me);
}

export function getEnterpriseAuthReconciliationInterval(input: {
  timedOut: boolean;
  me?: AuthMeResponse | null;
  error?: unknown;
}): number | false {
  if (input.timedOut) {
    return false;
  }

  if (getActiveContext(input.me)?.type === "company") {
    return false;
  }

  const classified = classifyPresentError(input.error);
  if (classified && !classified.retryable) {
    return false;
  }

  return BILLING_RECONCILIATION_BACKOFF_MS;
}
