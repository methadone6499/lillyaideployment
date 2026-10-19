"use client";

import { Button, RequestErrorState } from "@/components/ui";
import { SuccessToast } from "@/components/ui/SuccessToast";
import { hasPermission, useAuthUser } from "@/features/auth";
import {
  DashboardStatusFilter,
  type DashboardStatusFilterOption,
} from "@/features/dashboard";
import { cn } from "@/lib/cn";
import { formatDisplayCount, formatDisplayDate } from "@/lib/formatDisplay";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  useCreateReviewerInvitationMutation,
  useResendReviewerInvitationMutation,
  useRevokeReviewerInvitationMutation,
  useSetReviewerStatusMutation,
} from "../hooks/useReviewerMutations";
import {
  useAdminReviewerInvitations,
  useAdminReviewers,
} from "../hooks/useReviewerQueries";
import {
  createReviewerInvitationRequestSchema,
  type ReviewerInvitationStatus,
  type ReviewerStatus,
  type Reviewer,
} from "../schemas/reviewerSchemas";
import { classifyReviewerError, getReviewerRequestErrorMessage } from "../utils/classifyReviewerError";
import { ReviewerAdminNavigation } from "./ReviewerAdminNavigation";
import { ReviewerStatusDialog } from "./ReviewerStatusDialog";

type ReviewerFilter = ReviewerStatus | "all";
type InvitationFilter = ReviewerInvitationStatus | "all";

