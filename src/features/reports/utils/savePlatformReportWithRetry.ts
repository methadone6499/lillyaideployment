import { AuthSessionUnavailableError } from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import { createPlatformReport } from "../api/platformReportApi";
import type { CreateReportInput, Report } from "../schemas/platformReportSchemas";

const RETRY_DELAYS_MS = [1_000, 2_000, 4_000] as const;

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : new Error("Aborted"));
      return;
    }

    const timeoutId = setTimeout(() => resolve(), ms);

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeoutId);
        reject(signal.reason instanceof Error ? signal.reason : new Error("Aborted"));
      },
      { once: true },
    );
  });
}

function isRetryablePlatformSaveError(error: unknown): boolean {
  if (error instanceof ApiRequestError) {
    if (error.status === 409 || error.status === 422) {
      return false;
    }

    return error.status >= 500;
  }

  if (error instanceof AuthSessionUnavailableError) {
    return true;
  }

  // Network / fetch failures (e.g. TypeError: Failed to fetch)
  if (error instanceof TypeError) {
    return true;
  }

  return false;
}

/**
 * Persists Platform report metadata with bounded retries.
 * Never re-calls Report Service generate — only POST /api/v1/reports.
 *
 * Retries network failures and retryable 5xx with delays 1s → 2s → 4s.
 * Does not retry 409 or 422.
 */
export async function savePlatformReportWithRetry(
  input: CreateReportInput,
  signal?: AbortSignal,
): Promise<Report> {
  let attempt = 0;

  while (true) {
    try {
      return await createPlatformReport(input, signal);
    } catch (error) {
      const delayMs = RETRY_DELAYS_MS[attempt];
      if (delayMs === undefined || !isRetryablePlatformSaveError(error)) {
        throw error;
      }

      attempt += 1;
      await delay(delayMs, signal);
    }
  }
}
