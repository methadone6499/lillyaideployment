import { ApiRequestError } from "@/services/ApiRequestError";

export function isTopUpOrderNotFound(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError && error.status === 404 && error.code === "not_found";
}

const messages: Record<string, string> = {
  paid_subscription_required: "A current eligible paid subscription is required. Review your subscription in Billing.",
  top_up_purchase_forbidden: "Only the eligible billing owner can purchase or allocate report top-ups.",
  subscription_purchase_suspended: "Purchases are restricted for this account. Contact support.",
  subscription_cancellation_pending: "Resume your subscription in Billing before purchasing more reports.",
  subscription_change_pending: "Finish the pending subscription change before purchasing report top-ups.",
  custom_subscription_payment_in_progress: "This action is paused while a Custom plan payment is in progress.",
  idempotency_key_reused: "This payment request conflicts with an earlier purchase. Check the existing payment before starting another purchase.",
  top_up_state_conflict: "Balances changed in another session. Review the refreshed balances before retrying.",
  seat_not_active: "This member is not active. Refresh members; unused reports can only be reclaimed from a disabled member.",
  insufficient_top_up_pool: "The company pool changed. Review the refreshed balance and choose a new target.",
  top_up_purchase_pending: "A report top-up payment is still active. Resolve it in Billing before changing plans. If it began in another tab, return to that tab or wait for checkout to expire.",
  invalid_top_up_quantity: "The permitted quantity changed. Review the current purchase limit and try again.",
  top_up_billing_not_configured: "Report top-up purchases are currently unavailable.",
  top_up_price_misconfigured: "Report top-up pricing is temporarily unavailable. Contact support if this continues.",
  billing_provider_unavailable: "The billing service is temporarily unavailable. Retry this same purchase after the indicated delay.",
  not_found: "This order or membership is no longer available to your account. Refresh to review the current state.",
};
export function getTopUpError(error: unknown) {
  return {
    message: error instanceof ApiRequestError ? messages[error.code ?? ""] ?? error.message :
      error instanceof Error ? error.message : "We could not complete this action. Try again.",
    requestId: error instanceof ApiRequestError ? error.requestId : null,
    fieldErrors: error instanceof ApiRequestError ? error.fieldErrors : {},
    code: error instanceof ApiRequestError ? error.code : null,
  };
}
