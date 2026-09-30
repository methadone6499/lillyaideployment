import { ApiRequestError, type FieldErrors } from "@/services/ApiRequestError";

export type ReviewerError = {
  code: string;
  message: string;
  fieldErrors: FieldErrors;
  requestId: string | null;
  retryAfterSeconds: number | null;
  retryable: boolean;
};

const MESSAGES: Record<string, string> = {
  permission_denied: "You do not have permission to perform this action.",
  reviewer_access_disabled:
    "Your reviewer access has been suspended. Contact a platform administrator.",
  reviewer_recipient_ineligible:
    "This email address cannot be used for a reviewer account.",
  reviewer_invitation_already_pending:
    "A pending invitation already exists for this reviewer.",
  reviewer_invitation_not_found: "This reviewer invitation no longer exists.",
  reviewer_invitation_not_pending:
    "This reviewer invitation is no longer pending.",
  invalid_or_expired_reviewer_invitation:
    "This reviewer invitation link is invalid or has expired.",
  reviewer_invitation_resend_cooldown:
    "Please wait before resending this invitation.",
  account_already_exists:
    "An account already exists for this email address. Contact an administrator.",
  reviewer_not_found: "This reviewer could not be found.",
  reviewer_not_registered:
    "This reviewer has not registered their account yet.",
  reviewer_status_conflict:
    "The reviewer status changed. Refresh and try again.",
  review_submission_not_enabled:
    "Your company plan does not include reviewer submission.",
  report_not_ready_for_review:
    "This report must finish generating and remain unarchived before review.",
  report_locked_for_review:
    "This report is locked for review and can no longer be edited.",
  report_submission_conflict:
    "The report review state changed. Refresh and try again.",
  review_assignment_not_found:
    "This review assignment could not be found.",
  invalid_review_assignment_transition:
    "This action is no longer available for the assignment.",
  review_assignment_conflict:
    "The assignment changed. Refresh and try again.",
  reviewer_assignment_settings_conflict:
    "Another administrator changed these settings. Review the latest values and reapply your changes.",
  report_not_awaiting_assignment:
    "This report is no longer waiting for a reviewer.",
  reviewer_assignment_ineligible:
    "The selected reviewer is not currently eligible for this assignment.",
  no_eligible_reviewer:
    "No eligible reviewer is currently available.",
  review_notes_not_editable:
    "These notes are no longer editable. The latest review state has been loaded.",
  review_notes_not_available:
    "Review notes will be available after the first completed review cycle.",
  review_note_version_conflict:
    "This note changed since you opened it. Review the latest version before saving again.",
  validation_error: "Please correct the highlighted fields and try again.",
  invalid_cursor: "The list changed. Loading the first page again.",
};

export function classifyReviewerError(error: unknown): ReviewerError {
  if (error instanceof ApiRequestError) {
    const code = error.code ?? "request_failed";
    return {
      code,
      message:
        MESSAGES[code] ||
        error.message ||
        "Something went wrong. Please try again.",
      fieldErrors: error.fieldErrors,
      requestId: error.requestId,
      retryAfterSeconds: error.retryAfterSeconds,
      retryable: error.status >= 500 || error.status === 429,
    };
  }

  return {
    code: "request_failed",
    message:
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.",
    fieldErrors: {},
    requestId: null,
    retryAfterSeconds: null,
    retryable: true,
  };
}
