"use client";

import { useState } from "react";

import { Button, Card } from "@/components/ui";
import { useResendCooldown } from "@/features/auth";
import {
  assignHostedBillingUrl,
  formatLocalDateTime,
  resolveHostedBillingUrl,
} from "@/features/billing";

import {
  useCancelCustomPaymentMutation,
  useResumeCustomPaymentMutation,
} from "../hooks/useCustomSubscriptionMutations";
import type {
  AcceptanceResult,
  CustomOffer,
  CustomRequest,
} from "../schemas/customSubscriptionSchemas";
import {
  classifyCustomSubscriptionError,
  type ClassifiedCustomSubscriptionError,
} from "../utils/classifyCustomSubscriptionError";
import { formatMonthlyPrice } from "../utils/formatCustomSubscription";
import { selectCustomPaymentLink } from "../utils/selectCustomRequestView";
import { CustomConfirmDialog } from "./CustomOfferDialogs";
import { CustomSubscriptionAlert } from "./CustomSubscriptionAlert";

const INVOICE_LINK_CLASS_NAME =
  "inline-flex h-12 items-center justify-center rounded-button border border-transparent bg-brand px-5 text-label font-medium text-white transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

type CustomPaymentPanelProps = {
  request: CustomRequest;
  offer: CustomOffer | null;
  isRefreshing: boolean;
  onPaymentOpened: () => void;
  onActivationStarted: () => void;
  onNotice: (message: string) => void;
  onRefresh: () => void;
};

