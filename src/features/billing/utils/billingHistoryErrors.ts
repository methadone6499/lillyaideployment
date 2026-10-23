import { AuthSessionError } from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

export function getBillingHistoryError(error: unknown) {
  const apiError = error instanceof ApiRequestError ? error : null;
  const invalidSession = error instanceof AuthSessionError || apiError?.status === 401;
  const unavailable = apiError?.status === 503;
  const invalidRequest = apiError?.status === 422 || apiError?.code === "validation_error";
  const forbidden = apiError?.status === 403;

  return {
    invalidSession,
    retryable: !invalidSession && !invalidRequest && !forbidden,
    requestId: apiError?.requestId,
    message: invalidSession
      ? "Your session has expired. Please sign in again."
      : unavailable
        ? "Billing history is temporarily unavailable. Please try again shortly."
        : invalidRequest
          ? "We could not load billing history because of a request problem. Please contact support."
          : forbidden
            ? "You do not have permission to view this billing history."
            : "We could not load billing history. Please try again.",
  };
}
