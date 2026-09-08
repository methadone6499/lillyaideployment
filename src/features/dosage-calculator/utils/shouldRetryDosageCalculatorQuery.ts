import { DosageCalculatorApiError } from "../api/dosageCalculatorFetch";
import { isDosageCalculatorAbortError } from "./classifyDosageCalculatorError";

const MAX_TRANSPORT_RETRIES = 2;

function shouldRetryTransportFailure(
  failureCount: number,
  error: unknown,
): boolean {
  if (isDosageCalculatorAbortError(error)) {
    return false;
  }

  if (error instanceof DosageCalculatorApiError) {
    if (error.status === 503 || error.status < 500) {
      return false;
    }

    return failureCount < MAX_TRANSPORT_RETRIES;
  }

  return failureCount < MAX_TRANSPORT_RETRIES;
}

export function shouldRetryDosageCalculatorEnqueue(
  failureCount: number,
  error: unknown,
): boolean {
  return shouldRetryTransportFailure(failureCount, error);
}

export function shouldRetryDosageCalculatorStatusQuery(
  failureCount: number,
  error: unknown,
): boolean {
  return shouldRetryTransportFailure(failureCount, error);
}

export function shouldRetryDosageCalculatorResultQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (
    error instanceof DosageCalculatorApiError &&
    error.status === 409 &&
    failureCount < MAX_TRANSPORT_RETRIES
  ) {
    return true;
  }

  return shouldRetryTransportFailure(failureCount, error);
}
