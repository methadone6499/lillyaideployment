import type { SubscriptionOverview } from "../schemas/billingSchemas";
import type { TopUpCheckout, TopUpOverview, TopUpOrderStatus } from "../schemas/topUpSchemas";

export const TOP_UP_PENDING_STATUSES: readonly TopUpOrderStatus[] = ["creating", "open", "payment_pending"];
export function isTopUpOrderPending(status: TopUpOrderStatus) {
  return TOP_UP_PENDING_STATUSES.includes(status);
}
export function getTopUpCheckoutUrl(order: TopUpCheckout, now = Date.now()) {
  if (order.status !== "open" || !order.checkout_url || (order.expires_at && Date.parse(order.expires_at) <= now)) return null;
  try {
    const url = new URL(order.checkout_url);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export function canAllocateTopUps(overview: TopUpOverview, subscription: SubscriptionOverview | undefined) {
  return overview.can_manage_allocations && subscription?.can_use_paid_features === true &&
    subscription.subscription?.features.report_generation === true &&
    !subscription.operation_lock?.blocked_actions.includes("quota_changes");
}
export function getMaximumTopUpTarget(currentBalance: number, pool: number, active: boolean) {
  return active ? Math.min(Number.MAX_SAFE_INTEGER, currentBalance + pool) : currentBalance;
}
export function parseTopUpInput(value: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= min && number <= max ? number : null;
}
export const TOP_UP_STATUS_COPY: Record<TopUpOrderStatus, string> = {
  creating: "Preparing your report top-up checkout.",
  open: "Payment is not completed. You can continue the open checkout until it expires.",
  payment_pending: "Your payment is awaiting confirmation. Reports will be added after confirmation.",
  completed: "Payment confirmed. Your additional reports have been added.",
  failed: "Your payment failed. You can start a new purchase.",
  expired: "This checkout expired. You can start a new purchase.",
  partially_refunded: "This payment was partially refunded. Contact support for details.",
  refunded: "This payment was refunded. Contact support for details.",
  disputed: "This payment is disputed. Contact support for details.",
};
