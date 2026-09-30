import { formatAmountMinor } from "@/features/billing";

import type {
  AdminIdentity,
  CustomOfferStatus,
  CustomRequestStatus,
  EmailDeliveryStatus,
} from "../schemas/customSubscriptionSchemas";

const CUSTOM_CURRENCY = "usd";
const USD_INPUT_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const CUSTOM_REQUEST_STATUS_LABELS: Record<CustomRequestStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  action_required: "Action required",
  offered: "Offer sent",
  changes_requested: "Changes requested",
  payment_pending: "Payment pending",
  activated: "Activated",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const CUSTOM_OFFER_STATUS_LABELS: Record<CustomOfferStatus, string> = {
  draft: "Draft",
  published: "Published",
  accepted: "Accepted",
  changes_requested: "Changes requested",
  declined: "Declined",
  expired: "Expired",
  superseded: "Superseded",
  cancelled: "Cancelled",
};

export const EMAIL_DELIVERY_STATUS_LABELS: Record<EmailDeliveryStatus, string> = {
  pending: "Not confirmed",
  sent: "Sent",
  failed: "Failed",
};

export function formatUsdAmount(amountMinor: number): string {
  return formatAmountMinor(amountMinor, CUSTOM_CURRENCY);
}

export function formatMonthlyPrice(amountMinor: number): string {
  return `${formatUsdAmount(amountMinor)} / month`;
}

/**
 * Parses a dollar amount typed by a person ("750", "$1,250.50") into minor
 * units. Returns null for anything that is not a positive amount with at most
 * two decimals.
 */
export function parseUsdAmountInput(value: string): number | null {
  const normalized = value.trim().replace(/^\$/, "").replaceAll(",", "");

  if (!USD_INPUT_PATTERN.test(normalized)) {
    return null;
  }

  const [whole, fraction = ""] = normalized.split(".");
  const amountMinor =
    Number.parseInt(whole, 10) * 100 +
    Number.parseInt(fraction.padEnd(2, "0"), 10);

  return Number.isSafeInteger(amountMinor) && amountMinor > 0
    ? amountMinor
    : null;
}

export function formatUsdAmountInput(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}

export function parsePositiveIntegerInput(value: string): number | null {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : null;
}

export function formatIdentity(identity: AdminIdentity | null): string {
  if (!identity) {
    return "Unknown user";
  }

  return identity.full_name || identity.email || identity.user_id;
}

export function formatTimeRemaining(msRemaining: number): string {
  if (msRemaining <= 0) {
    return "Expired";
  }

  if (msRemaining >= DAY_MS) {
    const days = Math.floor(msRemaining / DAY_MS);
    return `${days} ${days === 1 ? "day" : "days"} left`;
  }

  if (msRemaining >= HOUR_MS) {
    const hours = Math.floor(msRemaining / HOUR_MS);
    return `${hours} ${hours === 1 ? "hour" : "hours"} left`;
  }

  const minutes = Math.max(1, Math.floor(msRemaining / MINUTE_MS));
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"} left`;
}
