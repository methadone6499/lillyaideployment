import {
  AuthSessionError,
  AuthSessionUnavailableError,
} from "@/features/auth";
import { isBillingAbortError } from "@/features/billing";
import { ApiRequestError, type FieldErrors } from "@/services/ApiRequestError";
import { ZodError } from "zod";

import {
  seatsExceedOfferDetailsSchema,
  type SeatsExceedOfferDetails,
} from "../schemas/customSubscriptionSchemas";

export type CustomSubscriptionErrorAction =
  | "none"
  | "refetch"
  | "retry_later"
  | "daily_limit"
  | "open_seats"
  | "open_portal"
  | "open_billing"
  | "poll_activation"
  | "request_changes"
  | "republish"
  | "reset_list"
  | "contact_support"
  | "sign_in";

export type ClassifiedCustomSubscriptionError = {
  kind: string;
  message: string;
  action: CustomSubscriptionErrorAction;
  fieldErrors: FieldErrors;
  requestId: string | null;
  retryAfterSeconds: number | null;
  retryable: boolean;
  refetch: boolean;
  showRequestId: boolean;
  seatsExceed: SeatsExceedOfferDetails | null;
};

type ErrorRule = {
  message: string;
  action: CustomSubscriptionErrorAction;
  refetch?: boolean;
  retryable?: boolean;
  showRequestId?: boolean;
};

const GENERIC_MESSAGE = "Something went wrong. Please try again.";
const RETRYABLE_MESSAGE =
  "We could not reach the server. Please try again in a moment.";
const SESSION_MESSAGE = "Your session has expired. Please sign in again.";
const VALIDATION_MESSAGE = "Please correct the highlighted fields and try again.";
const PERMISSION_MESSAGE = "You do not have permission to do this.";
const NOT_FOUND_MESSAGE = "This item is no longer available. Reloading.";

