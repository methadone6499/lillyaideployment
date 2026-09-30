"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";

import { TextField } from "@/components/ui";
import { BILLING_PATHS } from "@/features/billing";

import {
  CUSTOM_TEXT_MAX_LENGTH,
  type CustomOffer,
  type PaymentKind,
  type RequestChangesBody,
  type SeatsExceedOfferDetails,
} from "../schemas/customSubscriptionSchemas";
import {
  formatMonthlyPrice,
  parsePositiveIntegerInput,
  parseUsdAmountInput,
} from "../utils/formatCustomSubscription";
import { CustomSubscriptionDialog } from "./CustomSubscriptionDialog";
import { CustomTextArea } from "./CustomTextArea";

function DialogError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <p role="alert" className="text-helper text-status-running">
      {message}
    </p>
  );
}

function OfferTermsSummary({ offer }: { offer: CustomOffer }) {
  return (
    <dl className="grid gap-3 rounded-card bg-surface-subtle p-4 text-label sm:grid-cols-3">
      <div>
        <dt className="text-helper text-text-muted">Price</dt>
        <dd className="mt-1 font-medium text-white">
          {formatMonthlyPrice(offer.amount_minor)}
        </dd>
      </div>
      <div>
        <dt className="text-helper text-text-muted">Seats</dt>
        <dd className="mt-1 font-medium text-white">{offer.seats}</dd>
      </div>
      <div>
        <dt className="text-helper text-text-muted">Reports per month</dt>
        <dd className="mt-1 font-medium text-white">{offer.reports}</dd>
      </div>
    </dl>
  );
}

const PAYMENT_EXPECTATIONS: Record<PaymentKind, string> = {
  checkout:
    "You'll continue to Stripe Checkout in this tab to pay the first month.",
  invoice:
    "Your saved payment method is charged today. A new monthly period starts today and unused time on your current plan is credited on the same invoice. The invoice opens in a new tab.",
  none: "The monthly price is unchanged, so there is nothing to pay. The new limits apply immediately.",
};

type AcceptOfferDialogProps = {
  open: boolean;
  offer: CustomOffer;
  expectedPaymentKind: PaymentKind;
  isCompanyPlan: boolean;
  isPending: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function AcceptOfferDialog({
  open,
  offer,
  expectedPaymentKind,
  isCompanyPlan,
  isPending,
  errorMessage,
  onClose,
  onConfirm,
}: AcceptOfferDialogProps) {
  return (
    <CustomSubscriptionDialog
      open={open}
      title="Accept Custom plan offer"
      confirmLabel={isPending ? "Accepting..." : "Accept offer"}
      confirmDisabled={isPending}
      closeDisabled={isPending}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        if (!isPending) {
          onConfirm();
        }
      }}
    >
      <div className="flex flex-col gap-4 text-label leading-relaxed text-text-body">
        <OfferTermsSummary offer={offer} />
        <p>{PAYMENT_EXPECTATIONS[expectedPaymentKind]}</p>
        {expectedPaymentKind !== "none" ? (
          <p>
            While the payment is open,{" "}
            {isCompanyPlan
              ? "seats, invitations, quota changes and report generation are paused for your company"
              : "report generation is paused"}
            . You can cancel the payment to lift the pause.
          </p>
        ) : null}
        <p className="text-helper text-text-muted">
          A billable change starts a new quota period: unused reports from the
          current period expire and seat users start at zero until you assign
          quota.
        </p>
        <DialogError message={errorMessage} />
      </div>
    </CustomSubscriptionDialog>
  );
}

type RequestChangesDialogProps = {
  open: boolean;
  isPending: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: (body: RequestChangesBody) => void;
};

