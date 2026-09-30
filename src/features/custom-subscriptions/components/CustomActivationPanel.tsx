"use client";

import Link from "next/link";

import { Button, Card } from "@/components/ui";
import { getPostAuthHomePath, useAuthUser } from "@/features/auth";
import { BILLING_PATHS, BillingRequestId } from "@/features/billing";

import { useCustomActivation } from "../hooks/useCustomActivation";
import type { CustomOffer } from "../schemas/customSubscriptionSchemas";
import { formatMonthlyPrice } from "../utils/formatCustomSubscription";

const LINK_CLASS_NAME =
  "inline-flex h-12 items-center justify-center rounded-button border px-5 text-label font-medium text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function CustomActivationPanel() {
  const { authMe } = useAuthUser();
  const activation = useCustomActivation({ enabled: true });
  const { uiState } = activation;

  if (activation.isActivated) {
    return (
      <Card className="flex flex-col gap-4 rounded-button p-6">
        <h2 className="text-card-title font-medium text-white">
          Your Custom plan is active
        </h2>
        <p className="text-label text-text-body" role="status">
          Payment is confirmed and your new limits are live. A new quota period
          has started; assign quota to seat users from seat management.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={getPostAuthHomePath(authMe)}
            className={`${LINK_CLASS_NAME} border-transparent bg-brand hover:bg-brand/90`}
          >
            Go to dashboard
          </Link>
          <Link
            href={BILLING_PATHS.settings}
            className={`${LINK_CLASS_NAME} border-border-default bg-surface-default hover:bg-surface-elevated`}
          >
            View billing
          </Link>
        </div>
      </Card>
    );
  }

  const isTimeout = uiState.kind === "timeout";
  const isTerminal = uiState.kind === "terminal";

  return (
    <Card className="flex flex-col gap-4 rounded-button p-6">
      <h2 className="text-card-title font-medium text-white">
        {isTerminal
          ? "We could not confirm your plan"
          : isTimeout
            ? "Still confirming your payment"
            : "Payment received, activating your plan…"}
      </h2>
      <p
        className={isTerminal ? "text-label text-red-400" : "text-label text-text-body"}
        role={isTerminal ? "alert" : "status"}
      >
        {isTerminal
          ? uiState.message
          : isTimeout
            ? "This is taking longer than usual. We'll email you when your Custom plan is active, or you can refresh later."
            : "This usually takes a few seconds. Access is only granted once billing confirms the payment."}
      </p>
      {isTerminal || isTimeout ? (
        <BillingRequestId requestId={uiState.requestId} />
      ) : null}
      {isTerminal || isTimeout ? (
        <Button
          type="button"
          variant="secondary"
          className="h-12 w-fit text-label"
          disabled={activation.isFetching}
          onClick={activation.restart}
        >
          {activation.isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      ) : null}
    </Card>
  );
}

export function CustomPlanUpdatedPanel({ offer }: { offer: CustomOffer }) {
  return (
    <Card className="flex flex-col gap-4 rounded-button p-6">
      <h2 className="text-card-title font-medium text-white">Plan updated</h2>
      <p className="text-label text-text-body" role="status">
        Your Custom plan now includes {offer.seats} seats and {offer.reports}{" "}
        reports per month at {formatMonthlyPrice(offer.amount_minor)}. There
        was nothing to pay, and the new limits apply immediately.
      </p>
      <p className="text-helper text-text-muted">
        Your current quota period continues. Seat users keep their usage
        history; redistribute the remaining quota from seat management.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href={BILLING_PATHS.companySeats}
          className={`${LINK_CLASS_NAME} border-transparent bg-brand hover:bg-brand/90`}
        >
          Manage seats and quota
        </Link>
        <Link
          href={BILLING_PATHS.settings}
          className={`${LINK_CLASS_NAME} border-border-default bg-surface-default hover:bg-surface-elevated`}
        >
          View billing
        </Link>
      </div>
    </Card>
  );
}
