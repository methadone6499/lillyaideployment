"use client";

import { Button } from "@/components/ui";
import { hasPermission, useAuthUser } from "@/features/auth";
import {
  DashboardStatusFilter,
  type DashboardStatusFilterOption,
} from "@/features/dashboard";
import { cn } from "@/lib/cn";
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
import type {
  ReviewerInvitationStatus,
  ReviewerStatus,
} from "../schemas/reviewerSchemas";
import { classifyReviewerError } from "../utils/classifyReviewerError";
import { ReviewerAdminNavigation } from "./ReviewerAdminNavigation";

type ReviewerFilter = ReviewerStatus | "all";
type InvitationFilter = ReviewerInvitationStatus | "all";

const REVIEWER_OPTIONS = [
  { value: "all", label: "All Reviewers" },
  { value: "invited", label: "Invited" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
] as const satisfies readonly DashboardStatusFilterOption<ReviewerFilter>[];

const INVITATION_OPTIONS = [
  { value: "all", label: "All Invitations" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "revoked", label: "Revoked" },
  { value: "expired", label: "Expired" },
] as const satisfies readonly DashboardStatusFilterOption<InvitationFilter>[];

const statusTone: Record<ReviewerStatus | ReviewerInvitationStatus, string> = {
  active: "bg-[rgba(16,185,129,0.12)] text-status-success",
  invited: "bg-[rgba(0,101,248,0.12)] text-[#4b8fff]",
  suspended: "bg-[rgba(217,34,68,0.12)] text-[#d92244]",
  pending: "bg-[rgba(255,200,92,0.12)] text-status-running",
  accepted: "bg-[rgba(16,185,129,0.12)] text-status-success",
  revoked: "bg-[rgba(217,34,68,0.12)] text-[#d92244]",
  expired: "bg-white/8 text-text-muted",
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function StatusPill({ status }: { status: ReviewerStatus | ReviewerInvitationStatus }) {
  return (
    <span className={cn("inline-flex rounded-card px-3 py-2 text-input font-medium capitalize", statusTone[status])}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function AdminReviewerManagement() {
  const { authMe } = useAuthUser();
  const canManage = hasPermission(authMe, "admin:reviewers_manage");
  const [email, setEmail] = useState("");
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

  const reviewers = reviewersQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const invitations = invitationsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const showError = (error: unknown) =>
    setFeedback({ type: "error", message: classifyReviewerError(error).message });

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
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return;
    setFeedback(null);
    try {
      await createInvitation.mutateAsync(normalizedEmail);
      setEmail("");
      setInvitationFilter("pending");
      setFeedback({ type: "success", message: "Reviewer invitation sent." });
    } catch (error) {
      showError(error);
    }
  };

  const handleResend = async (invitationId: string) => {
    setFeedback(null);
    try {
      await resendInvitation.mutateAsync(invitationId);
      setFeedback({ type: "success", message: "Invitation resent." });
    } catch (error) {
      const classified = classifyReviewerError(error);
      setFeedback({ type: "error", message: classified.message });
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

      <form onSubmit={handleInvite} className="mt-8 flex flex-col gap-3 rounded-button border border-border-default bg-surface-default p-5 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-2 text-label text-text-muted">
          Reviewer email
          <input
            type="email"
            required
            value={email}
            placeholder="reviewer@example.com"
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 rounded-button border border-border-default bg-surface-subtle px-4 text-body-lg text-white outline-none focus:border-brand"
          />
        </label>
        <Button type="submit" disabled={createInvitation.isPending}>
          {createInvitation.isPending ? "Sending..." : "Add Reviewer"}
        </Button>
      </form>

      {feedback ? (
        <p className={cn("mt-4 text-label", feedback.type === "error" ? "text-red-400" : "text-brand")} role={feedback.type === "error" ? "alert" : "status"}>
          {feedback.message}
        </p>
      ) : null}

      <section className="mt-10" aria-labelledby="reviewers-title">
        <div className="overflow-hidden rounded-button border border-border-default bg-surface-default">
          <header className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="reviewers-title" className="text-card-title font-medium text-white">Reviewers</h2>
            <DashboardStatusFilter value={reviewerFilter} options={REVIEWER_OPTIONS} showSelectedLabel onChange={setReviewerFilter} />
          </header>
          <div className="overflow-x-auto">
            <div className="grid min-w-[980px] grid-cols-[minmax(230px,1fr)_140px_140px_180px_180px] gap-6 bg-surface-subtle px-6 py-4 text-label font-medium text-text-step">
              <span>Email</span><span>Status</span><span>Active work</span><span>Oldest due</span><span>Action</span>
            </div>
            {reviewersQuery.isPending ? (
              <TableMessage message="Loading reviewers..." />
            ) : reviewersQuery.isError ? (
              <TableMessage message={classifyReviewerError(reviewersQuery.error).message} error />
            ) : reviewers.length === 0 ? (
              <TableMessage message="No reviewers match this filter." />
            ) : reviewers.map((reviewer) => (
              <div key={reviewer.id} className="grid min-w-[980px] grid-cols-[minmax(230px,1fr)_140px_140px_180px_180px] items-center gap-6 border-t border-border-subtle px-6 py-4 text-label text-white">
                <span className="truncate">{reviewer.email}</span>
                <span><StatusPill status={reviewer.status} /></span>
                <span>{reviewer.active_assignment_count}</span>
                <span>{formatDate(reviewer.oldest_open_due_at)}</span>
                <span>
                  {reviewer.status === "active" || reviewer.status === "suspended" ? (
                    <button
                      type="button"
                      disabled={setReviewerStatus.isPending}
                      className="font-medium text-brand hover:underline disabled:opacity-50"
                      onClick={() => {
                        const activate = reviewer.status === "suspended";
                        if (!window.confirm(`${activate ? "Reactivate" : "Suspend"} ${reviewer.email}?`)) return;
                        setFeedback(null);
                        void setReviewerStatus.mutateAsync({ reviewerId: reviewer.id, active: activate }).catch(showError);
                      }}
                    >
                      {reviewer.status === "active" ? "Suspend" : "Reactivate"}
                    </button>
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
        <div className="overflow-hidden rounded-button border border-border-default bg-surface-default">
          <header className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="invitations-title" className="text-card-title font-medium text-white">Invitations</h2>
            <DashboardStatusFilter value={invitationFilter} options={INVITATION_OPTIONS} showSelectedLabel onChange={setInvitationFilter} />
          </header>
          <div className="overflow-x-auto">
            <div className="grid min-w-[920px] grid-cols-[minmax(240px,1fr)_140px_180px_240px] gap-6 bg-surface-subtle px-6 py-4 text-label font-medium text-text-step">
              <span>Email</span><span>Status</span><span>Expires</span><span>Actions</span>
            </div>
            {invitationsQuery.isPending ? (
              <TableMessage message="Loading invitations..." />
            ) : invitationsQuery.isError ? (
              <TableMessage message={classifyReviewerError(invitationsQuery.error).message} error />
            ) : invitations.length === 0 ? (
              <TableMessage message="No invitations match this filter." />
            ) : invitations.map((invitation) => (
              <div key={invitation.id} className="grid min-w-[920px] grid-cols-[minmax(240px,1fr)_140px_180px_240px] items-center gap-6 border-t border-border-subtle px-6 py-4 text-label text-white">
                <span className="truncate">{invitation.email}</span>
                <span><StatusPill status={invitation.status} /></span>
                <span>{formatDate(invitation.expires_at)}</span>
                <span className="flex gap-4">
                  {invitation.status === "pending" ? (
                    <>
                      <button type="button" className="font-medium text-brand hover:underline" disabled={resendInvitation.isPending || resendCooldownIds.has(invitation.id)} onClick={() => void handleResend(invitation.id)}>{resendCooldownIds.has(invitation.id) ? "Wait to resend" : "Resend"}</button>
                      <button type="button" className="font-medium text-red-400 hover:underline" disabled={revokeInvitation.isPending} onClick={() => {
                        if (!window.confirm(`Revoke the invitation for ${invitation.email}?`)) return;
                        void revokeInvitation.mutateAsync(invitation.id).then(() => setFeedback({ type: "success", message: "Invitation revoked." })).catch(showError);
                      }}>Revoke</button>
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
