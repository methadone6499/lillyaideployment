import {
  AuthSessionError,
  AuthSessionUnavailableError,
} from "@/features/auth";
import { ApiRequestError, type FieldErrors } from "@/services/ApiRequestError";
import { ZodError } from "zod";

import {
  checkoutPendingDetailsSchema,
  type BillingErrorCode,
  type PlanType,
} from "../schemas/billingSchemas";
import { BILLING_PATHS } from "./billingConstants";
import { isBillingAbortError } from "./isBillingAbortError";

export type BillingErrorKind =
  | BillingErrorCode
  | "retryable"
  | "generic"
  | "aborted";

export type ClassifiedBillingError = {
  kind: BillingErrorKind;
  message: string;
  fieldErrors: FieldErrors;
  requestId: string | null;
  retryAfterSeconds: number | null;
  retryable: boolean;
  pollOverview: boolean;
  reloadOverview: boolean;
  refetchAuth: boolean;
  hideOwnerControls: boolean;
  openPortal: boolean;
  showRequestId: boolean;
  pendingPlanType: PlanType | null;
  destination: string | null;
};

const GENERIC_MESSAGE = "Something went wrong. Please try again.";
const RETRYABLE_MESSAGE =
  "We could not update billing right now. Please try again in a moment.";
const SESSION_MESSAGE = "Your session has expired. Please sign in again.";
const CONFIGURATION_MESSAGE =
  "Billing is temporarily unavailable because it is not configured.";
const PROVIDER_MESSAGE =
  "The billing provider is temporarily unavailable. Please try again shortly.";
const RECONCILIATION_MESSAGE =
  "We could not confirm your billing update yet. Your payment may still succeed.";
const OWNER_MESSAGE =
  "Only the billing owner can manage this subscription.";
const VALIDATION_MESSAGE = "Please correct the highlighted fields and try again.";
const SUPER_ADMIN_MESSAGE = "A subscription is not required for this account.";
const ACTIVE_ACCESS_MESSAGE =
  "An access mode already exists. Reloading the current billing state.";
const CHECKOUT_PENDING_MESSAGE =
  "Another subscription checkout is already in progress.";
const CHECKOUT_PAYMENT_MESSAGE =
  "Your checkout payment is still processing.";
const CHECKOUT_CONFLICT_MESSAGE =
  "Checkout could not continue from its current state. Reloading billing.";
const UNSUPPORTED_CHANGE_MESSAGE =
  "Only an active Standard subscription can be upgraded to Enterprise.";
const CANCELLATION_PENDING_MESSAGE =
  "Resume this subscription in the billing portal before upgrading.";
const CHANGE_PENDING_MESSAGE =
  "An Enterprise upgrade is already in progress.";
const SUBSCRIPTION_REQUIRED_MESSAGE =
  "A paid subscription is required to use this feature.";
const QUOTA_EXHAUSTED_MESSAGE =
  "This workspace has no remaining report quota for the current period.";
const SUBSCRIPTION_PAYMENT_PENDING_MESSAGE =
  "A Custom plan payment is in progress. Finish or cancel it before choosing another plan.";
const OPERATION_LOCKED_MESSAGE =
  "A Custom plan payment is in progress. Seats, invitations, quota changes and report generation are paused until it completes or is cancelled.";
const ENTERPRISE_CAPACITY_MESSAGE =
  "Enterprise includes 10 seats. Remove members or revoke pending invitations so occupied and pending seats total 10 or fewer, then try again.";
const CUSTOM_REQUEST_ACTIVE_MESSAGE =
  "You have an active Custom plan request. Close or cancel it before scheduling a downgrade.";
const DOWNGRADE_NOT_FOUND_MESSAGE =
  "There is no scheduled downgrade to cancel. Reloading billing.";

