import {
  AuthSessionError,
  AuthSessionUnavailableError,
} from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

export type InvitationErrorState = {
  message: string;
  fieldError?: string;
  retryAfterSeconds?: number;
};

const RETRYABLE_MESSAGE =
  "We could not update this invitation right now. Please try again in a moment.";
const GENERIC_MESSAGE = "Something went wrong. Please try again.";
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;

const ERROR_MESSAGES: Record<string, string> = {
  seat_limit_reached:
    "There are no available seats. Revoke a pending invitation or remove a seat, then try again.",
  invitation_resend_cooldown:
    "This invitation was sent recently. Please wait before resending.",
  invitation_not_found: "That invitation could not be found.",
  invitation_not_pending: "Only pending invitations can be updated.",
  invitation_already_pending: "An invitation for this email is already pending.",
  pending_invitation_exists: "An invitation for this email is already pending.",
  email_already_invited: "An invitation for this email is already pending.",
  member_already_exists: "This email already has a company seat.",
  already_a_member: "This email already has a company seat.",
  company_seats_not_enabled:
    "Company seats are not enabled for this workspace.",
  company_subscription_not_found:
    "No company subscription was found for this workspace.",
};

const EMAIL_FIELD_CODES = new Set([
  "invitation_already_pending",
  "pending_invitation_exists",
  "email_already_invited",
  "member_already_exists",
  "already_a_member",
]);

function formatResendCooldownMessage(seconds: number): string {
  if (seconds <= 1) {
    return "Please wait a moment before resending this invitation.";
  }

  if (seconds < 60) {
    return `Please wait ${seconds} seconds before resending this invitation.`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `Please wait ${minutes} minute${minutes === 1 ? "" : "s"} before resending this invitation.`;
}

function resolveRetryAfterSeconds(error: ApiRequestError): number | undefined {
  if (error.retryAfterSeconds != null && error.retryAfterSeconds >= 0) {
    return error.retryAfterSeconds;
  }

  if (error.status === 429 || error.code === "invitation_resend_cooldown") {
    return DEFAULT_RESEND_COOLDOWN_SECONDS;
  }

  return undefined;
}

export function classifyInvitationError(
  error: unknown,
): InvitationErrorState {
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

  const retryAfterSeconds = resolveRetryAfterSeconds(error);
  const mappedMessage = error.code ? ERROR_MESSAGES[error.code] : undefined;
  const fieldError = error.fieldErrors.email;

  if (error.status === 429 || error.code === "invitation_resend_cooldown") {
    return {
      message:
        error.message ||
        (retryAfterSeconds != null
          ? formatResendCooldownMessage(retryAfterSeconds)
          : ERROR_MESSAGES.invitation_resend_cooldown),
      retryAfterSeconds,
    };
  }

  if (fieldError) {
    return {
      message: error.message || fieldError,
      fieldError,
    };
  }

  if (error.code && EMAIL_FIELD_CODES.has(error.code)) {
    return {
      message: error.message || mappedMessage || GENERIC_MESSAGE,
      fieldError: error.message || mappedMessage,
    };
  }

  if (mappedMessage) {
    return { message: error.message || mappedMessage };
  }

  if (error.status === 403) {
    return {
      message:
        error.message || "You do not have permission to manage invitations.",
    };
  }

  if (error.status >= 500) {
    return { message: RETRYABLE_MESSAGE };
  }

  return { message: error.message || GENERIC_MESSAGE };
}