const REVIEWER_OPTIONS = [
  { value: "all", label: "All reviewers" },
  { value: "invited", label: "Invited" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
] as const satisfies readonly DashboardStatusFilterOption<ReviewerFilter>[];

const INVITATION_OPTIONS = [
  { value: "all", label: "All invitations" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "revoked", label: "Revoked" },
  { value: "expired", label: "Expired" },
] as const satisfies readonly DashboardStatusFilterOption<InvitationFilter>[];

const statusTone: Record<ReviewerStatus | ReviewerInvitationStatus, string> = {
  active: "bg-[rgba(16,185,129,0.12)] text-status-success",
  invited: "bg-[rgba(0,101,248,0.12)] text-status-info",
  suspended: "bg-[rgba(217,34,68,0.12)] text-status-danger",
  pending: "bg-[rgba(255,200,92,0.12)] text-status-running",
  accepted: "bg-[rgba(16,185,129,0.12)] text-status-success",
  revoked: "bg-[rgba(217,34,68,0.12)] text-status-danger",
  expired: "bg-white/8 text-text-muted",
};

function StatusPill({ status }: { status: ReviewerStatus | ReviewerInvitationStatus }) {
  return (
    <span className={cn("inline-flex rounded-field px-3 py-2 text-input font-medium capitalize", statusTone[status])}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function getEmailError(email: string): string | null {
  if (!email.trim()) return "Enter the reviewer’s email address.";
  return createReviewerInvitationRequestSchema.safeParse({ email }).success
    ? null
    : "Enter a valid email address, such as reviewer@example.com.";
}

export function AdminReviewerManagement() {
  const { authMe } = useAuthUser();
  const canManage = hasPermission(authMe, "admin:reviewers_manage");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const invitationPendingRef = useRef(false);
  const reviewerStatusPendingRef = useRef(false);
  const [statusConfirmation, setStatusConfirmation] = useState<{
    reviewer: Reviewer;
    activate: boolean;
    errorMessage: string | null;
  } | null>(null);
  const [reviewerFilter, setReviewerFilter] = useState<ReviewerFilter>("all");
  const [invitationFilter, setInvitationFilter] =
    useState<InvitationFilter>("pending");
  const [feedback, setFeedback] = useState<
    { type: "error" | "success"; message: string } | null
  >(null);
  const [resendCooldownIds, setResendCooldownIds] = useState<Set<string>>(
    () => new Set(),
  );
  const cooldownTimers = useRef(new Map<string, number>());

  const reviewersQuery = useAdminReviewers({
    limit: 20,
    status: reviewerFilter === "all" ? undefined : reviewerFilter,
  }, canManage);
  const invitationsQuery = useAdminReviewerInvitations({
    limit: 20,
    status: invitationFilter === "all" ? undefined : invitationFilter,
  }, canManage);
  const createInvitation = useCreateReviewerInvitationMutation();
  const resendInvitation = useResendReviewerInvitationMutation();
  const revokeInvitation = useRevokeReviewerInvitationMutation();
  const setReviewerStatus = useSetReviewerStatusMutation();
  const inviteDisabled = !canManage || createInvitation.isPending ||
    getEmailError(email) !== null || emailError !== null;

  const reviewers = reviewersQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const invitations = invitationsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const showError = (error: unknown) =>
    setFeedback({ type: "error", message: getReviewerRequestErrorMessage(error, "We couldn’t complete this action. Try again.") });

  useEffect(
    () => () => {
      for (const timer of cooldownTimers.current.values()) {
        window.clearTimeout(timer);
      }
    },
    [],
  );

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage || invitationPendingRef.current || createInvitation.isPending) return;
    setFeedback(null);
    const validationError = getEmailError(email) ?? emailError;
    setEmailError(validationError);
    if (validationError) {
      emailInputRef.current?.focus();
      return;
    }
    invitationPendingRef.current = true;
    try {
      await createInvitation.mutateAsync(email.trim());
      setEmail("");
      setEmailError(null);
      setInvitationFilter("pending");
      setFeedback({ type: "success", message: "Reviewer invitation sent." });
    } catch (error) {
      const classified = classifyReviewerError(error);
      if (["reviewer_recipient_ineligible", "reviewer_invitation_already_pending", "account_already_exists"].includes(classified.code)) {
        setEmailError(classified.message);
        emailInputRef.current?.focus();
      } else if (classified.fieldErrors.email) {
        setEmailError("Check this email address and try again.");
        emailInputRef.current?.focus();
      } else {
        setFeedback({ type: "error", message: getReviewerRequestErrorMessage(error, "We couldn’t send this invitation. Check the invitation list before trying again.") });
      }
    } finally {
      invitationPendingRef.current = false;
    }
  };

  const handleReviewerStatusConfirm = async () => {
    if (!canManage || !statusConfirmation || reviewerStatusPendingRef.current) return;
    reviewerStatusPendingRef.current = true;
    const { reviewer, activate } = statusConfirmation;
    setStatusConfirmation({ ...statusConfirmation, errorMessage: null });
    try {
      await setReviewerStatus.mutateAsync({ reviewerId: reviewer.id, active: activate });
      setStatusConfirmation(null);
      setFeedback({
        type: "success",
        message: `${reviewer.email} ${activate ? "reactivated" : "suspended"}.`,
      });
    } catch (error) {
      setStatusConfirmation({
        reviewer,
        activate,
        errorMessage: getReviewerRequestErrorMessage(error, "We couldn’t update this reviewer. Try again."),
      });
    } finally {
      reviewerStatusPendingRef.current = false;
    }
  };

  const handleResend = async (invitationId: string) => {
    setFeedback(null);
    try {
      await resendInvitation.mutateAsync(invitationId);
      setFeedback({ type: "success", message: "Invitation resent." });
    } catch (error) {
      const classified = classifyReviewerError(error);
      setFeedback({ type: "error", message: getReviewerRequestErrorMessage(error, "We couldn’t resend this invitation. Check the invitation list before trying again.") });
      if (classified.code === "reviewer_invitation_resend_cooldown") {
        const seconds = Math.max(1, classified.retryAfterSeconds ?? 60);
        setResendCooldownIds((current) => new Set(current).add(invitationId));
        const existingTimer = cooldownTimers.current.get(invitationId);
        if (existingTimer) window.clearTimeout(existingTimer);
        cooldownTimers.current.set(
          invitationId,
          window.setTimeout(() => {
            setResendCooldownIds((current) => {
              const next = new Set(current);
              next.delete(invitationId);
              return next;
            });
            cooldownTimers.current.delete(invitationId);
          }, seconds * 1_000),
        );
      }
    }
  };

  if (authMe && !canManage) {
    return <p className="mt-10 text-body-lg text-red-400" role="alert">You do not have permission to manage reviewers.</p>;
  }

  return (
    <>
      <ReviewerAdminNavigation activeHref="/super-admin/reviewers" />

      <form noValidate onSubmit={handleInvite} className="mt-8 flex flex-col gap-3 rounded-surface border border-border-default bg-surface-default p-5 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="reviewer-invitation-email" className="flex flex-col gap-2 text-label text-text-muted">
            Reviewer email
            <input
              ref={emailInputRef}
              id="reviewer-invitation-email"
              type="email"
              required
              autoComplete="email"
              disabled={createInvitation.isPending}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? "reviewer-invitation-email-error" : undefined}
              value={email}
              placeholder="reviewer@example.com"
              onBlur={() => {
                if (!createInvitation.isPending) setEmailError(getEmailError(email));
              }}
              onChange={(event) => {
                const nextEmail = event.target.value;
                setEmail(nextEmail);
                setFeedback(null);
                if (emailError) setEmailError(getEmailError(nextEmail));
              }}
              className={cn(
                "h-12 rounded-field border bg-surface-subtle px-4 text-label text-white outline-none placeholder:text-text-placeholder disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-text-muted",
                emailError ? "border-red-400 focus:border-red-400" : "border-border-default focus:border-brand",
              )}
            />
          </label>
          {emailError ? (
            <p id="reviewer-invitation-email-error" role="alert" className="mt-2 text-helper text-status-danger">{emailError}</p>
          ) : null}
        </div>
        <Button type="submit" disabled={inviteDisabled} className="sm:mt-7 sm:self-start">
          {createInvitation.isPending ? "Sending..." : "Add Reviewer"}
        </Button>
      </form>

      {feedback?.type === "error" ? (
        <p className="mt-4 text-label text-status-danger" role="alert">
          {feedback.message}
        </p>
      ) : null}
      <SuccessToast
        message={feedback?.type === "success" ? feedback.message : null}
        onDismiss={() => setFeedback(null)}
      />
      {statusConfirmation ? (
        <ReviewerStatusDialog
          reviewer={statusConfirmation.reviewer}
          activate={statusConfirmation.activate}
          pending={setReviewerStatus.isPending}
          errorMessage={statusConfirmation.errorMessage}
          onCancel={() => {
            if (!reviewerStatusPendingRef.current) setStatusConfirmation(null);
          }}
          onConfirm={() => void handleReviewerStatusConfirm()}
        />
      ) : null}

      <section className="mt-10" aria-labelledby="reviewers-title">
        <div className="overflow-hidden rounded-surface border border-border-default bg-surface-default">
          <header className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="reviewers-title" tabIndex={-1} className="text-card-title font-medium text-white">Reviewers</h2>
            <DashboardStatusFilter value={reviewerFilter} options={REVIEWER_OPTIONS} showSelectedLabel onChange={setReviewerFilter} />
          </header>
          {reviewersQuery.isError ? (
            <RequestErrorState
              className="mx-6 my-4"
              title={reviewers.length ? "Couldn’t refresh reviewers" : "Couldn’t load reviewers"}
              message={getReviewerRequestErrorMessage(reviewersQuery.error, "Try loading the reviewer list again. Your filters have been kept.")}
              onRetry={() => void reviewersQuery.refetch()}
              retryPending={reviewersQuery.isFetching}
            />
          ) : null}
          <div className="overflow-x-auto">
            <div className="grid min-h-14 min-w-[980px] grid-cols-[minmax(230px,1fr)_140px_140px_180px_180px] items-center gap-6 bg-surface-subtle px-6 text-label font-medium text-text-muted">
              <span>Email</span><span>Status</span><span>Active work</span><span>Oldest due</span><span>Action</span>
            </div>
            {reviewersQuery.isPending ? (
              <TableMessage message="Loading reviewers..." />
            ) : reviewers.length === 0 ? (
              !reviewersQuery.isError ? <TableMessage message="No reviewers match this filter." /> : null
            ) : reviewers.map((reviewer) => (
              <div key={reviewer.id} className="grid min-h-16 min-w-[980px] grid-cols-[minmax(230px,1fr)_140px_140px_180px_180px] items-center gap-6 border-t border-border-subtle px-6 py-3 text-label text-white">
                <span className="truncate">{reviewer.email}</span>
                <span><StatusPill status={reviewer.status} /></span>
                <span className="tabular-nums">{formatDisplayCount(reviewer.active_assignment_count)}</span>
                <span>{formatDisplayDate(reviewer.oldest_open_due_at)}</span>
                <span>
                  {reviewer.status === "active" || reviewer.status === "suspended" ? (
                    <Button
                      type="button"
                      size="table"
                      variant={reviewer.status === "active" ? "destructive" : "table"}
                      disabled={setReviewerStatus.isPending}
                      onClick={() => {
                        const activate = reviewer.status === "suspended";
                        setFeedback(null);
                        setStatusConfirmation({ reviewer, activate, errorMessage: null });
                      }}
                    >
                      {reviewer.status === "active" ? "Suspend" : "Reactivate"}
                    </Button>
                  ) : "Awaiting registration"}
                </span>
              </div>
            ))}
          </div>
        </div>
        {reviewersQuery.hasNextPage ? (
          <LoadMore pending={reviewersQuery.isFetchingNextPage} onClick={() => void reviewersQuery.fetchNextPage()} />
        ) : null}
      </section>

      <section className="mt-10" aria-labelledby="invitations-title">
        <div className="overflow-hidden rounded-surface border border-border-default bg-surface-default">
          <header className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="invitations-title" className="text-card-title font-medium text-white">Invitations</h2>
            <DashboardStatusFilter value={invitationFilter} options={INVITATION_OPTIONS} showSelectedLabel onChange={setInvitationFilter} />
          </header>
          {invitationsQuery.isError ? (
            <RequestErrorState
              className="mx-6 my-4"
              title={invitations.length ? "Couldn’t refresh invitations" : "Couldn’t load invitations"}
              message={getReviewerRequestErrorMessage(invitationsQuery.error, "Try loading invitations again. Your email input and filters have been kept.")}
              onRetry={() => void invitationsQuery.refetch()}
              retryPending={invitationsQuery.isFetching}
            />
          ) : null}
          <div className="overflow-x-auto">
            <div className="grid min-h-14 min-w-[920px] grid-cols-[minmax(240px,1fr)_140px_180px_240px] items-center gap-6 bg-surface-subtle px-6 text-label font-medium text-text-muted">
              <span>Email</span><span>Status</span><span>Expires</span><span>Actions</span>
            </div>
            {invitationsQuery.isPending ? (
              <TableMessage message="Loading invitations..." />
            ) : invitations.length === 0 ? (
              !invitationsQuery.isError ? <TableMessage message="No invitations match this filter." /> : null
            ) : invitations.map((invitation) => (
              <div key={invitation.id} className="grid min-h-16 min-w-[920px] grid-cols-[minmax(240px,1fr)_140px_180px_240px] items-center gap-6 border-t border-border-subtle px-6 py-3 text-label text-white">
                <span className="truncate">{invitation.email}</span>
                <span><StatusPill status={invitation.status} /></span>
                <span>{formatDisplayDate(invitation.expires_at)}</span>
                <span className="flex gap-2">
                  {invitation.status === "pending" ? (
                    <>
                      <Button type="button" size="table" variant="table" disabled={resendInvitation.isPending || resendCooldownIds.has(invitation.id)} onClick={() => void handleResend(invitation.id)}>{resendCooldownIds.has(invitation.id) ? "Wait to resend" : "Resend"}</Button>
                      <Button type="button" size="table" variant="destructive" disabled={revokeInvitation.isPending} onClick={() => {
                        if (!window.confirm(`Revoke the invitation for ${invitation.email}?`)) return;
                        void revokeInvitation.mutateAsync(invitation.id).then(() => setFeedback({ type: "success", message: "Invitation revoked." })).catch(showError);
                      }}>Revoke</Button>
                    </>
                  ) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
        {invitationsQuery.hasNextPage ? (
          <LoadMore pending={invitationsQuery.isFetchingNextPage} onClick={() => void invitationsQuery.fetchNextPage()} />
        ) : null}
      </section>
    </>
  );
}

function TableMessage({ message, error = false }: { message: string; error?: boolean }) {
  return <p className={cn("px-6 py-10 text-center text-label text-text-muted", error && "text-red-400")} role={error ? "alert" : undefined}>{message}</p>;
}

function LoadMore({ pending, onClick }: { pending: boolean; onClick: () => void }) {
  return (
    <div className="mt-4 flex justify-end">
      <Button variant="secondary" disabled={pending} onClick={onClick}>{pending ? "Loading..." : "Load more"}</Button>
    </div>
  );
}