export function RequestChangesDialog({
  open,
  isPending,
  errorMessage,
  onClose,
  onConfirm,
}: RequestChangesDialogProps) {
  const [message, setMessage] = useState("");
  const [seats, setSeats] = useState("");
  const [reports, setReports] = useState("");
  const [amount, setAmount] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const errors: Record<string, string> = {};
    const trimmedMessage = message.trim();
    const suggestedSeats = seats.trim() ? parsePositiveIntegerInput(seats) : null;
    const suggestedReports = reports.trim()
      ? parsePositiveIntegerInput(reports)
      : null;
    const suggestedAmount = amount.trim() ? parseUsdAmountInput(amount) : null;

    if (!trimmedMessage) {
      errors.message = "Tell us what you'd like to change.";
    }

    if (seats.trim() && suggestedSeats === null) {
      errors.seats = "Enter a whole number of seats.";
    }

    if (reports.trim() && suggestedReports === null) {
      errors.reports = "Enter a whole number of reports.";
    }

    if (amount.trim() && suggestedAmount === null) {
      errors.amount = "Enter a USD amount such as 750 or 750.50.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    onConfirm({
      message: trimmedMessage,
      suggested_seats: suggestedSeats,
      suggested_reports: suggestedReports,
      suggested_amount_minor: suggestedAmount,
    });
  };

  return (
    <CustomSubscriptionDialog
      open={open}
      title="Request changes"
      confirmLabel={isPending ? "Sending..." : "Send request"}
      confirmDisabled={isPending}
      closeDisabled={isPending}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-4">
        <p className="text-label leading-relaxed text-text-body">
          This offer will no longer be available. We&apos;ll prepare a revised
          offer with a fresh 7-day window. Suggestions are not binding.
        </p>
        <CustomTextArea
          label="What would you like to change?"
          required
          maxLength={CUSTOM_TEXT_MAX_LENGTH}
          value={message}
          error={fieldErrors.message}
          disabled={isPending}
          data-autofocus
          onChange={(event) => setMessage(event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Seats"
            inputMode="numeric"
            value={seats}
            error={fieldErrors.seats}
            disabled={isPending}
            onChange={(event) => setSeats(event.target.value)}
          />
          <TextField
            label="Reports / month"
            inputMode="numeric"
            value={reports}
            error={fieldErrors.reports}
            disabled={isPending}
            onChange={(event) => setReports(event.target.value)}
          />
          <TextField
            label="Price / month (USD)"
            inputMode="decimal"
            value={amount}
            error={fieldErrors.amount}
            disabled={isPending}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <DialogError message={errorMessage} />
      </div>
    </CustomSubscriptionDialog>
  );
}

type DeclineOfferDialogProps = {
  open: boolean;
  isPending: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export function DeclineOfferDialog({
  open,
  isPending,
  errorMessage,
  onClose,
  onConfirm,
}: DeclineOfferDialogProps) {
  const [reason, setReason] = useState("");

  return (
    <CustomSubscriptionDialog
      open={open}
      title="Decline offer"
      confirmLabel={isPending ? "Declining..." : "Decline offer"}
      confirmTone="danger"
      confirmDisabled={isPending}
      closeDisabled={isPending}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        if (!isPending) {
          onConfirm(reason.trim());
        }
      }}
    >
      <div className="flex flex-col gap-4">
        <p className="text-label leading-relaxed text-text-body">
          Declining closes this Custom plan request with no replacement offer.
          You can choose Standard or Enterprise, or submit a new Custom request
          later.
        </p>
        <CustomTextArea
          label="Reason (optional)"
          maxLength={CUSTOM_TEXT_MAX_LENGTH}
          value={reason}
          disabled={isPending}
          onChange={(event) => setReason(event.target.value)}
        />
        <DialogError message={errorMessage} />
      </div>
    </CustomSubscriptionDialog>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  confirmLabel: string;
  isPending: boolean;
  errorMessage: string | null;
  confirmDisabled?: boolean;
  children: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
};

export function CustomConfirmDialog({
  open,
  title,
  confirmLabel,
  isPending,
  errorMessage,
  confirmDisabled = false,
  children,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <CustomSubscriptionDialog
      open={open}
      title={title}
      confirmLabel={confirmLabel}
      confirmTone="danger"
      confirmDisabled={isPending || confirmDisabled}
      closeDisabled={isPending}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        if (!isPending && !confirmDisabled) {
          onConfirm();
        }
      }}
    >
      <div className="flex flex-col gap-4 text-label leading-relaxed text-text-body">
        {children}
        <DialogError message={errorMessage} />
      </div>
    </CustomSubscriptionDialog>
  );
}

export function SeatsExceedDialog({
  open,
  details,
  message,
  onClose,
}: {
  open: boolean;
  details: SeatsExceedOfferDetails | null;
  message: string;
  onClose: () => void;
}) {
  return (
    <CustomSubscriptionDialog
      open={open}
      title="Free seats before accepting"
      hideConfirm
      cancelLabel="Close"
      onClose={onClose}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex flex-col gap-4 text-label leading-relaxed text-text-body">
        {details ? (
          <p>
            This plan includes {details.offer_seats} seats. You currently have{" "}
            {details.occupied_membership_seats} occupied{" "}
            {details.occupied_membership_seats === 1 ? "membership" : "memberships"}{" "}
            and {details.pending_invitation_seats} pending{" "}
            {details.pending_invitation_seats === 1 ? "invitation" : "invitations"} (
            {details.total_occupied_seats} total). Remove members or revoke
            invitations to free{" "}
            <span className="font-medium text-white">{details.seats_to_free}</span>{" "}
            {details.seats_to_free === 1 ? "seat" : "seats"}, then accept.
          </p>
        ) : (
          <p>{message}</p>
        )}
        <p className="text-helper text-text-muted">
          Nobody is removed automatically, and the primary company admin
          cannot be removed.
        </p>
        <Link
          href={BILLING_PATHS.companySeats}
          className="w-fit font-medium text-brand underline underline-offset-2"
        >
          Manage seats and invitations
        </Link>
      </div>
    </CustomSubscriptionDialog>
  );
}
