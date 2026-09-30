"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, Card } from "@/components/ui";
import {
  getActiveContext,
  useAuthUser,
  useResendCooldown,
} from "@/features/auth";
import {
  BILLING_PATHS,
  formatLocalDateTime,
  type SubscriptionOverview,
} from "@/features/billing";
import { useCompanySeats } from "@/features/seat-management";

import {
  useAcceptCustomOfferMutation,
  useDeclineCustomOfferMutation,
  useRequestOfferChangesMutation,
  useResendCustomOfferEmailMutation,
} from "../hooks/useCustomSubscriptionMutations";
import { useNowMs } from "../hooks/useNowMs";
import type {
  AcceptanceResult,
  CustomOffer,
  CustomRequest,
  RequestChangesBody,
} from "../schemas/customSubscriptionSchemas";
import {
  classifyCustomSubscriptionError,
  type ClassifiedCustomSubscriptionError,
} from "../utils/classifyCustomSubscriptionError";
import {
  formatMonthlyPrice,
  formatTimeRemaining,
} from "../utils/formatCustomSubscription";
import {
  predictCustomPaymentKind,
  selectCustomOfferExpiry,
} from "../utils/selectCustomRequestView";
import {
  AcceptOfferDialog,
  DeclineOfferDialog,
  RequestChangesDialog,
  SeatsExceedDialog,
} from "./CustomOfferDialogs";
import { CustomSubscriptionAlert } from "./CustomSubscriptionAlert";

const EXPIRY_TICK_MS = 30_000;

type OpenDialog = "accept" | "changes" | "decline" | "seats" | null;

type CustomOfferPanelProps = {
  request: CustomRequest;
  offer: CustomOffer;
  overview: SubscriptionOverview | undefined;
  onAccepted: (result: AcceptanceResult) => void;
  onActivationStarted: () => void;
  onNotice: (message: string) => void;
};