const ERROR_MESSAGES: Record<BillingErrorCode, string> = {
  invalid_session: SESSION_MESSAGE,
  validation_error: VALIDATION_MESSAGE,
  subscription_not_required: SUPER_ADMIN_MESSAGE,
  active_access_exists: ACTIVE_ACCESS_MESSAGE,
  checkout_session_pending: CHECKOUT_PENDING_MESSAGE,
  checkout_payment_pending: CHECKOUT_PAYMENT_MESSAGE,
  checkout_state_conflict: CHECKOUT_CONFLICT_MESSAGE,
  billing_owner_required: OWNER_MESSAGE,
  unsupported_plan_change: UNSUPPORTED_CHANGE_MESSAGE,
  subscription_cancellation_pending: CANCELLATION_PENDING_MESSAGE,
  subscription_change_pending: CHANGE_PENDING_MESSAGE,
  billing_not_configured: CONFIGURATION_MESSAGE,
  billing_provider_unavailable: PROVIDER_MESSAGE,
  billing_reconciliation_failed: RECONCILIATION_MESSAGE,
  subscription_required: SUBSCRIPTION_REQUIRED_MESSAGE,
  report_quota_exhausted: QUOTA_EXHAUSTED_MESSAGE,
  subscription_payment_pending: SUBSCRIPTION_PAYMENT_PENDING_MESSAGE,
  custom_subscription_payment_in_progress: OPERATION_LOCKED_MESSAGE,
  enterprise_capacity_exceeded: ENTERPRISE_CAPACITY_MESSAGE,
  custom_subscription_request_active: CUSTOM_REQUEST_ACTIVE_MESSAGE,
  scheduled_downgrade_not_found: DOWNGRADE_NOT_FOUND_MESSAGE,
};

const KNOWN_ERROR_CODES = new Set<string>(Object.keys(ERROR_MESSAGES));

function isBillingErrorCode(code: string): code is BillingErrorCode {
  return KNOWN_ERROR_CODES.has(code);
}

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

function pendingPlanTypeFromDetails(details: unknown): PlanType | null {
  const parsed = checkoutPendingDetailsSchema.safeParse(details);
  return parsed.success ? parsed.data.plan_type : null;
}

function resolveRetryAfterSeconds(error: ApiRequestError): number | null {
  if (error.retryAfterSeconds != null && error.retryAfterSeconds >= 0) {
    return error.retryAfterSeconds;
  }

  return null;
}

function buildClassifiedError(
  partial: Partial<ClassifiedBillingError> &
    Pick<ClassifiedBillingError, "kind" | "message">,
): ClassifiedBillingError {
  return {
    fieldErrors: {},
    requestId: null,
    retryAfterSeconds: null,
    retryable: false,
    pollOverview: false,
    reloadOverview: false,
    refetchAuth: false,
    hideOwnerControls: false,
    openPortal: false,
    showRequestId: false,
    pendingPlanType: null,
    destination: null,
    ...partial,
  };
}

