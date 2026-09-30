"use client";

import { hasPermission, useAuthUser } from "@/features/auth";
import {
  DashboardPagination,
  DashboardSearchInput,
  DashboardStatusFilter,
  type DashboardStatusFilterOption,
} from "@/features/dashboard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/cn";
import { useMemo, useState } from "react";

import {
  useReassignReviewMutation,
  useRetryWaitingReviewMutation,
} from "../hooks/useReviewerMutations";
import {
  useAdminReviewAssignmentNotes,
  useAdminReviewDashboard,
  useAdminReviewers,
} from "../hooks/useReviewerQueries";
import type {
  AdminReviewDashboardItem,
  AdminReviewDashboardStats,
  ReportReviewStatus,
} from "../schemas/reviewerSchemas";
import { classifyReviewerError } from "../utils/classifyReviewerError";
import { ReviewerAdminNavigation } from "./ReviewerAdminNavigation";

type ReviewFilter =
  | Exclude<ReportReviewStatus, "unassigned">
  | "all"
  | "overdue";

const STATUS_OPTIONS = [
  { value: "all", label: "All Reviews" },
  { value: "awaiting_assignment", label: "Awaiting Assignment" },
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "reviewed", label: "Reviewed" },
  { value: "overdue", label: "Overdue" },
] as const satisfies readonly DashboardStatusFilterOption<ReviewFilter>[];

const statCards = [
  { key: "awaiting_assignment", label: "Awaiting Assignment" },
  { key: "assigned_reports", label: "Assigned" },
  { key: "in_review", label: "In Review" },
  { key: "completed_reports", label: "Completed" },
  { key: "overdue_reports", label: "Overdue" },
  { key: "active_reviewers", label: "Active Reviewers" },
] as const satisfies readonly {
  key: keyof AdminReviewDashboardStats;
  label: string;
}[];

