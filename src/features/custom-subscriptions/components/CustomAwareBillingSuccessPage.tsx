"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui";
import {
  AuthFormAlert,
  AuthPageShell,
  AuthSessionLoading,
} from "@/features/auth";
import {
  assignHostedBillingUrl,
  BILLING_PATHS,
  BillingSuccessPage,
  resolveHostedBillingUrl,
} from "@/features/billing";

import { useCustomOfferState } from "../hooks/useCustomOfferState";
import { useAcceptCustomOfferMutation } from "../hooks/useCustomSubscriptionMutations";
import { useNowMs } from "../hooks/useNowMs";
import {
  classifyCustomSubscriptionError,
  type ClassifiedCustomSubscriptionError,
} from "../utils/classifyCustomSubscriptionError";
import {
  CUSTOM_OFFER_FAST_POLL_WINDOW_MS,
  selectCustomPaymentLink,
} from "../utils/selectCustomRequestView";
import { CustomSubscriptionAlert } from "./CustomSubscriptionAlert";

const SECONDARY_LINK_CLASS_NAME =
  "text-center text-label text-white/48 underline underline-offset-2";

/**
 * Stripe Checkout returns here for every plan. A Custom payment still open on
 * the status endpoint is reconciled here; everything else (including a
 * finished Custom activation) falls through to the standard billing
 * reconciliation, which waits for the server and the company context.
 */
export function CustomAwareBillingSuccessPage() {
  const [fastPollUntil] = useState(
    () => Date.now() + CUSTOM_OFFER_FAST_POLL_WINDOW_MS,
  );
  const offerStateQuery = useCustomOfferState({ fastPollUntil });
  const nowMs = useNowMs(5_000);
  const acceptMutation = useAcceptCustomOfferMutation();
  const [actionError, setActionError] =
    useState<ClassifiedCustomSubscriptionError | null>(null);
  const state = offerStateQuery.data;
  const status = state?.request.status;

  if (!offerStateQuery.isContextKnown) {
    return <AuthSessionLoading />;
  }

  if (!offerStateQuery.isCustomerContext || !state) {
    if (offerStateQuery.isCustomerContext && offerStateQuery.isPending) {
      return <AuthSessionLoading />;
    }

    return <BillingSuccessPage />;
  }

  if (status === "payment_pending") {
    const paymentLink = selectCustomPaymentLink(state.offer);
    const timedOut = nowMs >= fastPollUntil;

    return (
      <AuthPageShell
        title={timedOut ? "Still confirming your plan" : "Confirming your Custom plan"}
      >
        <div className="flex flex-col gap-6">
          <AuthFormAlert variant="info" role="status">
            {timedOut
              ? "Billing has not confirmed your payment yet. We'll email you when your Custom plan is active, or you can refresh later."
              : "Waiting for billing to confirm your payment. Access is not granted from this redirect."}
          </AuthFormAlert>
          {paymentLink?.kind === "checkout" ? (
            <Button
              type="button"
              onClick={() => {
                assignHostedBillingUrl(paymentLink.url);
              }}
            >
              Continue payment
            </Button>
          ) : null}
          {paymentLink?.kind === "invoice" &&
          resolveHostedBillingUrl(paymentLink.url) ? (
            <a
              href={resolveHostedBillingUrl(paymentLink.url) ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[52px] items-center justify-center rounded-button bg-brand px-5 text-body-lg font-medium text-white transition-colors hover:bg-brand/90"
            >
              Open invoice in new tab
            </a>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            disabled={offerStateQuery.isFetching}
            onClick={() => {
              void offerStateQuery.refetch();
            }}
          >
            {offerStateQuery.isFetching ? "Refreshing..." : "Refresh"}
          </Button>
          <Link href={BILLING_PATHS.custom} className={SECONDARY_LINK_CLASS_NAME}>
            View your Custom plan request
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  if (status === "offered" && state.offer) {
    const offer = state.offer;

    const payNow = async () => {
      setActionError(null);

      try {
        const result = await acceptMutation.mutateAsync({ offerId: offer.id });

        if (result.payment_kind === "checkout") {
          assignHostedBillingUrl(result.payment_url);
          return;
        }

        void offerStateQuery.refetch();
      } catch (error) {
        setActionError(classifyCustomSubscriptionError(error));
      }
    };

    return (
      <AuthPageShell title="Payment was not completed">
        <div className="flex flex-col gap-6">
          <AuthFormAlert variant="info" role="status">
            The payment attempt ended without a charge. Your offer is still
            available — you can pay again while it is valid.
          </AuthFormAlert>
          <CustomSubscriptionAlert classified={actionError} />
          <Button
            type="button"
            disabled={acceptMutation.isPending}
            onClick={() => {
              void payNow();
            }}
          >
            {acceptMutation.isPending ? "Starting payment..." : "Pay now"}
          </Button>
          <Link href={BILLING_PATHS.custom} className={SECONDARY_LINK_CLASS_NAME}>
            Review the offer
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell title="Your Custom plan request">
      <div className="flex flex-col gap-6">
        <AuthFormAlert variant="info" role="status">
          Your Custom plan request is not waiting for a payment. Check its
          latest status for next steps.
        </AuthFormAlert>
        <Link
          href={BILLING_PATHS.custom}
          className="inline-flex h-[52px] items-center justify-center rounded-button bg-brand px-5 text-body-lg font-medium text-white transition-colors hover:bg-brand/90"
        >
          View Custom plan request
        </Link>
      </div>
    </AuthPageShell>
  );
}
