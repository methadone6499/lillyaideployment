"use client";

import Image from "next/image";

import { Card } from "@/components/ui";

type PaymentInformationCardProps = {
  canManage: boolean;
  disabled: boolean;
  isPortalPending: boolean;
  onOpenPortal: () => void;
};

export function PaymentInformationCard({
  canManage,
  disabled,
  isPortalPending,
  onOpenPortal,
}: PaymentInformationCardProps) {
  return (
    <Card className="min-h-[247px] rounded-button p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-card-title font-medium text-white">
          Payment Information
        </h2>
        {canManage ? (
          <button
            type="button"
            aria-label={
              isPortalPending
                ? "Opening billing portal"
                : "Edit payment information in Stripe"
            }
            disabled={disabled}
            onClick={onOpenPortal}
            className="flex size-10 shrink-0 items-center justify-center rounded-field bg-surface-elevated transition-colors hover:bg-white/16 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Image
              src="/billing/edit.svg"
              alt=""
              width={20}
              height={20}
              className="size-5 object-contain"
            />
          </button>
        ) : null}
      </div>

      <div className="mt-7 grid items-center gap-6 sm:grid-cols-[189px_minmax(0,1fr)]">
        <Image
          src="/billing/payment-card.png"
          alt="Payment card illustration"
          width={189}
          height={120}
          className="h-[120px] w-[189px] max-w-full rounded-card object-cover"
        />
        <div>
          <p className="text-input font-medium text-white">
            Secure billing through Stripe
          </p>
          <p className="mt-3 text-input leading-normal text-text-muted">
            {canManage
              ? "View or update your saved payment method and billing details in the billing portal."
              : "Your company billing owner manages payment methods and billing details."}
          </p>
          {canManage ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onOpenPortal}
              className="mt-4 text-input font-medium text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPortalPending ? "Opening portal..." : "Manage payment details"}
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
