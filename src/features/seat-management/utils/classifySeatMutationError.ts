import {
  AuthSessionError,
  AuthSessionUnavailableError,
} from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

const RETRYABLE_MESSAGE =
  "We could not update this seat right now. Please try again in a moment.";
const GENERIC_MESSAGE = "Something went wrong. Please try again.";

const ERROR_MESSAGES: Record<string, string> = {
  seat_not_found: "That seat could not be found.",
  company_admin_seat_protected:
    "The company admin seat cannot be disabled or removed.",
  seat_removed: "That seat has already been removed.",
  seat_user_unavailable: "That seat user is no longer available.",
  company_seats_not_enabled:
    "Company seats are not enabled for this workspace.",
  company_subscription_not_found:
    "No company subscription was found for this workspace.",
};

export function classifySeatMutationError(error: unknown): string {
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
    return error.message || "You do not have permission to manage this seat.";
  }

  if (error.status >= 500) {
    return RETRYABLE_MESSAGE;
  }

  return error.message || GENERIC_MESSAGE;
}
