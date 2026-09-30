import { isBillingAbortError } from "@/features/billing";
import { ApiRequestError } from "@/services/ApiRequestError";

const MAX_QUERY_RETRIES = 1;
const MAX_MUTATION_PROVIDER_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 1_500;
const MAX_RETRY_DELAY_MS = 30_000;

export function shouldRetryCustomSubscriptionQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (isBillingAbortError(error)) {
    return false;
  }

  if (error instanceof ApiRequestError && error.status < 500) {
    return false;
  }

  return failureCount < MAX_QUERY_RETRIES;
}

/**
 * Only a provider outage is retried automatically; every other failure is
 * surfaced so the user can decide (revisioned writes must never be replayed).
 */
export function shouldRetryCustomSubscriptionMutation(
  failureCount: number,
  error: unknown,
): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 503 &&
    error.code === "billing_provider_unavailable" &&
    failureCount < MAX_MUTATION_PROVIDER_RETRIES
  );
}

export function getCustomSubscriptionRetryDelay(
  failureCount: number,
  error: unknown,
): number {
  if (
    error instanceof ApiRequestError &&
    error.retryAfterSeconds != null &&
    error.retryAfterSeconds >= 0
  ) {
    return Math.min(error.retryAfterSeconds * 1000, MAX_RETRY_DELAY_MS);
  }

  return Math.min(DEFAULT_RETRY_DELAY_MS * 2 ** failureCount, MAX_RETRY_DELAY_MS);
}
