"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useRef } from "react";

import { Button, CloseIcon } from "@/components/ui";

import type { SubscriptionSummary } from "../schemas/billingSchemas";
import { BILLING_PATHS } from "../utils/billingConstants";
import { formatLocalDate } from "../utils/formatBilling";

const ENTERPRISE_SEAT_LIMIT = 10;
const ENTERPRISE_REPORT_LIMIT = 100;

type EnterpriseDowngradeDialogProps = {
  subscription: SubscriptionSummary;
  isPending: boolean;
  feedback?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export function EnterpriseDowngradeDialog({
  subscription,
  isPending,
  feedback,
  onConfirm,
  onCancel,
}: EnterpriseDowngradeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;

    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isPending) {
      onConfirm();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="enterprise-downgrade-heading"
      aria-describedby="enterprise-downgrade-description"
      aria-busy={isPending}
      tabIndex={-1}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-button border border-border-default bg-[#171717] p-6 font-[family-name:var(--font-inter)] text-white shadow-2xl backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        if (!isPending) {
          onCancel();
        }
      }}
      onMouseDown={(event) => {
        if (isPending || event.target !== event.currentTarget) {
          return;
        }

        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          onCancel();
        }
      }}
    >
      <header className="flex items-center justify-between gap-4">
        <h2
          id="enterprise-downgrade-heading"
          className="text-card-title font-medium text-white"
        >
          Switch to Enterprise at renewal
        </h2>
        <button
          type="button"
          aria-label="Close Enterprise downgrade"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-card text-text-muted transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
          onClick={onCancel}
        >
          <CloseIcon />
        </button>
      </header>
      <div
        id="enterprise-downgrade-description"
        className="mt-4 flex flex-col gap-3 text-input text-text-muted"
      >
        <p>
          Your Custom plan stays active until{" "}
          <span className="font-medium text-white">
            {formatLocalDate(subscription.current_period_end)}
          </span>
          . At that renewal your company moves to Enterprise with{" "}
          {ENTERPRISE_SEAT_LIMIT} seats and {ENTERPRISE_REPORT_LIMIT} reports
          per month.
        </p>
        <p>
          A fresh quota period starts on the switch: you receive all{" "}
          {ENTERPRISE_REPORT_LIMIT} reports and seat users start at zero until
          you redistribute quota.
        </p>
        <p>
          Before scheduling, occupied seats and pending invitations must total{" "}
          {ENTERPRISE_SEAT_LIMIT} or fewer, and there must be no active Custom
          plan request.{" "}
          <Link
            href={BILLING_PATHS.companySeats}
            className="font-medium text-brand underline underline-offset-2"
          >
            Review seats
          </Link>
        </p>
      </div>
      {feedback ? <div className="mt-4">{feedback}</div> : null}
      <form className="mt-6 flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
        <Button type="submit" className="h-12 text-label" disabled={isPending}>
          {isPending ? "Scheduling..." : "Schedule downgrade"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-label"
          disabled={isPending}
          onClick={onCancel}
        >
          Keep Custom
        </Button>
      </form>
    </dialog>
  );
}