const statusStyle: Record<Exclude<ReportReviewStatus, "unassigned"> | "overdue", string> = {
  awaiting_assignment: "bg-white/8 text-text-muted",
  pending: "bg-[rgba(0,101,248,0.12)] text-[#4b8fff]",
  in_review: "bg-[rgba(255,200,92,0.12)] text-status-running",
  reviewed: "bg-[rgba(16,185,129,0.12)] text-status-success",
  overdue: "bg-[rgba(217,34,68,0.12)] text-[#d92244]",
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function ReviewStatusPill({ item }: { item: AdminReviewDashboardItem }) {
  return (
    <span className="flex flex-wrap gap-2">
      <span className={cn("inline-flex rounded-card px-3 py-2 text-input font-medium capitalize", statusStyle[item.review_status])}>
        {item.review_status.replaceAll("_", " ")}
      </span>
      {item.assignment?.is_overdue ? <span className={cn("inline-flex rounded-card px-3 py-2 text-input font-medium", statusStyle.overdue)}>Overdue</span> : null}
    </span>
  );
}

export function AdminReviewDashboardView() {
  const { authMe } = useAuthUser();
  const canManage = hasPermission(authMe, "admin:reviewers_manage");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReviewerByAssignment, setSelectedReviewerByAssignment] =
    useState<Record<string, string>>({});
  const [inspectedAssignmentId, setInspectedAssignmentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const statsQuery = useAdminReviewDashboard(
    { limit: 1, includeStats: true },
    canManage,
  );
  const rowsQuery = useAdminReviewDashboard({
    limit: 6,
    includeStats: false,
    search: debouncedSearch.trim() || undefined,
    reviewStatus:
      statusFilter !== "all" && statusFilter !== "overdue"
        ? statusFilter
        : undefined,
    overdue: statusFilter === "overdue" ? true : undefined,
  }, canManage);
  const reviewersQuery = useAdminReviewers(
    { status: "active", limit: 50 },
    canManage,
  );
  const retryMutation = useRetryWaitingReviewMutation();
  const reassignMutation = useReassignReviewMutation();
  const stats = statsQuery.data?.pages[0]?.stats ?? null;
  const loadedPageCount = rowsQuery.data?.pages.length ?? 0;
  const safeCurrentPage = Math.min(currentPage, Math.max(loadedPageCount, 1));
  const rows = useMemo(
    () => rowsQuery.data?.pages[safeCurrentPage - 1]?.items ?? [],
    [rowsQuery.data, safeCurrentPage],
  );
  const totalPages = Math.max(1, loadedPageCount + (rowsQuery.hasNextPage ? 1 : 0));
  const reviewers = reviewersQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const handlePageChange = async (page: number) => {
    if (page < 1 || page === safeCurrentPage) return;
    if (page <= loadedPageCount) {
      setCurrentPage(page);
      return;
    }
    if (page === loadedPageCount + 1 && rowsQuery.hasNextPage) {
      const result = await rowsQuery.fetchNextPage();
      if (!result.isError) setCurrentPage(page);
    }
  };

  const handleActionError = (error: unknown) =>
    setFeedback(classifyReviewerError(error).message);

  if (authMe && !canManage) {
    return <p className="mt-10 text-body-lg text-red-400" role="alert">You do not have permission to manage review assignments.</p>;
  }

  return (
    <>
      <ReviewerAdminNavigation activeHref="/super-admin/review-assignments" />

      <section aria-label="Review statistics" className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <div key={card.key} className="flex min-h-[130px] flex-col justify-between rounded-button border border-border-default bg-surface-default p-5">
            <p className="text-label font-medium text-white">{card.label}</p>
            <p className={cn("text-[42px] leading-none font-medium", card.key === "overdue_reports" ? "text-red-400" : "text-brand")}>
              {stats ? String(stats[card.key]).padStart(2, "0") : "—"}
            </p>
          </div>
        ))}
      </section>

      {feedback ? <p className="mt-4 text-label text-red-400" role="alert">{feedback}</p> : null}

      <section className="mt-10" aria-labelledby="review-queue-title">
        <div className="overflow-hidden rounded-button border border-border-default bg-surface-default">
          <header className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="review-queue-title" className="text-card-title font-medium text-white">Submitted reports</h2>
            <div className="flex w-full flex-col gap-3 sm:max-w-[700px] sm:flex-row">
              <DashboardSearchInput
                value={searchQuery}
                maxLength={200}
                label="Search reports or reviewers"
                placeholder="Search reports or reviewers"
                onChange={(value) => { setSearchQuery(value); setCurrentPage(1); }}
              />
              <DashboardStatusFilter
                value={statusFilter}
                options={STATUS_OPTIONS}
                showSelectedLabel
                onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}
              />
            </div>
          </header>

          <div className="overflow-x-auto">
            <div className="grid min-w-[1320px] grid-cols-[minmax(250px,1fr)_190px_170px_160px_180px_280px] gap-6 bg-surface-subtle px-6 py-4 text-label font-medium text-text-step">
              <span>Report</span><span>Reviewer</span><span>Submitted</span><span>Status</span><span>Due</span><span>Actions</span>
            </div>
            {rowsQuery.isPending ? (
              <QueueMessage message="Loading submitted reports..." />
            ) : rowsQuery.isError ? (
              <QueueMessage message={classifyReviewerError(rowsQuery.error).message} error />
            ) : rows.length === 0 ? (
              <QueueMessage message="No submitted reports match these filters." />
            ) : rows.map((item) => {
              const assignmentId = item.assignment?.id;
              const canReassign = assignmentId && (item.review_status === "pending" || item.review_status === "in_review");
              return (
                <div key={`${item.report.id}:${assignmentId ?? "waiting"}`} className="grid min-w-[1320px] grid-cols-[minmax(250px,1fr)_190px_170px_160px_180px_280px] items-center gap-6 border-t border-border-subtle px-6 py-4 text-label text-white">
                  <span className="min-w-0"><span className="block truncate font-medium">{item.report.title}</span><span className="mt-1 block truncate text-helper text-text-muted">{item.report.drug_name}</span></span>
                  <span className="truncate">{item.reviewer?.full_name || item.reviewer?.email || "Unassigned"}</span>
                  <span>{formatDate(item.submitted_at)}</span>
                  <span><ReviewStatusPill item={item} /></span>
                  <span>{formatDate(item.assignment?.due_at)}</span>
                  <span className="flex items-center gap-3">
                    {item.review_status === "awaiting_assignment" ? (
                      <button
                        type="button"
                        disabled={retryMutation.isPending}
                        className="font-medium text-brand hover:underline disabled:opacity-50"
                        onClick={() => {
                          setFeedback(null);
                          void retryMutation.mutateAsync(item.report.id).catch(handleActionError);
                        }}
                      >Retry assignment</button>
                    ) : null}
                    {canReassign ? (
                      <>
                        <select
                          aria-label={`Reassign ${item.report.title}`}
                          value={selectedReviewerByAssignment[assignmentId as string] ?? ""}
                          onChange={(event) => setSelectedReviewerByAssignment((current) => ({ ...current, [assignmentId as string]: event.target.value }))}
                          className="h-9 max-w-[130px] rounded-card border border-border-default bg-surface-subtle px-2 text-input text-white"
                        >
                          <option value="">Automatic</option>
                          {reviewers.filter((reviewer) => reviewer.id !== item.reviewer?.id).map((reviewer) => (
                            <option key={reviewer.id} value={reviewer.id}>{reviewer.email}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={reassignMutation.isPending}
                          className="font-medium text-brand hover:underline disabled:opacity-50"
                          onClick={() => {
                            if (!window.confirm(`Reassign ${item.report.title}? The current assignment and notes will become read-only.`)) return;
                            setFeedback(null);
                            const resolvedAssignmentId = assignmentId as string;
                            const reviewerId = selectedReviewerByAssignment[resolvedAssignmentId] || undefined;
                            void reassignMutation.mutateAsync({ assignmentId: resolvedAssignmentId, request: reviewerId ? { reviewer_id: reviewerId } : {} }).catch(handleActionError);
                          }}
                        >Reassign</button>
                      </>
                    ) : null}
                    {assignmentId ? (
                      <button type="button" className="font-medium text-white/70 hover:text-white" onClick={() => setInspectedAssignmentId(assignmentId)}>Notes</button>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {totalPages > 1 ? (
          <DashboardPagination className="mt-4" currentPage={safeCurrentPage} totalPages={totalPages} isPageChangePending={rowsQuery.isFetchingNextPage} ariaLabel="Review dashboard pagination" onPageChange={handlePageChange} />
        ) : null}
      </section>

      {inspectedAssignmentId ? (
        <AdminNotesPanel assignmentId={inspectedAssignmentId} onClose={() => setInspectedAssignmentId(null)} />
      ) : null}
    </>
  );
}

function QueueMessage({ message, error = false }: { message: string; error?: boolean }) {
  return <p className={cn("px-6 py-10 text-center text-label text-text-muted", error && "text-red-400")} role={error ? "alert" : undefined}>{message}</p>;
}

function AdminNotesPanel({ assignmentId, onClose }: { assignmentId: string; onClose: () => void }) {
  const notesQuery = useAdminReviewAssignmentNotes(assignmentId);
  return (
    <section className="mt-8 rounded-button border border-border-default bg-surface-default p-6" aria-labelledby="admin-review-notes-title">
      <div className="flex items-center justify-between gap-4">
        <h2 id="admin-review-notes-title" className="text-card-title font-medium text-white">Assignment notes</h2>
        <button type="button" className="text-label font-medium text-text-muted hover:text-white" onClick={onClose}>Close</button>
      </div>
      {notesQuery.isPending ? (
        <p className="mt-5 text-label text-text-muted">Loading notes...</p>
      ) : notesQuery.isError ? (
        <p className="mt-5 text-label text-red-400" role="alert">{classifyReviewerError(notesQuery.error).message}</p>
      ) : notesQuery.data?.items.some((note) => note.assignment_id === assignmentId) ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {notesQuery.data.items.filter((note) => note.assignment_id === assignmentId).map((note) => (
            <article key={note.id} className="rounded-card border border-border-default bg-surface-subtle p-4">
              <h3 className="text-label font-medium text-white">{note.section_heading}{note.section_occurrence > 1 ? ` (${note.section_occurrence})` : ""}</h3>
              <p className="mt-3 whitespace-pre-wrap text-label leading-6 text-text-body">{note.content}</p>
            </article>
          ))}
        </div>
      ) : <p className="mt-5 text-label text-text-muted">No notes were added.</p>}
    </section>
  );
}
