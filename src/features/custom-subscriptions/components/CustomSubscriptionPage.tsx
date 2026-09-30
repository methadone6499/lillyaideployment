"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, Card } from "@/components/ui";
import {
  AuthFormAlert,
  buildLoginRedirect,
  getActiveContext,
  getAuthUserInstitutionName,
} from "@/features/auth";
import {
  assignHostedBillingUrl,
  BILLING_PATHS,
  BillingPageFrame,
  canRequestCustomPlan,
  OperationLockBanner,
  resolveHostedBillingUrl,
  useSubscriptionOverview,
} from "@/features/billing";

import { useCustomOfferState } from "../hooks/useCustomOfferState";
import { useCancelCustomRequestMutation } from "../hooks/useCustomSubscriptionMutations";
import type {
  AcceptanceResult,
  CustomOffer,
  CustomRequestStatus,
} from "../schemas/customSubscriptionSchemas";
import {
  classifyCustomSubscriptionError,
  isCustomPermissionDeniedError,
  type ClassifiedCustomSubscriptionError,
} from "../utils/classifyCustomSubscriptionError";
import {
  CUSTOM_OFFER_FAST_POLL_WINDOW_MS,
  isOutdatedOfferLink,
  selectCustomRequestView,
} from "../utils/selectCustomRequestView";
import {
  CustomActivationPanel,
  CustomPlanUpdatedPanel,
} from "./CustomActivationPanel";
import { CustomCommunicationList } from "./CustomCommunicationList";
import { CustomConfirmDialog } from "./CustomOfferDialogs";
import { CustomOfferPanel } from "./CustomOfferPanel";
import { CustomPaymentPanel } from "./CustomPaymentPanel";
import { CustomRequestForm } from "./CustomRequestForm";
import { CustomRequestSummary } from "./CustomRequestSummary";
import { CustomRequestStatusPill } from "./CustomStatusPill";
import { CustomSubscriptionAlert } from "./CustomSubscriptionAlert";

type CustomSubscriptionPageProps = {
  /** Informational only: the page always shows the API's current offer. */
  offerIdHint?: string | null;
};

function MessageCard({ title, children }: { title: string; children: string }) {
  return (
    <Card className="mt-8 flex max-w-2xl flex-col gap-3 rounded-button p-6">
      <h2 className="text-card-title font-medium text-white">{title}</h2>
      <p className="text-label text-text-muted">{children}</p>
    </Card>
  );
}

