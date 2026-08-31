import {
  AuthSessionError,
  AuthSessionUnavailableError,
} from "@/features/auth";

import { DosageCalculatorApiError } from "../api/dosageCalculatorFetch";
import type {
  DosageCalculatorJobPhase,
  DosageCalculatorStatusResponse,
} from "../schemas/dosageCalculatorSchemas";

export type DosageCalculatorErrorKind =
  | "worker_unavailable"
  | "still_processing"
  | "job_not_found"
  | "job_failed"
  | "generic";

export type DosageCalculatorErrorState = {
  kind: DosageCalculatorErrorKind;
  message: string;
  retryable: boolean;
};

const WORKER_UNAVAILABLE_MESSAGE =
  "The calculation service is unavailable right now. Try again in a moment.";
const STILL_PROCESSING_MESSAGE =
  "This calculation is still processing. Wait for it to finish, then try again.";
const JOB_NOT_FOUND_MESSAGE =
  "This calculation could not be found. Start a new calculation.";
const JOB_FAILED_MESSAGE = "The calculation failed. Try again.";
const NETWORK_MESSAGE =
  "We could not reach the calculation service. Check your connection and try again.";
const GENERIC_MESSAGE = "Something went wrong. Please try again.";

export class DosageCalculatorJobFailedError extends Error {
  readonly jobId: string;
  readonly phase: DosageCalculatorJobPhase;

  constructor(status: DosageCalculatorStatusResponse) {
    super(status.error?.trim() || JOB_FAILED_MESSAGE);
    this.name = "DosageCalculatorJobFailedError";
    this.jobId = status.job_id;
    this.phase = status.phase;
  }
}

export function isDosageCalculatorAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  return error instanceof Error && error.name === "AbortError";
}

export function getDosageCalculatorFailedJobError(
  status: DosageCalculatorStatusResponse | undefined,
): DosageCalculatorJobFailedError | null {
  if (!status || status.job_status !== "failed") {
    return null;
  }

  return new DosageCalculatorJobFailedError(status);
}

export function classifyDosageCalculatorError(
  error: unknown,
): DosageCalculatorErrorState | null {
  if (error == null || isDosageCalculatorAbortError(error)) {
    return null;
  }

  if (error instanceof DosageCalculatorJobFailedError) {
    return {
      kind: "job_failed",
      message: error.message || JOB_FAILED_MESSAGE,
      retryable: true,
    };
  }

  if (error instanceof DosageCalculatorApiError) {
    if (error.status === 503) {
      return {
        kind: "worker_unavailable",
        message: WORKER_UNAVAILABLE_MESSAGE,
        retryable: true,
      };
    }

    if (error.status === 409) {
      return {
        kind: "still_processing",
        message: STILL_PROCESSING_MESSAGE,
        retryable: false,
      };
    }

    if (error.status === 404) {
      return {
        kind: "job_not_found",
        message: JOB_NOT_FOUND_MESSAGE,
        retryable: false,
      };
    }

    return {
      kind: "generic",
      message: error.message.trim() || GENERIC_MESSAGE,
      retryable: error.status >= 500,
    };
  }

  if (error instanceof AuthSessionUnavailableError || error instanceof TypeError) {
    return {
      kind: "generic",
      message: NETWORK_MESSAGE,
      retryable: true,
    };
  }

  if (error instanceof AuthSessionError) {
    return {
      kind: "generic",
      message: GENERIC_MESSAGE,
      retryable: false,
    };
  }

  if (error instanceof Error && error.message.trim()) {
    return {
      kind: "generic",
      message: error.message,
      retryable: true,
    };
  }

  return {
    kind: "generic",
    message: GENERIC_MESSAGE,
    retryable: true,
  };
}