const ERROR_RULES: Record<string, ErrorRule> = {
  permission_denied: {
    message: "Custom plan requests are not available for this account.",
    action: "none",
  },
  custom_subscription_request_not_allowed: {
    message: "Custom plan requests are not available for this account.",
    action: "none",
  },
  billing_owner_required: {
    message: "Only the billing owner can request or manage a Custom plan.",
    action: "none",
  },
  custom_subscription_request_not_found: {
    message: "There is no active Custom plan request.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_offer_not_found: {
    message: "This offer is no longer available. Showing the latest status.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_request_already_active: {
    message: "You already have an active Custom plan request.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_request_not_editable: {
    message:
      "This request can no longer be edited in its current state. Showing the latest status.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_request_conflict: {
    message:
      "This request changed while you were working on it. Review the latest version and try again.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_company_name_locked: {
    message: "The company name cannot be changed for a company request.",
    action: "none",
  },
  custom_subscription_company_name_required: {
    message: "Enter a company name for your Custom plan.",
    action: "none",
  },
  custom_subscription_billing_action_required: {
    message:
      "Your current plan needs attention before it can change. Open the billing portal to resolve it.",
    action: "open_portal",
  },
  company_unavailable: {
    message:
      "Your company is unavailable right now. Contact support if this continues.",
    action: "contact_support",
    showRequestId: true,
  },
  company_subscription_not_found: {
    message:
      "We could not find your company's subscription. Contact support if this continues.",
    action: "contact_support",
    showRequestId: true,
  },
  custom_subscription_payment_pending: {
    message: "A payment is open for this request. Cancel the payment first.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_offer_expired: {
    message:
      "This offer has expired. Your request is back under review and a new offer will be sent.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_offer_conflict: {
    message: "This offer is no longer open. Showing the latest status.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_request_access_changed: {
    message:
      "Your plan or company changed since this request was made. Contact support or submit a new request.",
    action: "contact_support",
    showRequestId: true,
  },
  custom_subscription_seats_exceed_offer: {
    message:
      "Remove members or revoke pending invitations so your company fits this offer's seats, then accept.",
    action: "open_seats",
  },
  subscription_payment_pending: {
    message:
      "Another plan payment is in progress. Finish or cancel it before accepting this offer.",
    action: "open_billing",
  },
  custom_subscription_change_not_available: {
    message:
      "Your current subscription cannot be changed right now. Open the billing portal to review it.",
    action: "open_portal",
  },
  custom_subscription_payment_processing: {
    message: "Payment received. Activating your plan…",
    action: "poll_activation",
    refetch: true,
  },
  custom_subscription_payment_in_flight: {
    message:
      "The payment is still being prepared. You can cancel it in a few minutes.",
    action: "retry_later",
  },
  custom_subscription_payment_cancel_not_available: {
    message: "There is no open payment to cancel. Showing the latest status.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_payment_conflict: {
    message: "The payment changed at the same time. Showing the latest status.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_payment_window_too_short: {
    message:
      "This offer expires too soon to start a payment safely. Request changes to receive a renewed offer.",
    action: "request_changes",
  },
  custom_subscription_payment_in_progress: {
    message:
      "A Custom plan payment is in progress. Seats, invitations, quota changes and report generation are paused.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_offer_email_resend_cooldown: {
    message: "The offer email was sent recently. Try again shortly.",
    action: "retry_later",
  },
  custom_subscription_offer_email_daily_limit: {
    message: "The daily limit for resending this offer email has been reached.",
    action: "daily_limit",
  },
  custom_subscription_offer_email_not_resendable: {
    message: "This offer is no longer current, so its email cannot be resent.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_offer_email_delivery_failed: {
    message: "The email could not be sent. Please try again later.",
    action: "retry_later",
    retryable: true,
  },
  custom_subscription_close_email_not_available: {
    message:
      "This request was not closed by a Super Admin, so there is no closure email to resend.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_close_email_resend_cooldown: {
    message: "The closure email was sent recently. Try again shortly.",
    action: "retry_later",
  },
  custom_subscription_close_email_daily_limit: {
    message: "The daily limit for resending the closure email has been reached.",
    action: "daily_limit",
  },
  custom_subscription_close_email_delivery_failed: {
    message:
      "The closure email could not be sent. The request stays closed; try again later.",
    action: "retry_later",
    retryable: true,
  },
  custom_subscription_offer_not_editable: {
    message: "This offer is no longer a draft. Showing the latest state.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_offer_stale: {
    message:
      "The customer edited the request after this draft was saved. Re-save the draft, then publish again.",
    action: "republish",
    refetch: true,
  },
  custom_subscription_draft_offer_exists: {
    message: "A draft offer already exists for this request. Opening it.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_published_offer_exists: {
    message:
      "Another offer is already published. Cancel it or wait for the customer before publishing a new one.",
    action: "refetch",
    refetch: true,
  },
  custom_subscription_offer_revision_conflict: {
    message:
      "The previous offer revision cannot be superseded from its current state. Reloading.",
    action: "refetch",
    refetch: true,
  },
  stripe_reconciliation_failed: {
    message:
      "Billing is temporarily inconsistent. Contact support with the reference below.",
    action: "contact_support",
    showRequestId: true,
  },
  billing_provider_unavailable: {
    message:
      "The payment provider is temporarily unavailable. Please try again shortly.",
    action: "retry_later",
    retryable: true,
  },
  custom_billing_not_configured: {
    message:
      "Custom billing is not available right now. Contact support with the reference below.",
    action: "contact_support",
    showRequestId: true,
  },
  invalid_cursor: {
    message: "The list changed. Reloading the first page.",
    action: "reset_list",
  },
};