export function CustomSubscriptionPage({
  offerIdHint = null,
}: CustomSubscriptionPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [fastPollUntil, setFastPollUntil] = useState<number | null>(null);
  const offerStateQuery = useCustomOfferState({ fastPollUntil });
  const { authMe } = offerStateQuery;
  const overviewQuery = useSubscriptionOverview({
    enabled: offerStateQuery.isCustomerContext,
  });
  const cancelRequestMutation = useCancelCustomRequestMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activationRequested, setActivationRequested] = useState(false);
  const [planUpdatedOffer, setPlanUpdatedOffer] = useState<CustomOffer | null>(
    null,
  );
  const [cancelRequestOpen, setCancelRequestOpen] = useState(false);
  const [cancelRequestError, setCancelRequestError] = useState<string | null>(
    null,
  );
  const [actionError, setActionError] =
    useState<ClassifiedCustomSubscriptionError | null>(null);
  const [observedStatus, setObservedStatus] = useState<
    CustomRequestStatus | null | undefined
  >(undefined);
  const state = offerStateQuery.data;
  const currentStatus =
    state === undefined ? undefined : (state?.request.status ?? null);

  // A payment that disappears from the status endpoint has finished; switch to
  // server-side activation checks instead of showing the empty request form.
  if (currentStatus !== undefined && currentStatus !== observedStatus) {
    if (observedStatus === "payment_pending" && currentStatus === null) {
      setActivationRequested(true);
    }
    setObservedStatus(currentStatus);
  }

  const queryError = offerStateQuery.error
    ? classifyCustomSubscriptionError(offerStateQuery.error)
    : null;
  const hasInvalidSession = queryError?.kind === "invalid_session";

  useEffect(() => {
    if (hasInvalidSession) {
      router.replace(buildLoginRedirect(pathname));
    }
  }, [hasInvalidSession, pathname, router]);

  const startFastPoll = () => {
    setFastPollUntil(Date.now() + CUSTOM_OFFER_FAST_POLL_WINDOW_MS);
    void offerStateQuery.refetch();
  };

  const startActivation = () => {
    setNotice(null);
    setActivationRequested(true);
    startFastPoll();
  };

  const handleAccepted = (result: AcceptanceResult) => {
    setNotice(null);

    if (result.payment_kind === "none" || result.request_status === "activated") {
      setPlanUpdatedOffer(result.offer);
      return;
    }

    if (result.payment_kind === "checkout") {
      if (!assignHostedBillingUrl(result.payment_url)) {
        startActivation();
      }
      return;
    }

    if (!resolveHostedBillingUrl(result.payment_url)) {
      startActivation();
      return;
    }

    setNotice(
      "Your invoice is ready. Open it in a new tab to pay; this page updates automatically.",
    );
    startFastPoll();
  };

  const handleCancelRequest = async () => {
    if (!state) {
      return;
    }

    setCancelRequestError(null);

    try {
      await cancelRequestMutation.mutateAsync({
        requestId: state.request.id,
        expectedRevision: state.request.revision,
      });
      setCancelRequestOpen(false);
      setIsEditing(false);
      setNotice("Your Custom plan request was cancelled.");
    } catch (error) {
      const classified = classifyCustomSubscriptionError(error);

      if (classified.refetch) {
        setCancelRequestOpen(false);
        setActionError(classified);
        return;
      }

      setCancelRequestError(classified.message);
    }
  };

  const renderContent = () => {
    if (!offerStateQuery.isContextKnown || hasInvalidSession) {
      return (
        <p className="mt-12 text-input text-text-muted" role="status">
          Loading your Custom plan…
        </p>
      );
    }

    if (
      !offerStateQuery.isCustomerContext ||
      isCustomPermissionDeniedError(offerStateQuery.error)
    ) {
      return (
        <MessageCard title="Custom plan requests are not available">
          Custom plan requests are made from a personal or company account.
          This account does not need a subscription.
        </MessageCard>
      );
    }

    if (!canRequestCustomPlan(authMe)) {
      return (
        <MessageCard title="Only the billing owner can manage a Custom plan">
          Ask your company&apos;s billing owner to request or manage the Custom
          plan.
        </MessageCard>
      );
    }

    if (planUpdatedOffer) {
      return (
        <div className="mt-8 max-w-[1100px]">
          <CustomPlanUpdatedPanel offer={planUpdatedOffer} />
        </div>
      );
    }

    if (
      activationRequested &&
      (state === null || state?.request.status === "payment_pending")
    ) {
      return (
        <div className="mt-8 max-w-[1100px]">
          <CustomActivationPanel />
        </div>
      );
    }

    if (offerStateQuery.isPending) {
      return (
        <p className="mt-12 text-input text-text-muted" role="status">
          Loading your Custom plan…
        </p>
      );
    }

    if (state === undefined) {
      return (
        <div className="mt-8 flex max-w-xl flex-col gap-4">
          <CustomSubscriptionAlert classified={queryError} />
          {queryError ? null : (
            <AuthFormAlert variant="error" className="text-left">
              We could not load your Custom plan request. Please try again.
            </AuthFormAlert>
          )}
          <Button
            type="button"
            className="h-12 w-fit text-label"
            disabled={offerStateQuery.isFetching}
            onClick={() => {
              void offerStateQuery.refetch();
            }}
          >
            {offerStateQuery.isFetching ? "Refreshing..." : "Try again"}
          </Button>
        </div>
      );
    }

    if (state === null) {
      const subscription = overviewQuery.data?.subscription;
      const isCustomSubscriber = subscription?.plan_type === "custom";

      return (
        <Card className="mt-8 flex max-w-[1100px] flex-col gap-6 rounded-button p-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-card-title font-medium text-white">
              {isCustomSubscriber ? "Request new Custom terms" : "Request a Custom plan"}
            </h2>
            <p className="text-label text-text-muted">
              {isCustomSubscriber
                ? `Your Custom plan currently includes ${subscription.limits.seats} seats and ${subscription.limits.reports} reports per month. Tell us what you need and we'll send a revised offer.`
                : "Tell us how many seats and reports you need. Requests are non-binding: we'll review them and email you an offer that is valid for 7 days."}
            </p>
          </div>
          <CustomRequestForm
            mode="create"
            includeCompanyName={getActiveContext(authMe)?.type === "personal"}
            defaultCompanyName={getAuthUserInstitutionName(authMe?.user)}
            defaultBillingEmail={authMe?.user.email ?? ""}
            onSubmitted={() => {
              setNotice(
                "Thanks — your request was submitted. We'll email you when an offer is ready.",
              );
            }}
          />
        </Card>
      );
    }

    const { request, communications } = state;
    const view = selectCustomRequestView(state);

    return (
      <div className="mt-8 flex max-w-[1100px] flex-col gap-6">
        <Card className="flex flex-col gap-6 rounded-button p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-card-title font-medium text-white">
                {view.headline}
              </h2>
              {view.description && view.kind !== "action_required" ? (
                <p className="text-label text-text-muted">{view.description}</p>
              ) : null}
            </div>
            <CustomRequestStatusPill status={request.status} />
          </div>

          {view.kind === "action_required" && request.action_required_message ? (
            <div className="rounded-card border border-status-running/[0.12] bg-status-running/[0.08] p-4">
              <p className="text-helper text-text-muted">Message from our team</p>
              <p className="mt-1 whitespace-pre-wrap text-label text-white">
                {request.action_required_message}
              </p>
              <p className="mt-2 text-helper text-text-muted">
                Update your request below; saving sends it back for review.
              </p>
            </div>
          ) : null}

          {isEditing && view.canEdit ? (
            <CustomRequestForm
              key={request.revision}
              mode="edit"
              request={request}
              onCancel={() => setIsEditing(false)}
              onSubmitted={() => {
                setIsEditing(false);
                setNotice("Your request was updated.");
              }}
            />
          ) : (
            <CustomRequestSummary request={request} />
          )}

          {view.canEdit && !isEditing ? (
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                className="h-12 text-label"
                onClick={() => {
                  setNotice(null);
                  setActionError(null);
                  setIsEditing(true);
                }}
              >
                Edit request
              </Button>
              {view.canCancel ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12 text-label"
                  onClick={() => {
                    setCancelRequestError(null);
                    setCancelRequestOpen(true);
                  }}
                >
                  Cancel request
                </Button>
              ) : null}
            </div>
          ) : null}
        </Card>

        {view.kind === "offered" && view.offer ? (
          <CustomOfferPanel
            key={view.offer.id}
            request={request}
            offer={view.offer}
            overview={overviewQuery.data}
            onAccepted={handleAccepted}
            onActivationStarted={startActivation}
            onNotice={setNotice}
          />
        ) : null}

        {view.kind === "offered" && !view.offer ? (
          <MessageCard title="Loading your offer">
            Your offer is being prepared. Refresh in a moment.
          </MessageCard>
        ) : null}

        {view.kind === "payment_pending" ? (
          <CustomPaymentPanel
            request={request}
            offer={view.offer}
            isRefreshing={offerStateQuery.isFetching}
            onPaymentOpened={startFastPoll}
            onActivationStarted={startActivation}
            onNotice={setNotice}
            onRefresh={startFastPoll}
          />
        ) : null}

        <CustomCommunicationList communications={communications} />

        <CustomConfirmDialog
          open={cancelRequestOpen}
          title="Cancel Custom plan request"
          confirmLabel={
            cancelRequestMutation.isPending ? "Cancelling..." : "Cancel request"
          }
          isPending={cancelRequestMutation.isPending}
          errorMessage={cancelRequestError}
          onClose={() => {
            setCancelRequestOpen(false);
            setCancelRequestError(null);
          }}
          onConfirm={() => {
            void handleCancelRequest();
          }}
        >
          <p>
            Withdraw this Custom plan request? You can submit a new request
            later.
          </p>
        </CustomConfirmDialog>
      </div>
    );
  };

  return (
    <BillingPageFrame title="Custom plan">
      <Link
        href={BILLING_PATHS.settings}
        className="mt-4 w-fit text-label font-medium text-text-step transition-colors hover:text-white"
      >
        ← Back to billing
      </Link>
      <OperationLockBanner className="mt-8 max-w-[1100px]" showManagePayment={false} />
      {isOutdatedOfferLink(offerIdHint, state) ? (
        <p className="mt-8 max-w-[1100px] text-label text-text-muted" role="status">
          The offer in your email is no longer current. Showing your latest
          Custom plan status.
        </p>
      ) : null}
      {notice ? (
        <p className="mt-8 max-w-[1100px] text-label text-brand" role="status">
          {notice}
        </p>
      ) : null}
      {actionError ? (
        <div className="mt-8 max-w-[1100px]">
          <CustomSubscriptionAlert classified={actionError} />
        </div>
      ) : null}
      {renderContent()}
    </BillingPageFrame>
  );
}