export function CustomPaymentPanel({
  request,
  offer,
  isRefreshing,
  onPaymentOpened,
  onActivationStarted,
  onNotice,
  onRefresh,
}: CustomPaymentPanelProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [actionError, setActionError] =
    useState<ClassifiedCustomSubscriptionError | null>(null);
  const [resumedInvoiceUrl, setResumedInvoiceUrl] = useState<string | null>(
    null,
  );
  const cancelRetry = useResendCooldown(0);
  const resumeMutation = useResumeCustomPaymentMutation();
  const cancelMutation = useCancelCustomPaymentMutation();
  const paymentLink = selectCustomPaymentLink(offer);
  const invoiceUrl = resolveHostedBillingUrl(
    resumedInvoiceUrl ??
      (paymentLink?.kind === "invoice" ? paymentLink.url : null),
  );
  const isBusy = resumeMutation.isPending || cancelMutation.isPending;
  const isCompanyPlan = request.target_scope_type === "company";

  const handleOutcome = (result: AcceptanceResult) => {
    if (result.request_status === "activated") {
      onActivationStarted();
      return;
    }

    if (result.payment_kind === "checkout") {
      if (!assignHostedBillingUrl(result.payment_url)) {
        onActivationStarted();
      }
      return;
    }

    if (result.payment_kind === "invoice") {
      const url = resolveHostedBillingUrl(result.payment_url);

      if (!url) {
        onActivationStarted();
        return;
      }

      setResumedInvoiceUrl(url);
      onPaymentOpened();
    }
  };

  const handleResume = async () => {
    if (!offer || isBusy) {
      return;
    }

    setActionError(null);

    try {
      handleOutcome(await resumeMutation.mutateAsync({ offerId: offer.id }));
    } catch (error) {
      const classified = classifyCustomSubscriptionError(error);

      if (classified.action === "poll_activation") {
        onActivationStarted();
        return;
      }

      setActionError(classified);
    }
  };

  const handleCancel = async () => {
    if (!offer || isBusy) {
      return;
    }

    setDialogError(null);

    try {
      const updated = await cancelMutation.mutateAsync({ offerId: offer.id });
      setCancelOpen(false);
      setResumedInvoiceUrl(null);
      onNotice(
        updated.status === "offered"
          ? "Payment cancelled. Your offer is available again and the pause has been lifted."
          : "Payment cancelled. The offer had expired, so your request is back under review.",
      );
    } catch (error) {
      const classified = classifyCustomSubscriptionError(error);

      if (classified.action === "poll_activation") {
        setCancelOpen(false);
        onActivationStarted();
        return;
      }

      if (classified.kind === "custom_subscription_payment_in_flight") {
        cancelRetry.startCooldown(classified.retryAfterSeconds ?? 60);
        setCancelOpen(false);
        setActionError(classified);
        return;
      }

      if (classified.refetch || classified.action !== "none") {
        setCancelOpen(false);
        setActionError(classified);
        return;
      }

      setDialogError(classified.message);
    }
  };

  return (
    <Card className="flex flex-col gap-5 rounded-button p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-card-title font-medium text-white">
          Payment in progress
        </h2>
        {offer ? (
          <p className="text-input font-medium text-text-body">
            {formatMonthlyPrice(offer.amount_minor)} · {offer.seats} seats ·{" "}
            {offer.reports} reports per month
          </p>
        ) : null}
        <p className="text-label text-text-muted">
          {isCompanyPlan
            ? "Seats, invitations, quota changes and report generation are paused for your company until the payment finishes or is cancelled."
            : "Report generation is paused until the payment finishes or is cancelled."}
        </p>
        {offer?.checkout_expires_at ? (
          <p className="text-helper text-text-muted">
            Checkout link valid until{" "}
            {formatLocalDateTime(offer.checkout_expires_at)}
          </p>
        ) : null}
      </div>

      {invoiceUrl ? (
        <p className="text-label text-text-body">
          Stripe opens the invoice in a new tab. If your card is declined you
          can use another card on the same invoice page. Keep this page open —
          it updates automatically when the payment is confirmed.
        </p>
      ) : paymentLink === null ? (
        <p className="text-label text-text-body" role="status">
          Payment received. Activating your plan…
        </p>
      ) : null}

      <CustomSubscriptionAlert classified={actionError} />

      <div className="flex flex-wrap gap-3">
        {invoiceUrl ? (
          <a
            href={invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={INVOICE_LINK_CLASS_NAME}
            onClick={onPaymentOpened}
          >
            Open invoice in new tab
          </a>
        ) : null}
        {paymentLink?.kind === "checkout" || !invoiceUrl ? (
          <Button
            type="button"
            className="h-12 text-label"
            disabled={isBusy || !offer}
            onClick={() => {
              void handleResume();
            }}
          >
            {resumeMutation.isPending ? "Opening payment..." : "Continue payment"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="h-12 text-label"
            disabled={isBusy || !offer}
            onClick={() => {
              void handleResume();
            }}
          >
            {resumeMutation.isPending ? "Refreshing link..." : "Get a new payment link"}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-label"
          disabled={isBusy || !offer || cancelRetry.isCoolingDown}
          onClick={() => {
            setDialogError(null);
            setCancelOpen(true);
          }}
        >
          {cancelRetry.isCoolingDown
            ? `Cancel payment (${cancelRetry.secondsRemaining}s)`
            : "Cancel payment"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-label"
          disabled={isRefreshing}
          onClick={onRefresh}
        >
          {isRefreshing ? "Refreshing..." : "Refresh status"}
        </Button>
      </div>

      <CustomConfirmDialog
        open={cancelOpen}
        title="Cancel payment"
        confirmLabel={cancelMutation.isPending ? "Cancelling..." : "Cancel payment"}
        isPending={cancelMutation.isPending}
        errorMessage={dialogError}
        onClose={() => {
          setCancelOpen(false);
          setDialogError(null);
        }}
        onConfirm={() => {
          void handleCancel();
        }}
      >
        <p>
          This closes the open Stripe payment and lifts the pause immediately.
          If the offer is still valid you can pay again later.
        </p>
        <p className="text-helper text-text-muted">
          If you have already paid, nothing is cancelled and your plan will
          activate shortly.
        </p>
      </CustomConfirmDialog>
    </Card>
  );
}
