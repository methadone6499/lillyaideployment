import { cn } from "@/lib/cn";

import type {
  CustomOfferStatus,
  CustomRequestStatus,
  EmailDeliveryStatus,
} from "../schemas/customSubscriptionSchemas";
import {
  CUSTOM_OFFER_STATUS_LABELS,
  CUSTOM_REQUEST_STATUS_LABELS,
  EMAIL_DELIVERY_STATUS_LABELS,
} from "../utils/formatCustomSubscription";

const NEUTRAL_TONE = "bg-white/10 text-text-muted";
const INFO_TONE = "bg-[rgba(0,101,248,0.12)] text-[#0065f8]";
const WARNING_TONE = "bg-[rgba(255,200,92,0.12)] text-status-running";
const SUCCESS_TONE = "bg-[rgba(16,185,129,0.12)] text-status-success";
const DANGER_TONE = "bg-[rgba(217,34,68,0.12)] text-[#d92244]";

const REQUEST_STATUS_TONES: Record<CustomRequestStatus, string> = {
  submitted: INFO_TONE,
  under_review: WARNING_TONE,
  action_required: DANGER_TONE,
  offered: INFO_TONE,
  changes_requested: WARNING_TONE,
  payment_pending: WARNING_TONE,
  activated: SUCCESS_TONE,
  closed: NEUTRAL_TONE,
  cancelled: NEUTRAL_TONE,
};

const OFFER_STATUS_TONES: Record<CustomOfferStatus, string> = {
  draft: NEUTRAL_TONE,
  published: INFO_TONE,
  accepted: SUCCESS_TONE,
  changes_requested: WARNING_TONE,
  declined: DANGER_TONE,
  expired: NEUTRAL_TONE,
  superseded: NEUTRAL_TONE,
  cancelled: NEUTRAL_TONE,
};

const EMAIL_STATUS_TONES: Record<EmailDeliveryStatus, string> = {
  pending: WARNING_TONE,
  sent: SUCCESS_TONE,
  failed: DANGER_TONE,
};

function Pill({
  label,
  toneClassName,
  className,
}: {
  label: string;
  toneClassName: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-card p-2.5 text-input font-medium whitespace-nowrap",
        toneClassName,
        className,
      )}
    >
      {label}
    </span>
  );
}

export function CustomRequestStatusPill({
  status,
  className,
}: {
  status: CustomRequestStatus;
  className?: string;
}) {
  return (
    <Pill
      label={CUSTOM_REQUEST_STATUS_LABELS[status]}
      toneClassName={REQUEST_STATUS_TONES[status]}
      className={className}
    />
  );
}

export function CustomOfferStatusPill({
  status,
  className,
}: {
  status: CustomOfferStatus;
  className?: string;
}) {
  return (
    <Pill
      label={CUSTOM_OFFER_STATUS_LABELS[status]}
      toneClassName={OFFER_STATUS_TONES[status]}
      className={className}
    />
  );
}

export function EmailDeliveryStatusPill({
  status,
  className,
}: {
  status: EmailDeliveryStatus;
  className?: string;
}) {
  return (
    <Pill
      label={EMAIL_DELIVERY_STATUS_LABELS[status]}
      toneClassName={EMAIL_STATUS_TONES[status]}
      className={className}
    />
  );
}
