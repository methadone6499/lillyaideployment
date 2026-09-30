import type { SubscriptionOverview } from "@/features/billing";

import type {
  CustomOffer,
  CustomRequest,
  CustomRequestStatus,
  CustomerOfferState,
  PaymentKind,
} from "../schemas/customSubscriptionSchemas";

export const CUSTOM_OFFER_FAST_POLL_INTERVAL_MS = 2_500;
export const CUSTOM_OFFER_FAST_POLL_WINDOW_MS = 60_000;
export const CUSTOM_OFFER_PAYMENT_POLL_INTERVAL_MS = 30_000;
export const CUSTOM_OFFER_WAITING_POLL_INTERVAL_MS = 60_000;
export const CUSTOM_OFFER_EXPIRING_SOON_MS = 30 * 60_000;

const EDITABLE_STATUSES = new Set<CustomRequestStatus>([
  "submitted",
  "under_review",
  "action_required",
  "changes_requested",
]);

export type CustomRequestViewKind =
  | "under_review"
  | "action_required"
  | "changes_requested"
  | "offered"
  | "payment_pending"
  | "finished";

export type CustomPaymentLink = {
  kind: Exclude<PaymentKind, "none">;
  url: string;
};

export type CustomRequestView = {
  kind: CustomRequestViewKind;
  headline: string;
  description: string | null;
  canEdit: boolean;
  canCancel: boolean;
  offer: CustomOffer | null;
};

export type CustomOfferExpiry = {
  expiresAt: string;
  msRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
};

export function isCustomRequestEditable(status: CustomRequestStatus): boolean {
  return EDITABLE_STATUSES.has(status);
}

export function isCompanyNameLocked(request: CustomRequest): boolean {
  return request.target_scope_type === "company";
}

export function selectCustomRequestView(
  state: CustomerOfferState,
): CustomRequestView {
  const { request } = state;
  const editable = isCustomRequestEditable(request.status);

  switch (request.status) {
    case "submitted":
    case "under_review":
      return {
        kind: "under_review",
        headline: "Your Custom plan request is under review.",
        description: "We'll email you when an offer is ready.",
        canEdit: editable,
        canCancel: editable,
        offer: null,
      };
    case "action_required":
      return {
        kind: "action_required",
        headline: "We need a little more information.",
        description: request.action_required_message,
        canEdit: editable,
        canCancel: editable,
        offer: null,
      };
    case "changes_requested":
      return {
        kind: "changes_requested",
        headline: "Thanks — we're preparing a revised offer.",
        description: "We'll email you when the new offer is ready.",
        canEdit: editable,
        canCancel: editable,
        offer: null,
      };
    case "offered":
      return {
        kind: "offered",
        headline: "Your Custom plan offer is ready.",
        description: null,
        canEdit: false,
        canCancel: false,
        offer: state.offer,
      };
    case "payment_pending":
      return {
        kind: "payment_pending",
        headline: "Payment in progress",
        description:
          "Seats, invitations, quota changes and report generation are paused until the payment finishes or is cancelled.",
        canEdit: false,
        canCancel: false,
        offer: state.offer,
      };
    case "activated":
    case "closed":
    case "cancelled":
      return {
        kind: "finished",
        headline: "This Custom plan request is finished.",
        description: null,
        canEdit: false,
        canCancel: false,
        offer: null,
      };
  }
}

export function selectCustomPaymentLink(
  offer: CustomOffer | null | undefined,
): CustomPaymentLink | null {
  if (!offer) {
    return null;
  }

  if (offer.checkout_url) {
    return { kind: "checkout", url: offer.checkout_url };
  }

  if (offer.hosted_invoice_url) {
    return { kind: "invoice", url: offer.hosted_invoice_url };
  }

  return null;
}

export function selectCustomOfferExpiry(
  offer: CustomOffer | null | undefined,
  nowMs: number,
): CustomOfferExpiry | null {
  if (!offer?.expires_at) {
    return null;
  }

  const expiresMs = Date.parse(offer.expires_at);

  if (Number.isNaN(expiresMs)) {
    return null;
  }

  const msRemaining = expiresMs - nowMs;

  return {
    expiresAt: offer.expires_at,
    msRemaining,
    isExpired: msRemaining <= 0,
    isExpiringSoon: msRemaining > 0 && msRemaining < CUSTOM_OFFER_EXPIRING_SOON_MS,
  };
}

/**
 * Best-effort preview of how accepting will be paid; the acceptance response's
 * `payment_kind` is authoritative.
 */
export function predictCustomPaymentKind(
  request: CustomRequest,
  offer: CustomOffer,
  overview: SubscriptionOverview | null | undefined,
): PaymentKind {
  if (request.current_subscription_id === null) {
    return "checkout";
  }

  const subscription = overview?.subscription;

  if (
    subscription?.id === request.current_subscription_id &&
    subscription.plan_type === "custom" &&
    subscription.amount_minor === offer.amount_minor
  ) {
    return "none";
  }

  return "invoice";
}

export function isOutdatedOfferLink(
  offerIdHint: string | null | undefined,
  state: CustomerOfferState | null | undefined,
): boolean {
  if (!offerIdHint || state === undefined) {
    return false;
  }

  return state?.offer?.id !== offerIdHint;
}

export function getCustomOfferStatePollInterval(input: {
  state: CustomerOfferState | null | undefined;
  fastPollUntil: number | null;
  nowMs: number;
}): number | false {
  const status = input.state?.request.status;

  if (!status) {
    return false;
  }

  const inFastWindow =
    input.fastPollUntil !== null && input.nowMs < input.fastPollUntil;

  if (status === "payment_pending") {
    return inFastWindow
      ? CUSTOM_OFFER_FAST_POLL_INTERVAL_MS
      : CUSTOM_OFFER_PAYMENT_POLL_INTERVAL_MS;
  }

  if (!input.state?.request.active) {
    return false;
  }

  return inFastWindow
    ? CUSTOM_OFFER_FAST_POLL_INTERVAL_MS
    : CUSTOM_OFFER_WAITING_POLL_INTERVAL_MS;
}
