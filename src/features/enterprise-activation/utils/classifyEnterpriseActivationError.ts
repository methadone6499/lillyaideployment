import {
  AuthSessionError,
  AuthSessionUnavailableError,
} from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

export type EnterpriseActivationErrorState = {
  message: string;
  fieldError?: string;
};

const RETRYABLE_MESSAGE =
  "We could not activate Enterprise right now. Please try again in a moment.";
const GENERIC_MESSAGE = "Something went wrong. Please try again.";
const ACTIVE_ACCESS_EXISTS_MESSAGE =
  "This account already has an active subscription or company workspace.";
const ACTIVATION_INCOMPLETE_MESSAGE =
  "Enterprise activation did not finish. Please try again.";
const ACTIVATION_NOT_ALLOWED_MESSAGE =
  "Enterprise activation is not available for this account.";

export function classifyEnterpriseActivationError(
  error: unknown,
): EnterpriseActivationErrorState {
  if (
    error instanceof AuthSessionUnavailableError ||
    error instanceof TypeError
  ) {
    return { message: RETRYABLE_MESSAGE };
  }

  if (error instanceof AuthSessionError) {
    return { message: GENERIC_MESSAGE };
  }

  if (!(error instanceof ApiRequestError)) {
    return { message: GENERIC_MESSAGE };
  }

  if (error.code === "active_access_exists") {
    return { message: error.message || ACTIVE_ACCESS_EXISTS_MESSAGE };
  }

  if (error.code === "enterprise_activation_incomplete") {
    return { message: error.message || ACTIVATION_INCOMPLETE_MESSAGE };
  }

  if (error.code === "enterprise_activation_not_allowed") {
    return { message: error.message || ACTIVATION_NOT_ALLOWED_MESSAGE };
  }

  if (error.status >= 500) {
    return { message: RETRYABLE_MESSAGE };
  }

  const fieldError = error.fieldErrors.company_name;

  if (fieldError) {
    return {
      message: error.message,
      fieldError,
    };
  }

  if (error.status === 409) {
    return { message: error.message || ACTIVE_ACCESS_EXISTS_MESSAGE };
  }

  return { message: error.message || GENERIC_MESSAGE };
}
