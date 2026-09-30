"use client";

import { Button } from "@/components/ui";
import { formatLocalDateTime } from "@/features/billing";

import type {
  CustomOffer,
  OfferTerms,
} from "../schemas/customSubscriptionSchemas";
import { formatMonthlyPrice } from "../utils/formatCustomSubscription";
import { AdminOfferDraftForm } from "./AdminOfferDraftForm";
import { CustomOfferStatusPill } from "./CustomStatusPill";

type AdminCustomOfferListProps = {
  offers: readonly CustomOffer[];
  editingOfferId: string | null;
  defaultCompanyName: string;
  defaultSeats: number;
  defaultReports: number;
  isBusy: boolean;
  isResendCoolingDown: boolean;
  resendSecondsRemaining: number;
  onEdit: (offerId: string | null) => void;
  onSaveDraft: (offerId: string, terms: OfferTerms) => void;
  onPublish: (offer: CustomOffer) => void;
  onCancelOffer: (offer: CustomOffer) => void;
  onResendEmail: (offer: CustomOffer) => void;
};

function OfferDates({ offer }: { offer: CustomOffer }) {
  const rows = [
    offer.published_at ? `Published ${formatLocalDateTime(offer.published_at)}` : null,
    offer.expires_at ? `Expires ${formatLocalDateTime(offer.expires_at)}` : null,
    offer.accepted_at ? `Accepted ${formatLocalDateTime(offer.accepted_at)}` : null,
    offer.payment_started_at
      ? `Payment started ${formatLocalDateTime(offer.payment_started_at)}`
      : null,
  ].filter((row): row is string => row !== null);

  if (rows.length === 0) {
    return (
      <p className="text-helper text-text-muted">
        Created {formatLocalDateTime(offer.created_at)}
      </p>
    );
  }

  return <p className="text-helper text-text-muted">{rows.join(" · ")}</p>;
}

export function AdminCustomOfferList({
  offers,
  editingOfferId,
  defaultCompanyName,
  defaultSeats,
  defaultReports,
  isBusy,
  isResendCoolingDown,
  resendSecondsRemaining,
  onEdit,
  onSaveDraft,
  onPublish,
  onCancelOffer,
  onResendEmail,
}: AdminCustomOfferListProps) {
  if (offers.length === 0) {
    return <p className="text-label text-text-muted">No offers yet.</p>;
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => {
        const isDraft = offer.status === "draft";
        const isPublished = offer.status === "published";
        const hasOpenPayment =
          offer.status === "accepted" &&
          Boolean(offer.checkout_url || offer.hosted_invoice_url);

        return (
          <article
            key={offer.id}
            className="flex flex-col gap-3 rounded-card border border-border-default bg-surface-subtle p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-label font-medium text-white">
                  Revision {offer.revision} · {offer.company_name}
                </h3>
                <p className="mt-1 text-label text-text-body">
                  {formatMonthlyPrice(offer.amount_minor)} · {offer.seats} seats ·{" "}
                  {offer.reports} reports per month
                </p>
              </div>
              <CustomOfferStatusPill status={offer.status} />
            </div>
            <OfferDates offer={offer} />
            {hasOpenPayment ? (
              <p className="text-helper text-status-running">
                A payment is open. Only the customer can cancel it, or it ends
                on its own.
              </p>
            ) : null}

            {isDraft && editingOfferId === offer.id ? (
              <AdminOfferDraftForm
                offer={offer}
                defaultCompanyName={defaultCompanyName}
                defaultSeats={defaultSeats}
                defaultReports={defaultReports}
                isPending={isBusy}
                submitLabel="Save draft"
                onSubmit={(terms) => onSaveDraft(offer.id, terms)}
                onCancel={() => onEdit(null)}
              />
            ) : null}

            {isDraft && editingOfferId !== offer.id ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  className="h-11 text-label"
                  disabled={isBusy}
                  onClick={() => onPublish(offer)}
                >
                  Publish offer
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 text-label"
                  disabled={isBusy}
                  onClick={() => onEdit(offer.id)}
                >
                  Edit draft
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 text-label"
                  disabled={isBusy}
                  onClick={() => onCancelOffer(offer)}
                >
                  Discard draft
                </Button>
              </div>
            ) : null}

            {isPublished ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 text-label"
                  disabled={isBusy || isResendCoolingDown}
                  onClick={() => onResendEmail(offer)}
                >
                  {isResendCoolingDown
                    ? `Resend offer email (${resendSecondsRemaining}s)`
                    : "Resend offer email"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 text-label"
                  disabled={isBusy}
                  onClick={() => onCancelOffer(offer)}
                >
                  Withdraw offer
                </Button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
