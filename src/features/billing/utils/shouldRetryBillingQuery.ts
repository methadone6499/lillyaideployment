import {
  BILLING_MAX_MUTATION_PROVIDER_FAILURES,
  BILLING_MAX_PROVIDER_FAILURES,
  BILLING_MAX_QUERY_FAILURES,
  BILLING_MAX_RETRY_DELAY_MS,
  BILLING_RECONCILIATION_BACKOFF_MS,
} from "./billingConstants";
import { classifyBillingError } from "./classifyBillingError";
import { isBillingAbortError } from "./isBillingAbortError";

function retryAfterDelayMs(error: unknown): number | null {
  const classified = classifyBillingError(error);

  if (classified.retryAfterSeconds == null || classified.retryAfterSeconds < 0) {
    return null;
  }

  return classified.retryAfterSeconds * 1000;
}

export function shouldRetryBillingQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (isBillingAbortError(error)) {
    return false;
  }

  const classified = classifyBillingError(error);

  if (!classified.retryable) {
    return false;
  }

  if (classified.kind === "billing_provider_unavailable") {
    return failureCount < BILLING_MAX_PROVIDER_FAILURES;
  }

  return failureCount < BILLING_MAX_QUERY_FAILURES;
}

export function shouldRetryBillingMutation(
  failureCount: number,
  error: unknown,
): boolean {
  if (isBillingAbortError(error)) {
    return false;
  }

  const classified = classifyBillingError(error);

  if (!classified.retryable) {
    return false;
  }

  if (classified.kind !== "billing_provider_unavailable") {
    return false;
  }

  return failureCount < BILLING_MAX_MUTATION_PROVIDER_FAILURES;
}

export function getBillingRetryDelay(
  failureCount: number,
  error: unknown,
): number {
  const retryAfterMs = retryAfterDelayMs(error);

  if (retryAfterMs != null) {
    return retryAfterMs;
  }

  return Math.min(
    BILLING_RECONCILIATION_BACKOFF_MS * 2 ** failureCount,
    BILLING_MAX_RETRY_DELAY_MS,
  );
}

export function getBillingErrorRefetchIntervalMs(error: unknown): number | false {
  if (isBillingAbortError(error)) {
    return false;
  }

  const classified = classifyBillingError(error);

  if (!classified.pollOverview && !classified.retryable) {
    return false;
  }

  const retryAfterMs = retryAfterDelayMs(error);
  return retryAfterMs ?? BILLING_RECONCILIATION_BACKOFF_MS;
}