function fieldErrorsFromZod(error: ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path
      .filter((part): part is string => typeof part === "string")
      .join(".");

    if (key && fieldErrors[key] === undefined) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

function buildClassified(
  partial: Partial<ClassifiedCustomSubscriptionError> &
    Pick<ClassifiedCustomSubscriptionError, "kind" | "message">,
): ClassifiedCustomSubscriptionError {
  return {
    action: "none",
    fieldErrors: {},
    requestId: null,
    retryAfterSeconds: null,
    retryable: false,
    refetch: false,
    showRequestId: false,
    seatsExceed: null,
    ...partial,
  };
}

function parseSeatsExceed(details: unknown): SeatsExceedOfferDetails | null {
  const parsed = seatsExceedOfferDetailsSchema.safeParse(details);
  return parsed.success ? parsed.data : null;
}

export function classifyCustomSubscriptionError(
  error: unknown,
): ClassifiedCustomSubscriptionError {
  if (isBillingAbortError(error)) {
    return buildClassified({ kind: "aborted", message: "" });
  }

  if (error instanceof AuthSessionUnavailableError || error instanceof TypeError) {
    return buildClassified({
      kind: "retryable",
      message: RETRYABLE_MESSAGE,
      action: "retry_later",
      retryable: true,
    });
  }

  if (error instanceof AuthSessionError) {
    return buildClassified({
      kind: "invalid_session",
      message: SESSION_MESSAGE,
      action: "sign_in",
    });
  }

  if (error instanceof ZodError) {
    return buildClassified({
      kind: "validation_error",
      message: VALIDATION_MESSAGE,
      fieldErrors: fieldErrorsFromZod(error),
    });
  }

  if (!(error instanceof ApiRequestError)) {
    return buildClassified({
      kind: "generic",
      message:
        error instanceof Error ? error.message || GENERIC_MESSAGE : GENERIC_MESSAGE,
    });
  }

  const requestId = error.requestId;
  const retryAfterSeconds =
    error.retryAfterSeconds != null && error.retryAfterSeconds >= 0
      ? error.retryAfterSeconds
      : null;

  if (error.status === 401 || error.code === "invalid_session") {
    return buildClassified({
      kind: "invalid_session",
      message: SESSION_MESSAGE,
      action: "sign_in",
      requestId,
    });
  }

  if (
    error.code === "validation_error" ||
    error.status === 422 ||
    Object.keys(error.fieldErrors).length > 0
  ) {
    const rule = error.code ? ERROR_RULES[error.code] : undefined;

    return buildClassified({
      kind: error.code ?? "validation_error",
      message: rule?.message ?? (error.message || VALIDATION_MESSAGE),
      fieldErrors: error.fieldErrors,
      requestId,
      retryAfterSeconds,
    });
  }

  const rule = error.code ? ERROR_RULES[error.code] : undefined;

  if (rule && error.code) {
    return buildClassified({
      kind: error.code,
      message: rule.message,
      action: rule.action,
      refetch: rule.refetch ?? false,
      retryable: rule.retryable ?? false,
      showRequestId: rule.showRequestId ?? false,
      requestId,
      retryAfterSeconds,
      seatsExceed:
        error.code === "custom_subscription_seats_exceed_offer"
          ? parseSeatsExceed(error.details)
          : null,
    });
  }

  if (error.status === 403) {
    return buildClassified({
      kind: "permission_denied",
      message: PERMISSION_MESSAGE,
      requestId,
    });
  }

  if (error.status === 404) {
    return buildClassified({
      kind: "not_found",
      message: NOT_FOUND_MESSAGE,
      action: "refetch",
      refetch: true,
      requestId,
    });
  }

  if (error.status === 409) {
    return buildClassified({
      kind: "conflict",
      message: error.message || GENERIC_MESSAGE,
      action: "refetch",
      refetch: true,
      requestId,
      retryAfterSeconds,
    });
  }

  if (error.status === 429) {
    return buildClassified({
      kind: "rate_limited",
      message: error.message || "Too many attempts. Please wait and try again.",
      action: "retry_later",
      requestId,
      retryAfterSeconds,
    });
  }

  if (error.status >= 500) {
    return buildClassified({
      kind: "retryable",
      message: error.message || RETRYABLE_MESSAGE,
      action: "retry_later",
      retryable: true,
      requestId,
      retryAfterSeconds,
    });
  }

  return buildClassified({
    kind: "generic",
    message: error.message || GENERIC_MESSAGE,
    requestId,
    retryAfterSeconds,
  });
}

export function isCustomRequestNotFoundError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 404 &&
    error.code === "custom_subscription_request_not_found"
  );
}

export function isCustomPermissionDeniedError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 403;
}
