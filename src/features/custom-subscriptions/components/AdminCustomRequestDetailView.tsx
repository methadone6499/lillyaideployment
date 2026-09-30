"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, Card } from "@/components/ui";
import { useResendCooldown } from "@/features/auth";
import { formatLocalDateTime, formatPlanName } from "@/features/billing";

import { useAdminCustomRequestDetail } from "../hooks/useAdminCustomRequests";
import {
  useAddAdminNoteMutation,
  useCancelOfferMutation,
  useCloseAdminCustomRequestMutation,
  useCreateOfferDraftMutation,
  useMarkActionRequiredMutation,
  usePublishOfferMutation,
  useResendAdminCloseEmailMutation,
  useResendAdminOfferEmailMutation,
  useStartAdminReviewMutation,
  useUpdateOfferDraftMutation,
} from "../hooks/useAdminCustomSubscriptionMutations";
import {
  CUSTOM_TEXT_MAX_LENGTH,
  type AdminIdentity,
  type CustomOffer,
  type EmailDelivery,
  type OfferTerms,
} from "../schemas/customSubscriptionSchemas";
import {
  ADMIN_CUSTOM_REQUESTS_PATH,
  selectAdminCustomRequestActions,
} from "../utils/adminCustomRequestQueue";
import {
  classifyCustomSubscriptionError,
  type ClassifiedCustomSubscriptionError,
} from "../utils/classifyCustomSubscriptionError";
import { formatIdentity } from "../utils/formatCustomSubscription";
import { AdminCommunicationTimeline } from "./AdminCommunicationTimeline";
import { AdminCustomOfferList } from "./AdminCustomOfferList";
import { AdminMessageDialog } from "./AdminMessageDialog";
import { AdminOfferDraftForm } from "./AdminOfferDraftForm";
import { CustomConfirmDialog } from "./CustomOfferDialogs";
import {
  CustomRequestStatusPill,
  EmailDeliveryStatusPill,
} from "./CustomStatusPill";
import { CustomSubscriptionAlert } from "./CustomSubscriptionAlert";
import { CustomTextArea } from "./CustomTextArea";

type OpenDialog =
  | { kind: "action_required" }
  | { kind: "close" }
  | { kind: "cancel_offer"; offer: CustomOffer }
  | null;

type Notice = { tone: "success" | "warning"; message: string };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-surface-subtle p-4">
      <dt className="text-helper text-text-muted">{label}</dt>
      <dd className="mt-1 break-words text-label font-medium text-white">{value}</dd>
    </div>
  );
}

function formatIdentityWithEmail(identity: AdminIdentity): string {
  const name = formatIdentity(identity);
  return identity.email && identity.email !== name
    ? `${name} (${identity.email})`
    : name;
}

function describeCloseEmail(email: EmailDelivery): Notice {
  return email.status === "sent"
    ? { tone: "success", message: "Closed and customer notified." }
    : {
        tone: "warning",
        message:
          "Closed, but the email wasn't sent. Resend the closure email when you're ready.",
      };
}