export function classifyBillingError(error: unknown): ClassifiedBillingError {
  if (isBillingAbortError(error)) {
    return buildClassifiedError({
      kind: "aborted",
      message: "",
    });
  }

  if (error instanceof AuthSessionUnavailableError || error instanceof TypeError) {
    return buildClassifiedError({
      kind: "retryable",
      message: RETRYABLE_MESSAGE,
      retryable: true,
    });
  }

  if (error instanceof AuthSessionError) {
    return buildClassifiedError({
      kind: "invalid_session",
      message: SESSION_MESSAGE,
      destination: "/login",
    });
  }

  if (error instanceof ZodError) {
    const fieldErrors = fieldErrorsFromZod(error);

    return buildClassifiedError({
      kind: "validation_error",
      message: VALIDATION_MESSAGE,
      fieldErrors,
    });
  }

  if (!(error instanceof ApiRequestError)) {
    return buildClassifiedError({
      kind: "generic",
      message: error instanceof Error ? error.message || GENERIC_MESSAGE : GENERIC_MESSAGE,
    });
  }

  const code = error.code && isBillingErrorCode(error.code) ? error.code : null;
  const retryAfterSeconds = resolveRetryAfterSeconds(error);
  const requestId = error.requestId;
  const fieldErrors = error.fieldErrors;
  const mappedMessage = code ? ERROR_MESSAGES[code] : undefined;
  const message = error.message || mappedMessage || GENERIC_MESSAGE;
  const pendingPlanType = pendingPlanTypeFromDetails(error.details);

  if (error.status === 401 || code === "invalid_session") {
    return buildClassifiedError({
      kind: "invalid_session",
      message: error.message || SESSION_MESSAGE,
      requestId,
      retryAfterSeconds,
      destination: "/login",
    });
  }

  if (
    code === "validation_error" ||
    error.status === 422 ||
    Object.keys(fieldErrors).length > 0
  ) {
    return buildClassifiedError({
      kind: "validation_error",
      message: error.message || VALIDATION_MESSAGE,
      fieldErrors,
      requestId,
      retryAfterSeconds,
    });
  }

  if (code === "subscription_not_required") {
    return buildClassifiedError({
      kind: "subscription_not_required",
      message,
      requestId,
      retryAfterSeconds,
      refetchAuth: true,
    });
  }

  if (code === "active_access_exists") {
    return buildClassifiedError({
      kind: "active_access_exists",
      message,
      requestId,
      retryAfterSeconds,
      reloadOverview: true,
      refetchAuth: true,
    });
  }

  if (code === "checkout_session_pending") {
    return buildClassifiedError({
      kind: "checkout_session_pending",
      message,
      requestId,
      retryAfterSeconds,
      reloadOverview: true,
      pendingPlanType,
    });
  }

  if (code === "checkout_payment_pending") {
    return buildClassifiedError({
      kind: "checkout_payment_pending",
      message,
      requestId,
      retryAfterSeconds,
      reloadOverview: true,
      pollOverview: true,
    });
  }

  if (code === "checkout_state_conflict") {
    return buildClassifiedError({
      kind: "checkout_state_conflict",
      message,
      requestId,
      retryAfterSeconds,
      reloadOverview: true,
    });
  }

  if (code === "billing_owner_required") {
    return buildClassifiedError({
      kind: "billing_owner_required",
      message,
      requestId,
      retryAfterSeconds,
      hideOwnerControls: true,
    });
  }

  if (code === "unsupported_plan_change") {
    return buildClassifiedError({
      kind: "unsupported_plan_change",
      message,
      requestId,
      retryAfterSeconds,
      reloadOverview: true,
    });
  }

  if (code === "subscription_cancellation_pending") {
    return buildClassifiedError({
      kind: "subscription_cancellation_pending",
      message,
      requestId,
      retryAfterSeconds,
      reloadOverview: true,
      openPortal: true,
    });
  }

  if (code === "subscription_change_pending") {
    return buildClassifiedError({
      kind: "subscription_change_pending",
      message,
      requestId,
      retryAfterSeconds,
      reloadOverview: true,
    });
  }

  if (code === "billing_not_configured") {
    return buildClassifiedError({
      kind: "billing_not_configured",
      message,
      requestId,
      retryAfterSeconds,
    });
  }

  if (code === "billing_provider_unavailable") {
    return buildClassifiedError({
      kind: "billing_provider_unavailable",
      message,
      requestId,
      retryAfterSeconds,
      retryable: true,
    });
  }

  if (code === "billing_reconciliation_failed") {
    return buildClassifiedError({
      kind: "billing_reconciliation_failed",
      message,
      requestId,
      retryAfterSeconds,
      retryable: true,
      pollOverview: true,
      reloadOverview: true,
      showRequestId: true,
    });
  }

  if (code === "subscription_required") {
    return buildClassifiedError({
      kind: "subscription_required",
      message: error.message || SUBSCRIPTION_REQUIRED_MESSAGE,
      requestId,
      retryAfterSeconds,
      destination: BILLING_PATHS.onboarding,
    });
  }

  if (code === "report_quota_exhausted") {
    return buildClassifiedError({
      kind: "report_quota_exhausted",
      message,
      requestId,
      retryAfterSeconds,
      destination: BILLING_PATHS.settings,
    });
  }

  if (code === "subscription_payment_pending") {
    return buildClassifiedError({
      kind: "subscription_payment_pending",
      message: SUBSCRIPTION_PAYMENT_PENDING_MESSAGE,
      requestId,
      retryAfterSeconds,
      reloadOverview: true,
      destination: BILLING_PATHS.custom,
    });
  }

  if (code === "custom_subscription_payment_in_progress") {
    return buildClassifiedError({
      kind: "custom_subscription_payment_in_progress",
      message: OPERATION_LOCKED_MESSAGE,
      requestId,
      retryAfterSeconds,
      reloadOverview: true,
    });
  }

  if (code === "enterprise_capacity_exceeded") {
    return buildClassifiedError({
      kind: "enterprise_capacity_exceeded",
      message: ENTERPRISE_CAPACITY_MESSAGE,
      requestId,
      retryAfterSeconds,
      destination: BILLING_PATHS.companySeats,
    });
  }

  if (code === "custom_subscription_request_active") {
    return buildClassifiedError({
      kind: "custom_subscription_request_active",
      message: CUSTOM_REQUEST_ACTIVE_MESSAGE,
      requestId,
      retryAfterSeconds,
      destination: BILLING_PATHS.custom,
    });
  }

  if (code === "scheduled_downgrade_not_found") {
    return buildClassifiedError({
      kind: "scheduled_downgrade_not_found",
      message: DOWNGRADE_NOT_FOUND_MESSAGE,
      requestId,
      retryAfterSeconds,
      reloadOverview: true,
    });
  }

  if (error.status === 403) {
    return buildClassifiedError({
      kind: "generic",
      message: error.message || "You do not have permission to manage billing.",
      requestId,
      retryAfterSeconds,
    });
  }

  if (error.status === 402) {
    return buildClassifiedError({
      kind: "subscription_required",
      message: error.message || SUBSCRIPTION_REQUIRED_MESSAGE,
      requestId,
      retryAfterSeconds,
      destination: BILLING_PATHS.onboarding,
    });
  }

  if (error.status === 409) {
    return buildClassifiedError({
      kind: "generic",
      message,
      requestId,
      retryAfterSeconds,
      reloadOverview: true,
    });
  }

  if (error.status === 500) {
    return buildClassifiedError({
      kind: "retryable",
      message: error.message || RETRYABLE_MESSAGE,
      requestId,
      retryAfterSeconds,
      retryable: true,
      reloadOverview: true,
    });
  }

  if (error.status >= 500) {
    return buildClassifiedError({
      kind: "retryable",
      message: error.message || RETRYABLE_MESSAGE,
      requestId,
      retryAfterSeconds,
      retryable: true,
    });
  }

  return buildClassifiedError({
    kind: "generic",
    message,
    requestId,
    retryAfterSeconds,
    fieldErrors,
  });
}

export function isTerminalClassifiedBillingError(
  classified: ClassifiedBillingError,
): boolean {
  return (
    classified.kind !== "aborted" &&
    !classified.retryable &&
    !classified.pollOverview
  );
}

export type PaidActionFailureKind = Extract<
  BillingErrorKind,
  "subscription_required" | "report_quota_exhausted"
>;

function readErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  return typeof error.code === "string" ? error.code : null;
}

function readErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return null;
  }

  return typeof error.status === "number" ? error.status : null;
}

export function getPaidActionFailureKind(
  error: unknown,
): PaidActionFailureKind | null {
  if (isBillingAbortError(error)) {
    return null;
  }

  const code = readErrorCode(error);
  if (code === "subscription_required" || code === "report_quota_exhausted") {
    return code;
  }

  const classified = classifyBillingError(error);
  if (
    classified.kind === "subscription_required" ||
    classified.kind === "report_quota_exhausted"
  ) {
    return classified.kind;
  }

  if (readErrorStatus(error) === 402) {
    return "subscription_required";
  }

  return null;
}
