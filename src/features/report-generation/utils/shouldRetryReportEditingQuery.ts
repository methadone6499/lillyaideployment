import { ReportApiError } from "../api/reportApiError";

export function shouldRetryReportEditingQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (
    error instanceof ReportApiError &&
    (error.status === 409 || error.status === 422)
  ) {
    return false;
  }

  return failureCount < 2;
}