export function AdminCustomRequestDetailView({ requestId }: { requestId: string }) {
  const detailQuery = useAdminCustomRequestDetail({ requestId });
  const reviewMutation = useStartAdminReviewMutation(requestId);
  const actionRequiredMutation = useMarkActionRequiredMutation(requestId);
  const closeMutation = useCloseAdminCustomRequestMutation(requestId);
  const resendCloseMutation = useResendAdminCloseEmailMutation(requestId);
  const noteMutation = useAddAdminNoteMutation(requestId);
  const createDraftMutation = useCreateOfferDraftMutation(requestId);
  const updateDraftMutation = useUpdateOfferDraftMutation(requestId);
  const publishMutation = usePublishOfferMutation(requestId);
  const cancelOfferMutation = useCancelOfferMutation(requestId);
  const resendOfferMutation = useResendAdminOfferEmailMutation(requestId);
  const offerEmailCooldown = useResendCooldown(0);
  const closeEmailCooldown = useResendCooldown(0);
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [noteMessage, setNoteMessage] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [actionError, setActionError] =
    useState<ClassifiedCustomSubscriptionError | null>(null);
  const [closeEmailLimitReached, setCloseEmailLimitReached] = useState(false);
  const [offerEmailLimitReached, setOfferEmailLimitReached] = useState(false);
  const isBusy =
    reviewMutation.isPending ||
    actionRequiredMutation.isPending ||
    closeMutation.isPending ||
    createDraftMutation.isPending ||
    updateDraftMutation.isPending ||
    publishMutation.isPending ||
    cancelOfferMutation.isPending;

  const detail = detailQuery.data;

  if (detailQuery.isPending) {
    return (
      <p className="mt-10 text-input text-text-muted" role="status">
        Loading Custom plan request…
      </p>
    );
  }

  if (!detail) {
    const classified = classifyCustomSubscriptionError(detailQuery.error);
    const isMissing = classified.kind === "custom_subscription_request_not_found" ||
      classified.kind === "not_found";

    return (
      <Card className="mt-10 flex max-w-2xl flex-col gap-4 rounded-button p-6">
        <p className="text-label text-text-body" role="alert">
          {isMissing
            ? "This Custom plan request could not be found."
            : classified.message}
        </p>
        <div className="flex flex-wrap gap-3">
          {isMissing ? null : (
            <Button
              type="button"
              className="h-11 text-label"
              disabled={detailQuery.isFetching}
              onClick={() => {
                void detailQuery.refetch();
              }}
            >
              {detailQuery.isFetching ? "Refreshing..." : "Try again"}
            </Button>
          )}
          <Link
            href={ADMIN_CUSTOM_REQUESTS_PATH}
            className="inline-flex h-11 items-center rounded-button border border-border-default bg-surface-default px-4 text-label font-medium text-white hover:bg-surface-elevated"
          >
            Back to requests
          </Link>
        </div>
      </Card>
    );
  }

  const { request, offers, communications, close_email: closeEmail } = detail;
  const actions = selectAdminCustomRequestActions(detail);
  const revision = request.revision;

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string | null,
  ): Promise<boolean> => {
    setNotice(null);
    setActionError(null);

    try {
      await action();
      if (successMessage) {
        setNotice({ tone: "success", message: successMessage });
      }
      return true;
    } catch (error) {
      setActionError(classifyCustomSubscriptionError(error));
      return false;
    }
  };

  const runDialogAction = async <TResult,>(
    action: () => Promise<TResult>,
    onSuccess: (result: TResult) => void,
  ) => {
    setDialogError(null);
    setNotice(null);
    setActionError(null);

    try {
      const result = await action();
      setOpenDialog(null);
      onSuccess(result);
    } catch (error) {
      const classified = classifyCustomSubscriptionError(error);

      if (classified.refetch) {
        setOpenDialog(null);
        setActionError(classified);
        return;
      }

      setDialogError(classified.message);
    }
  };

  const handleCreateDraft = async (terms: OfferTerms) => {
    const created = await runAction(
      () =>
        createDraftMutation.mutateAsync({
          ...terms,
          expected_request_revision: revision,
        }),
      "Draft offer created. Review it, then publish.",
    );

    if (created) {
      setIsCreatingDraft(false);
    }
  };

  const handleSaveDraft = async (offerId: string, terms: OfferTerms) => {
    const saved = await runAction(
      () => updateDraftMutation.mutateAsync({ offerId, terms }),
      "Draft saved.",
    );

    if (saved) {
      setEditingOfferId(null);
    }
  };

  const handleResaveStaleDraft = async () => {
    const draft = actions.draftOffer;

    if (!draft) {
      return;
    }

    await runAction(
      () =>
        updateDraftMutation.mutateAsync({
          offerId: draft.id,
          terms: {
            company_name: draft.company_name,
            amount_minor: draft.amount_minor,
            currency: draft.currency,
            seats: draft.seats,
            reports: draft.reports,
          },
        }),
      "Draft re-saved against the customer's latest request. Review it and publish again.",
    );
  };

  const handleResendOfferEmail = async (offer: CustomOffer) => {
    setNotice(null);
    setActionError(null);

    try {
      const delivery = await resendOfferMutation.mutateAsync(offer.id);
      offerEmailCooldown.startCooldown(60);
      setNotice(
        delivery.status === "sent"
          ? { tone: "success", message: `Offer email sent to ${delivery.recipient_email}.` }
          : { tone: "warning", message: "The offer email could not be confirmed as sent." },
      );
    } catch (error) {
      const classified = classifyCustomSubscriptionError(error);
      if (classified.retryAfterSeconds !== null) {
        offerEmailCooldown.startCooldown(classified.retryAfterSeconds);
      }
      if (classified.action === "daily_limit") {
        setOfferEmailLimitReached(true);
      }
      setActionError(classified);
    }
  };

  const handleResendCloseEmail = async () => {
    setNotice(null);
    setActionError(null);

    try {
      const delivery = await resendCloseMutation.mutateAsync();
      closeEmailCooldown.startCooldown(60);
      setNotice(
        delivery.status === "sent"
          ? { tone: "success", message: `Closure email sent to ${delivery.recipient_email}.` }
          : { tone: "warning", message: "The closure email still wasn't sent. Try again later." },
      );
    } catch (error) {
      const classified = classifyCustomSubscriptionError(error);
      if (classified.retryAfterSeconds !== null) {
        closeEmailCooldown.startCooldown(classified.retryAfterSeconds);
      }
      if (classified.action === "daily_limit") {
        setCloseEmailLimitReached(true);
      }
      setActionError(classified);
    }
  };

  const handleAddNote = async () => {
    const message = noteMessage.trim();

    if (!message) {
      setNoteError("Write a note before saving.");
      return;
    }

    setNoteError(null);

    try {
      await noteMutation.mutateAsync(message);
      setNoteMessage("");
    } catch (error) {
      setNoteError(classifyCustomSubscriptionError(error).message);
    }
  };

  return (
    <div className="mt-10 flex max-w-[1200px] flex-col gap-6">
      <Link
        href={ADMIN_CUSTOM_REQUESTS_PATH}
        className="w-fit text-label font-medium text-text-step transition-colors hover:text-white"
      >
        ← All Custom plan requests
      </Link>

      {notice ? (
        <p
          role="status"
          className={
            notice.tone === "success"
              ? "text-label text-brand"
              : "text-label text-status-running"
          }
        >
          {notice.message}
        </p>
      ) : null}

      <CustomSubscriptionAlert classified={actionError}>
        {actionError?.action === "republish" && actions.draftOffer ? (
          <Button
            type="button"
            variant="secondary"
            className="h-11 text-label"
            disabled={isBusy}
            onClick={() => {
              void handleResaveStaleDraft();
            }}
          >
            Re-save draft
          </Button>
        ) : null}
      </CustomSubscriptionAlert>

      <Card className="flex flex-col gap-6 rounded-button p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-card-title font-medium text-white">
              {request.company_name}
            </h2>
            <p className="mt-1 text-helper text-text-muted">
              Requested {formatLocalDateTime(request.created_at)} · Updated{" "}
              {formatLocalDateTime(request.updated_at)} · Revision {request.revision}
            </p>
          </div>
          <CustomRequestStatusPill status={request.status} />
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Requester" value={formatIdentityWithEmail(request.requester)} />
          <DetailRow label="Billing owner" value={formatIdentityWithEmail(request.billing_owner)} />
          <DetailRow
            label="Target"
            value={
              request.target_scope_type === "company"
                ? `Company · ${request.target_scope_id}`
                : `New company for user · ${request.target_scope_id}`
            }
          />
          <DetailRow
            label="Current plan"
            value={
              request.current_plan_type
                ? formatPlanName(request.current_plan_type)
                : "None (new or former customer)"
            }
          />
          <DetailRow label="Billing email" value={request.billing_email} />
          <DetailRow label="Contact phone" value={request.contact_phone ?? "—"} />
          <DetailRow label="Seats requested" value={String(request.requested_seats)} />
          <DetailRow
            label="Reports per month requested"
            value={String(request.requested_reports)}
          />
        </dl>

        {request.notes ? (
          <div className="rounded-card bg-surface-subtle p-4">
            <p className="text-helper text-text-muted">Customer notes</p>
            <p className="mt-1 whitespace-pre-wrap text-label text-text-body">
              {request.notes}
            </p>
          </div>
        ) : null}

        {request.action_required_message ? (
          <div className="rounded-card border border-status-running/[0.12] bg-status-running/[0.08] p-4">
            <p className="text-helper text-text-muted">Waiting on the customer</p>
            <p className="mt-1 whitespace-pre-wrap text-label text-white">
              {request.action_required_message}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {actions.canStartReview ? (
            <Button
              type="button"
              className="h-11 text-label"
              disabled={isBusy}
              onClick={() => {
                void runAction(
                  () => reviewMutation.mutateAsync(revision),
                  "Review started.",
                );
              }}
            >
              {reviewMutation.isPending ? "Starting..." : "Start review"}
            </Button>
          ) : null}
          {actions.canCreateDraft && !isCreatingDraft ? (
            <Button
              type="button"
              className="h-11 text-label"
              disabled={isBusy}
              onClick={() => setIsCreatingDraft(true)}
            >
              Create offer draft
            </Button>
          ) : null}
          {actions.canRequestInfo ? (
            <Button
              type="button"
              variant="secondary"
              className="h-11 text-label"
              disabled={isBusy}
              onClick={() => {
                setDialogError(null);
                setOpenDialog({ kind: "action_required" });
              }}
            >
              Ask customer for information
            </Button>
          ) : null}
          {actions.canClose ? (
            <Button
              type="button"
              variant="secondary"
              className="h-11 text-label"
              disabled={isBusy}
              onClick={() => {
                setDialogError(null);
                setOpenDialog({ kind: "close" });
              }}
            >
              Close request
            </Button>
          ) : null}
        </div>

        {isCreatingDraft ? (
          <AdminOfferDraftForm
            defaultCompanyName={request.company_name}
            defaultSeats={request.requested_seats}
            defaultReports={request.requested_reports}
            isPending={createDraftMutation.isPending}
            submitLabel={createDraftMutation.isPending ? "Creating..." : "Create draft"}
            onSubmit={(terms) => {
              void handleCreateDraft(terms);
            }}
            onCancel={() => setIsCreatingDraft(false)}
          />
        ) : null}

        {request.status === "closed" && closeEmail ? (
          <div className="flex flex-wrap items-center gap-3 rounded-card bg-surface-subtle p-4">
            <span className="text-label text-text-body">
              Closure email to {closeEmail.recipient_email}
            </span>
            <EmailDeliveryStatusPill status={closeEmail.status} />
            {actions.canResendCloseEmail ? (
              <Button
                type="button"
                variant="secondary"
                className="h-11 text-label"
                disabled={
                  resendCloseMutation.isPending ||
                  closeEmailCooldown.isCoolingDown ||
                  closeEmailLimitReached
                }
                onClick={() => {
                  void handleResendCloseEmail();
                }}
              >
                {resendCloseMutation.isPending
                  ? "Sending..."
                  : closeEmailCooldown.isCoolingDown
                    ? `Resend closure email (${closeEmailCooldown.secondsRemaining}s)`
                    : "Resend closure email"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-4 rounded-button p-6">
        <h2 className="text-card-title font-medium text-white">Offers</h2>
        <AdminCustomOfferList
          offers={offers}
          editingOfferId={editingOfferId}
          defaultCompanyName={request.company_name}
          defaultSeats={request.requested_seats}
          defaultReports={request.requested_reports}
          isBusy={isBusy}
          isResendCoolingDown={
            offerEmailCooldown.isCoolingDown || offerEmailLimitReached
          }
          resendSecondsRemaining={offerEmailCooldown.secondsRemaining}
          onEdit={setEditingOfferId}
          onSaveDraft={(offerId, terms) => {
            void handleSaveDraft(offerId, terms);
          }}
          onPublish={(offer) => {
            void runAction(
              () =>
                publishMutation.mutateAsync({
                  offerId: offer.id,
                  expectedRevision: revision,
                }),
              "Offer published and emailed to the customer. It is valid for 7 days.",
            );
          }}
          onCancelOffer={(offer) => {
            setDialogError(null);
            setOpenDialog({ kind: "cancel_offer", offer });
          }}
          onResendEmail={(offer) => {
            void handleResendOfferEmail(offer);
          }}
        />
      </Card>

      <Card className="flex flex-col gap-4 rounded-button p-6">
        <h2 className="text-card-title font-medium text-white">
          Messages and internal notes
        </h2>
        <AdminCommunicationTimeline communications={communications} />
        <div className="flex flex-col gap-3 border-t border-border-default pt-4">
          <CustomTextArea
            label="Internal note"
            helper="Only Super Admins can see internal notes."
            maxLength={CUSTOM_TEXT_MAX_LENGTH}
            value={noteMessage}
            error={noteError}
            disabled={noteMutation.isPending}
            onChange={(event) => {
              setNoteMessage(event.target.value);
              setNoteError(null);
            }}
          />
          <Button
            type="button"
            className="h-11 w-fit text-label"
            disabled={noteMutation.isPending || !noteMessage.trim()}
            onClick={() => {
              void handleAddNote();
            }}
          >
            {noteMutation.isPending ? "Saving..." : "Add internal note"}
          </Button>
        </div>
      </Card>

      {openDialog?.kind === "action_required" ? (
        <AdminMessageDialog
          title="Ask the customer for information"
          label="Message to the customer"
          description="The customer sees this message and can edit their request. Saving their edit moves it back to review."
          confirmLabel={actionRequiredMutation.isPending ? "Sending..." : "Send request"}
          requiredMessage="Write what the customer needs to provide."
          isPending={actionRequiredMutation.isPending}
          errorMessage={dialogError}
          onClose={() => setOpenDialog(null)}
          onConfirm={(message) => {
            void runDialogAction(
              () =>
                actionRequiredMutation.mutateAsync({
                  expected_revision: revision,
                  message,
                }),
              () =>
                setNotice({
                  tone: "success",
                  message: "The customer was asked for more information.",
                }),
            );
          }}
        />
      ) : null}

      {openDialog?.kind === "close" ? (
        <AdminMessageDialog
          title="Close request"
          label="Reason (visible to the customer)"
          description="Closing cancels any draft or published offer. The customer receives this reason by email."
          confirmLabel={closeMutation.isPending ? "Closing..." : "Close request"}
          confirmTone="danger"
          requiredMessage="A customer-visible reason is required."
          isPending={closeMutation.isPending}
          errorMessage={dialogError}
          onClose={() => setOpenDialog(null)}
          onConfirm={(reason) => {
            void runDialogAction(
              () =>
                closeMutation.mutateAsync({
                  expected_revision: revision,
                  reason,
                }),
              (closed) => setNotice(describeCloseEmail(closed.close_email)),
            );
          }}
        />
      ) : null}

      {openDialog?.kind === "cancel_offer" ? (
        <CustomConfirmDialog
          open
          title={
            openDialog.offer.status === "draft" ? "Discard draft" : "Withdraw offer"
          }
          confirmLabel={
            cancelOfferMutation.isPending
              ? "Cancelling..."
              : openDialog.offer.status === "draft"
                ? "Discard draft"
                : "Withdraw offer"
          }
          isPending={cancelOfferMutation.isPending}
          errorMessage={dialogError}
          onClose={() => setOpenDialog(null)}
          onConfirm={() => {
            const offer = openDialog.offer;
            void runDialogAction(
              () =>
                cancelOfferMutation.mutateAsync({
                  offerId: offer.id,
                  expectedRevision: revision,
                }),
              () =>
                setNotice({
                  tone: "success",
                  message:
                    offer.status === "draft"
                      ? "Draft discarded."
                      : "Offer withdrawn. The request is back under review.",
                }),
            );
          }}
        >
          <p>
            {openDialog.offer.status === "draft"
              ? "Discard this draft offer? It was never sent to the customer."
              : "Withdraw this published offer? The customer can no longer accept it and the request returns to review."}
          </p>
        </CustomConfirmDialog>
      ) : null}

    </div>
  );
}
