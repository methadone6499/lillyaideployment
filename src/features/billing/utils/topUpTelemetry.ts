type TopUpEvent =
  | { name: "top_up_dialog_opened"; scopeType: "user" | "company" }
  | { name: "top_up_checkout_requested"; quantity: number }
  | { name: "top_up_checkout_redirected"; orderId: string; quantity: number }
  | { name: "top_up_order_status_seen"; orderId: string; status: string }
  | { name: "top_up_allocation_updated"; membershipId: string; direction: "assign" | "reclaim" };

/** Sanitized integration event; payment URLs, tokens and provider payloads never enter telemetry. */
export function emitTopUpEvent(event: TopUpEvent) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("formulary:report-top-up", { detail: event }));
}
