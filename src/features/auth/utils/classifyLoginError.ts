import { ApiRequestError } from "@/services/ApiRequestError";

import { AuthSessionUnavailableError } from "../session/authSessionErrors";
import { isCompanyAccessClosedSessionCode } from "../session/closedSessionAuthError";

export type LoginErrorState =
  | { type: "none" }
  | { type: "invalid_credentials"; message: string }
  | { type: "email_not_verified"; email: string; message: string }
  | { type: "account_disabled"; message: string }
  | { type: "retryable"; message: string }
  | { type: "form"; message: string; fieldErrors?: Record<string, string> };

const INVALID_CREDENTIALS_MESSAGE =
  "The email or password you entered is incorrect.";
const ACCOUNT_DISABLED_MESSAGE =
  "This account has been disabled. Contact support if you need help.";
const COMPANY_ACCESS_DISABLED_MESSAGE =
  "Your company access has been disabled. Contact your company administrator.";
const COMPANY_ACCESS_UNAVAILABLE_MESSAGE =
  "Company access is currently unavailable. Contact your company administrator.";
const EMAIL_NOT_VERIFIED_MESSAGE =
  "Your email address has not been verified yet. Check your inbox or resend the verification email.";
const RETRYABLE_MESSAGE =
  "We could not sign you in right now. Please try again in a moment.";

export function classifyLoginError(
  error: unknown,
  submittedEmail: string,
): LoginErrorState {
  if (error instanceof AuthSessionUnavailableError) {
    return { type: "retryable", message: RETRYABLE_MESSAGE };
  }

  if (error instanceof ApiRequestError) {
    if (error.code === "email_not_verified") {
      return {
        type: "email_not_verified",
        email: submittedEmail,
        message: error.message || EMAIL_NOT_VERIFIED_MESSAGE,
      };
    }

    if (error.code === "account_disabled") {
      return {
        type: "account_disabled",
        message: error.message || ACCOUNT_DISABLED_MESSAGE,
      };
    }

    if (isCompanyAccessClosedSessionCode(error.code)) {
      return {
        type: "account_disabled",
        message:
          error.code === "company_access_disabled"
            ? error.message || COMPANY_ACCESS_DISABLED_MESSAGE
            : error.message || COMPANY_ACCESS_UNAVAILABLE_MESSAGE,
      };
    }

    if (
      error.status === 401 ||
      error.code === "invalid_credentials" ||
      error.code === "authentication_failed"
    ) {
      return {
        type: "invalid_credentials",
        message: error.message || INVALID_CREDENTIALS_MESSAGE,
      };
    }

    if (error.status >= 500) {
      return { type: "retryable", message: RETRYABLE_MESSAGE };
    }

    if (Object.keys(error.fieldErrors).length > 0) {
      return {
        type: "form",
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }

    return { type: "form", message: error.message };
  }

  if (error instanceof TypeError) {
    return { type: "retryable", message: RETRYABLE_MESSAGE };
  }

  return { type: "form", message: "Something went wrong. Please try again." };
}
