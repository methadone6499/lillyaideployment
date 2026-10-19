import { AuthSessionError, AuthSessionUnavailableError } from "@/features/auth";
import { ReportApiError } from "../api/reportApiError";

const REPORT_ERROR_MESSAGES: Record<string, string> = {
  stale_revision: "This section changed since you opened it. Refresh the document and try again.",
  inactive_section: "This section is no longer part of the current report. Refresh the report to continue.",
  report_not_editable: "This report cannot be edited in its current status. Refresh the report to check its latest status.",
  section_not_ready: "This section is still being prepared. Wait a moment, then try again.",
};

export function getReportRequestErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AuthSessionError) return "Your session has expired. Sign in again to continue.";
  if (error instanceof AuthSessionUnavailableError || error instanceof TypeError) {
    return "We could not reach the service. Check your connection and try again.";
  }
  if (error instanceof ReportApiError) {
    if (error.status === 401) return "Your session has expired. Sign in again to continue.";
    if (error.status === 403) return "You do not have permission to perform this action.";
    if (error.status === 429) return "Too many requests. Wait a moment, then try again.";
    if (error.status === 408 || error.status === 504) return "The request took too long to respond. Try again in a moment.";
    if (error.code && REPORT_ERROR_MESSAGES[error.code]) return REPORT_ERROR_MESSAGES[error.code];
  }
  return fallback;
}
