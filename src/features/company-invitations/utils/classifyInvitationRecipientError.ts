import {
  AuthSessionError,
  AuthSessionUnavailableError,
} from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

export type InvitationRecipientErrorCode =
  | "invalid_or_expired_invitation"
  | "invitation_email_mismatch"
  | "account_already_exists"
  | "account_verification_required"
  | "seat_limit_reached"
  | "retryable"
  | "generic";

export type InvitationRecipientErrorState = {
  code: InvitationRecipientErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
};

const GENERIC_INVALID_MESSAGE =
  "This invitation link is invalid or has expired.";
const EMAIL_MISMATCH_MESSAGE =
  "This invitation was sent to a different email address. Sign in with the invited account.";
const ACCOUNT_EXISTS_MESSAGE =
  "An account with this email already exists. Sign in to accept the invitation.";
const VERIFICATION_REQUIRED_MESSAGE =
  "Verify your email before accepting this invitation.";
const SEAT_LIMIT_MESSAGE =
  "This company has no available seats. Contact the company administrator.";
const RETRYABLE_MESSAGE =
  "We could not process this invitation right now. Please try again in a moment.";
const GENERIC_MESSAGE = "Something went wrong. Please try again.";

const PUBLIC_TOKEN_GENERIC_CODES = new Set([
  "invalid_or_expired_invitation",
  "invalid_or_expired_token",
  "invitation_not_found",
  "invitation_not_pending",
]);

type ClassifyInvitationRecipientErrorOptions = {
  publicToken?: boolean;
};

export function classifyInvitationRecipientError(
  error: unknown,
  options: ClassifyInvitationRecipientErrorOptions = {},
): InvitationRecipientErrorState {
  if (
    error instanceof AuthSessionUnavailableError ||
    error instanceof TypeError
  ) {
    return { code: "retryable", message: RETRYABLE_MESSAGE };
  }

  if (error instanceof AuthSessionError) {
    return { code: "generic", message: GENERIC_MESSAGE };
  }

  if (!(error instanceof ApiRequestError)) {
    return { code: "generic", message: GENERIC_MESSAGE };
  }

  if (error.status >= 500) {
    return { code: "retryable", message: RETRYABLE_MESSAGE };
  }

  const fieldErrors =
    Object.keys(error.fieldErrors).length > 0
      ? error.fieldErrors
      : undefined;

  if (error.code === "invitation_email_mismatch") {
    return {
      code: "invitation_email_mismatch",
      message: error.message || EMAIL_MISMATCH_MESSAGE,
    };
  }

  if (error.code === "account_already_exists") {
    return {
      code: "account_already_exists",
      message: error.message || ACCOUNT_EXISTS_MESSAGE,
    };
  }

  if (error.code === "account_verification_required") {
    return {
      code: "account_verification_required",
      message: error.message || VERIFICATION_REQUIRED_MESSAGE,
    };
  }

  if (error.code === "seat_limit_reached") {
    return {
      code: "seat_limit_reached",
      message: error.message || SEAT_LIMIT_MESSAGE,
    };
  }

  if (
    error.code === "invalid_or_expired_invitation" ||
    PUBLIC_TOKEN_GENERIC_CODES.has(error.code ?? "")
  ) {
    return {
      code: "invalid_or_expired_invitation",
      message: GENERIC_INVALID_MESSAGE,
    };
  }

  if (options.publicToken && error.status < 500 && !fieldErrors) {
    return {
      code: "invalid_or_expired_invitation",
      message: GENERIC_INVALID_MESSAGE,
    };
  }

  if (fieldErrors) {
    return {
      code: "generic",
      message: error.message || GENERIC_MESSAGE,
      fieldErrors,
    };
  }

  return {
    code: "generic",
    message: error.message || GENERIC_MESSAGE,
  };
}
