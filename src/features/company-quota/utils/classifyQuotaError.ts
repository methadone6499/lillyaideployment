import {
  AuthSessionError,
  AuthSessionUnavailableError,
} from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

const RETRYABLE_MESSAGE =
  "We could not update this quota right now. Please try again in a moment.";
const GENERIC_MESSAGE = "Something went wrong. Please try again.";

const ERROR_MESSAGES: Record<string, string> = {
  quota_below_usage:
    "Quota cannot be set below reports already used on this seat.",
  quota_pool_exceeded:
    "This allocation exceeds the available company quota pool.",
  insufficient_reassignable_quota:
    "There is not enough reassignable quota to make this change.",
  quota_target_not_found: "That seat could not be found.",
  quota_target_removed: "That seat has already been removed.",
  company_quota_unavailable:
    "Company quota is not available for this workspace.",
};

export function classifyQuotaMutationError(error: unknown): string {
  if (
    error instanceof AuthSessionUnavailableError ||
    error instanceof TypeError
  ) {
    return RETRYABLE_MESSAGE;
  }

  if (error instanceof AuthSessionError) {
    return GENERIC_MESSAGE;
  }

  if (!(error instanceof ApiRequestError)) {
    return GENERIC_MESSAGE;
  }

  if (error.code && ERROR_MESSAGES[error.code]) {
    return error.message || ERROR_MESSAGES[error.code];
  }

  if (error.status === 403) {
    return error.message || "You do not have permission to manage quota.";
  }

  if (error.status >= 500) {
    return RETRYABLE_MESSAGE;
  }

  return error.message || GENERIC_MESSAGE;
}

export function classifyQuotaQueryError(
  error: unknown,
  resource: "company" | "own",
): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) {
      return resource === "company"
        ? "You do not have permission to view company quota."
        : "You do not have permission to view your report quota.";
    }

    return (
      error.message ||
      (resource === "company"
        ? "Unable to load company quota. Please try again."
        : "Unable to load report quota. Please try again.")
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return resource === "company"
    ? "Unable to load company quota. Please try again."
    : "Unable to load report quota. Please try again.";
}
