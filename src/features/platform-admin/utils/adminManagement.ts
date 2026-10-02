import {
  AuthSessionError,
  AuthSessionUnavailableError,
} from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import type { AdminUserResponse } from "../schemas/adminUserSchemas";

export type AdminManagementErrorKind =
  | "authentication"
  | "permission_denied"
  | "not_found"
  | "protected_super_admin"
  | "invalid_status_transition"
  | "email_not_verified"
  | "status_conflict"
  | "invalid_cursor"
  | "validation_error"
  | "retryable"
  | "unknown";

export type ClassifiedAdminManagementError = {
  kind: AdminManagementErrorKind;
  message: string;
  requestId: string | null;
  refresh: boolean;
};

const CODE_MESSAGES: Record<string, string> = {
  protected_super_admin: "Super Admin accounts are protected and cannot be disabled.",
  invalid_user_status_transition:
    "This account can no longer make that status change. Its latest status has been loaded.",
  user_email_not_verified:
    "This account must verify its email address before it can be enabled.",
  user_status_conflict:
    "The account changed while you were viewing it. Its latest status has been loaded; please retry if needed.",
  invalid_cursor: "The list changed. Loading the first page again.",
  validation_error: "One or more filters are invalid. Clear the filters and try again.",
};

const CODE_KINDS: Record<string, AdminManagementErrorKind> = {
  protected_super_admin: "protected_super_admin",
  invalid_user_status_transition: "invalid_status_transition",
  user_email_not_verified: "email_not_verified",
  user_status_conflict: "status_conflict",
  invalid_cursor: "invalid_cursor",
  validation_error: "validation_error",
};

export function classifyAdminManagementError(
  error: unknown,
): ClassifiedAdminManagementError {
  if (error instanceof AuthSessionError) {
    return {
      kind: "authentication",
      message: "Your session has expired. Sign in again to continue.",
      requestId: null,
      refresh: false,
    };
  }

  if (error instanceof AuthSessionUnavailableError || error instanceof TypeError) {
    return {
      kind: "retryable",
      message: "The service is temporarily unavailable. Please try again.",
      requestId: null,
      refresh: false,
    };
  }

  if (!(error instanceof ApiRequestError)) {
    return {
      kind: "unknown",
      message: "Something went wrong. Please try again.",
      requestId: null,
      refresh: false,
    };
  }

  if (error.code && CODE_KINDS[error.code]) {
    return {
      kind: CODE_KINDS[error.code],
      message: CODE_MESSAGES[error.code] ?? error.message,
      requestId: error.requestId,
      refresh:
        error.code === "invalid_user_status_transition" ||
        error.code === "user_status_conflict",
    };
  }

  if (error.status === 401) {
    return {
      kind: "authentication",
      message: "Your session has expired. Sign in again to continue.",
      requestId: error.requestId,
      refresh: false,
    };
  }

  if (error.status === 403) {
    return {
      kind: "permission_denied",
      message: "You do not have permission to perform this operation.",
      requestId: error.requestId,
      refresh: false,
    };
  }

  if (error.status === 404) {
    return {
      kind: "not_found",
      message: "This user or company no longer exists.",
      requestId: error.requestId,
      refresh: true,
    };
  }

  if (error.status === 422) {
    return {
      kind: "validation_error",
      message: "One or more filters are invalid. Clear the filters and try again.",
      requestId: error.requestId,
      refresh: false,
    };
  }

  return {
    kind: error.status >= 500 ? "retryable" : "unknown",
    message:
      error.message ||
      (error.status >= 500
        ? "The service is temporarily unavailable. Please try again."
        : "Something went wrong. Please try again."),
    requestId: error.requestId,
    refresh: false,
  };
}

export function canDisableAdminUser(user: AdminUserResponse): boolean {
  return (
    user.status === "active" &&
    user.global_role !== "super_admin" &&
    user.access.effective_role !== "super_admin"
  );
}

export function canEnableAdminUser(user: AdminUserResponse): boolean {
  return (
    user.status === "disabled" &&
    user.email_verified &&
    user.global_role !== "super_admin" &&
    user.access.effective_role !== "super_admin"
  );
}