export function CustomOfferPanel({
  request,
  offer,
  overview,
  onAccepted,
  onActivationStarted,
  onNotice,
}: CustomOfferPanelProps) {
  const { authMe } = useAuthUser();
  const context = getActiveContext(authMe);
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [actionError, setActionError] =
    useState<ClassifiedCustomSubscriptionError | null>(null);
  const [seatsError, setSeatsError] =
    useState<ClassifiedCustomSubscriptionError | null>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [emailLimitReached, setEmailLimitReached] = useState(false);
  const nowMs = useNowMs(EXPIRY_TICK_MS);
  const resendCooldown = useResendCooldown(0);
  const acceptMutation = useAcceptCustomOfferMutation();
  const changesMutation = useRequestOfferChangesMutation();
  const declineMutation = useDeclineCustomOfferMutation();
  const resendMutation = useResendCustomOfferEmailMutation();
  const isCompanyPlan = request.target_scope_type === "company";
  const canCheckSeats =
    isCompanyPlan &&
    context?.type === "company" &&
    context.role === "company_admin";
  const seatsQuery = useCompanySeats({ limit: 1, enabled: canCheckSeats });
  const occupiedSeats = seatsQuery.data?.pages[0]?.summary.occupied_seats;
  const seatsOverOffer =
    occupiedSeats !== undefined && occupiedSeats > offer.seats
      ? occupiedSeats - offer.seats
      : 0;
  const expiry = selectCustomOfferExpiry(offer, nowMs);
  const expectedPaymentKind = predictCustomPaymentKind(request, offer, overview);
  const isBusy =
    acceptMutation.isPending ||
    changesMutation.isPending ||
    declineMutation.isPending;

  const closeDialog = () => {
    setOpenDialog(null);
    setDialogError(null);
  };

  const handleDialogFailure = (error: unknown) => {
    const classified = classifyCustomSubscriptionError(error);

    if (classified.action === "poll_activation") {
      closeDialog();
      onActivationStarted();
      return;
    }

    if (classified.action === "open_seats") {
      setSeatsError(classified);
      setOpenDialog("seats");
      setDialogError(null);
      return;
    }

    if (classified.refetch || classified.action !== "none") {
      closeDialog();
      setActionError(classified);
      return;
    }

    setDialogError(classified.message);
  };

  const handleAccept = async () => {
    setActionError(null);

    try {
      const result = await acceptMutation.mutateAsync({ offerId: offer.id });
      closeDialog();
      onAccepted(result);
    } catch (error) {
      handleDialogFailure(error);
    }
  };

  const handleRequestChanges = async (body: RequestChangesBody) => {
    setActionError(null);

    try {
      await changesMutation.mutateAsync({ offerId: offer.id, body });
      closeDialog();
      onNotice("Thanks — we'll prepare a revised offer and email you when it's ready.");
    } catch (error) {
      handleDialogFailure(error);
    }
  };

  const handleDecline = async (reason: string) => {
    setActionError(null);

    try {
      await declineMutation.mutateAsync({
        offerId: offer.id,
        body: reason ? { reason } : {},
      });
      closeDialog();
      onNotice("You declined the offer. This Custom plan request is closed.");
    } catch (error) {
      handleDialogFailure(error);
    }
  };

  const handleResendEmail = async () => {
    setEmailNotice(null);
    setActionError(null);

    try {
      const delivery = await resendMutation.mutateAsync({ offerId: offer.id });
      resendCooldown.startCooldown(60);
      setEmailNotice(
        delivery.status === "sent"
          ? `Offer email sent to ${delivery.recipient_email}.`
          : "We could not confirm the email was sent. Try again shortly.",
      );
    } catch (error) {
      const classified = classifyCustomSubscriptionError(error);

      if (classified.retryAfterSeconds !== null) {
        resendCooldown.startCooldown(classified.retryAfterSeconds);
      }

      if (classified.action === "daily_limit") {
        setEmailLimitReached(true);
      }

      setActionError(classified);
    }
  };

  return (
    <Card className="flex flex-col gap-6 rounded-button p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-card-title font-medium text-white">
          Offer for {offer.company_name}
        </h2>
        <p className="leading-none font-medium text-brand">
          <span className="text-[42px]">{formatMonthlyPrice(offer.amount_minor)}</span>
        </p>
        <p className="text-input font-medium text-text-body">
          {offer.seats} {offer.seats === 1 ? "seat" : "seats"} · {offer.reports}{" "}
          reports per month
        </p>
        {expiry ? (
          <p
            className={
              expiry.isExpiringSoon || expiry.isExpired
                ? "text-helper text-status-running"
                : "text-helper text-text-muted"
            }
          >
            Valid until {formatLocalDateTime(expiry.expiresAt)} ·{" "}
            {formatTimeRemaining(expiry.msRemaining)}
          </p>
        ) : null}
      </div>

      {expiry?.isExpiringSoon ? (
        <p className="text-label text-status-running" role="status">
          This offer expires very soon and a payment may not be able to start
          safely. Request changes to receive a renewed offer.
        </p>
      ) : null}

      {expiry?.isExpired ? (
        <p className="text-label text-status-running" role="status">
          This offer has expired. Refreshing will move your request back to
          review, and a new offer will be sent.
        </p>
      ) : null}

      {seatsOverOffer > 0 ? (
        <p className="text-label text-status-running" role="status">
          Your company uses {occupiedSeats} seats including pending invitations,
          but this offer includes {offer.seats}. Free {seatsOverOffer}{" "}
          {seatsOverOffer === 1 ? "seat" : "seats"} before accepting.{" "}
          <Link
            href={BILLING_PATHS.companySeats}
            className="font-medium text-brand underline underline-offset-2"
          >
            Manage seats
          </Link>
        </p>
      ) : null}

      <CustomSubscriptionAlert classified={actionError}>
        {actionError?.action === "open_billing" ? (
          <Link
            href={BILLING_PATHS.settings}
            className="text-label font-medium text-brand underline underline-offset-2"
          >
            Open billing
          </Link>
        ) : null}
        {actionError?.action === "request_changes" ? (
          <Button
            type="button"
            variant="secondary"
            className="h-11 text-label"
            onClick={() => setOpenDialog("changes")}
          >
            Request changes
          </Button>
        ) : null}
      </CustomSubscriptionAlert>

      {emailNotice ? (
        <p className="text-label text-brand" role="status">
          {emailNotice}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className="h-12 text-label"
          disabled={isBusy || expiry?.isExpired}
          onClick={() => {
            setDialogError(null);
            setOpenDialog("accept");
          }}
        >
          Accept offer
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-label"
          disabled={isBusy}
          onClick={() => {
            setDialogError(null);
            setOpenDialog("changes");
          }}
        >
          Request changes
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-label"
          disabled={isBusy}
          onClick={() => {
            setDialogError(null);
            setOpenDialog("decline");
          }}
        >
          Decline
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-label"
          disabled={
            resendMutation.isPending ||
            resendCooldown.isCoolingDown ||
            emailLimitReached ||
            expiry?.isExpired
          }
          onClick={() => {
            void handleResendEmail();
          }}
        >
          {resendMutation.isPending
            ? "Sending..."
            : resendCooldown.isCoolingDown
              ? `Resend email (${resendCooldown.secondsRemaining}s)`
              : "Resend offer email"}
        </Button>
      </div>

      <AcceptOfferDialog
        open={openDialog === "accept"}
        offer={offer}
        expectedPaymentKind={expectedPaymentKind}
        isCompanyPlan={isCompanyPlan}
        isPending={acceptMutation.isPending}
        errorMessage={dialogError}
        onClose={closeDialog}
        onConfirm={() => {
          void handleAccept();
        }}
      />
      {openDialog === "changes" ? (
        <RequestChangesDialog
          open
          isPending={changesMutation.isPending}
          errorMessage={dialogError}
          onClose={closeDialog}
          onConfirm={(body) => {
            void handleRequestChanges(body);
          }}
        />
      ) : null}
      {openDialog === "decline" ? (
        <DeclineOfferDialog
          open
          isPending={declineMutation.isPending}
          errorMessage={dialogError}
          onClose={closeDialog}
          onConfirm={(reason) => {
            void handleDecline(reason);
          }}
        />
      ) : null}
      <SeatsExceedDialog
        open={openDialog === "seats"}
        details={seatsError?.seatsExceed ?? null}
        message={seatsError?.message ?? ""}
        onClose={closeDialog}
      />
    </Card>
  );
}
