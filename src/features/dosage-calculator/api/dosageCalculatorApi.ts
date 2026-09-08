import {
  dosageCalculatorEnqueueResponseSchema,
  dosageCalculatorRequestSchema,
  dosageCalculatorResultSchema,
  dosageCalculatorStatusResponseSchema,
  type DosageCalculatorEnqueueResponse,
  type DosageCalculatorRequest,
  type DosageCalculatorResult,
  type DosageCalculatorStatusResponse,
} from "../schemas/dosageCalculatorSchemas";
import { pinDosageIdempotencyKey } from "../utils/mapDosageCalculatorRequest";
import { dosageCalculatorFetch } from "./dosageCalculatorFetch";

export const DOSAGE_CALCULATOR_API_ROOT = "/dosage-calculator";
export const DOSAGE_CALCULATOR_STATUS_POLL_INTERVAL_MS = 4_000;

function requireJobId(jobId: string): string {
  const trimmed = jobId.trim();
  if (!trimmed) {
    throw new Error("Dosage calculator job id is required.");
  }

  return trimmed;
}

export function getDosageCalculatorStatusPath(jobId: string): string {
  return `${DOSAGE_CALCULATOR_API_ROOT}/${encodeURIComponent(requireJobId(jobId))}`;
}

export function getDosageCalculatorResultPath(jobId: string): string {
  return `${getDosageCalculatorStatusPath(jobId)}/result`;
}

export async function enqueueDosageCalculation(
  input: DosageCalculatorRequest,
  signal?: AbortSignal,
): Promise<DosageCalculatorEnqueueResponse> {
  const body = dosageCalculatorRequestSchema.parse(
    pinDosageIdempotencyKey(input),
  );

  return dosageCalculatorFetch(DOSAGE_CALCULATOR_API_ROOT, {
    method: "POST",
    body,
    schema: dosageCalculatorEnqueueResponseSchema,
    signal,
  });
}

export async function fetchDosageCalculationStatus(
  jobId: string,
  signal?: AbortSignal,
): Promise<DosageCalculatorStatusResponse> {
  return dosageCalculatorFetch(getDosageCalculatorStatusPath(jobId), {
    schema: dosageCalculatorStatusResponseSchema,
    signal,
  });
}

/**
 * Structured JSON result, including `markdown`. The optional `text/plain`
 * markdown endpoint is intentionally unused so the AI transport stays JSON-only.
 */
export async function fetchDosageCalculationResult(
  jobId: string,
  signal?: AbortSignal,
): Promise<DosageCalculatorResult> {
  return dosageCalculatorFetch(getDosageCalculatorResultPath(jobId), {
    schema: dosageCalculatorResultSchema,
    signal,
  });
}
