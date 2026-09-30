"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/ui";
import {
  getPostAuthHomePath,
  hasPermission,
  useAuthUser,
} from "@/features/auth";
import { usePaidFeatureAccess } from "@/features/billing";
import { DashboardStatusPill } from "@/features/dashboard";
import { ReportViewer } from "@/features/report-generation";
import { usePlatformReport } from "@/features/reports";
import {
  AdminReportCommentsDialog,
  classifyReviewerError,
  CompletedReviewNotes,
  getNotesForSection,
  ReviewHistoryTimeline,
  useCompletedReportReviewNotes,
  useReportReviewHistory,
  useSubmitReportForReviewMutation,
} from "@/features/reviewer";
import { ApiRequestError } from "@/services/ApiRequestError";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type PlatformReportDetailProps = {
  platformReportId: string;
};

function getPlatformDetailErrorMessage(error: unknown): {
  title: string;
  message: string;
} {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) {
      return {
        title: "Access denied",
        message:
          "You do not have permission to view this report.",
      };
    }

    if (error.status === 404) {
      return {
        title: "Report unavailable",
        message:
          "This report could not be found or is no longer available.",
      };
    }

    return {
      title: "Unable to load report",
      message: error.message || "Something went wrong. Please try again.",
    };
  }

  if (error instanceof Error) {
    return {
      title: "Unable to load report",
      message: error.message,
    };
  }

  return {
    title: "Unable to load report",
    message: "Something went wrong. Please try again.",
  };
}

export function PlatformReportDetail({
  platformReportId,
}: PlatformReportDetailProps) {
  const router = useRouter();
  const { authMe } = useAuthUser();
  const homePath = getPostAuthHomePath(authMe);
  const reportQuery = usePlatformReport(platformReportId);
  const paidAccess = usePaidFeatureAccess();
  const submitMutation = useSubmitReportForReviewMutation(platformReportId);
  const isSuperAdmin = authMe?.active_context.type === "global" && authMe.active_context.role === "super_admin";
  const canManageAdminReportComments = hasPermission(
    authMe,
    "admin:report_comments_manage",
  );
  const historyQuery = useReportReviewHistory(
    reportQuery.data?.id,
    isSuperAdmin,
    reportQuery.data?.review_status !== "unassigned",
  );
  const hasCompletedCycle = reportQuery.data?.review_status === "reviewed" ||
    (reportQuery.data?.review_cycle ?? 0) > 1 ||
    historyQuery.data?.items.some((cycle) => cycle.status === "reviewed") === true;
  const notesQuery = useCompletedReportReviewNotes(
    reportQuery.data?.id,
    !isSuperAdmin && hasCompletedCycle,
  );
  const [showAdminComments, setShowAdminComments] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [hasUnsavedReportEdits, setHasUnsavedReportEdits] = useState(false);
  const handleEditingDirtyChange = useCallback(
    (dirty: boolean) => setHasUnsavedReportEdits(dirty),
    [],
  );

  if (reportQuery.isLoading && !reportQuery.data) {
    return (
      <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-white">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-[var(--layout-page-padding)] py-6">
          <p className="text-body-lg text-text-muted">Loading report…</p>
        </main>
      </div>
    );
  }

  if (reportQuery.isError) {
    const { title, message } = getPlatformDetailErrorMessage(reportQuery.error);

    return (
      <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-white">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col gap-8 px-[var(--layout-page-padding)] py-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-page-title font-medium text-text-heading">
              {title}
            </h1>
            <p className="text-body-lg text-text-body" role="alert">
              {message}
            </p>
          </div>
          <div>
            <Button
              variant="secondary"
              onClick={() => router.push(homePath)}
            >
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!reportQuery.data) {
    return (
      <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-white">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-[var(--layout-page-padding)] py-6">
          <p className="text-body-lg text-text-muted">Loading report…</p>
        </main>
      </div>
    );
  }

  const report = reportQuery.data;
  const canSubmitForReview =
    hasPermission(authMe, "report:submit_review") &&
    paidAccess.features?.review_submission_enabled === true &&
    report.generation_status === "completed" &&
    report.archived_at === null &&
    report.is_editable &&
    (report.review_status === "unassigned" || report.review_status === "reviewed");
  const adminHistoryNotes = historyQuery.data
    ? [...historyQuery.data.items]
        .sort((a, b) => b.cycle_number - a.cycle_number)
        .flatMap((cycle) =>
          cycle.assignments.flatMap((assignment) =>
            assignment.notes.map((note) => ({
              ...note,
              review_cycle: cycle.cycle_number,
            })),
          ),
        )
    : [];
  const notes = isSuperAdmin
    ? adminHistoryNotes
    : (notesQuery.data?.items ?? []);
  const canRenderInlineReviewNotes = isSuperAdmin
    ? historyQuery.data !== undefined
    : hasCompletedCycle && notesQuery.data !== undefined;

  const handleSubmitForReview = async () => {
    setSubmissionError(null);
    try {
      await submitMutation.mutateAsync();
    } catch (error) {
      setSubmissionError(classifyReviewerError(error).message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-white">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-[var(--layout-page-padding)] py-6">
        {canSubmitForReview ? (
          <section className="mb-8 flex flex-col gap-4 rounded-card border border-brand/30 bg-brand-bg px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-card-title font-medium text-white">
                Ready for independent review?
              </h2>
              <p className="mt-2 text-label text-text-body">
                Submission locks report editing until this review is completed.
              </p>
              {hasUnsavedReportEdits ? (
                <p className="mt-2 text-helper text-status-running">
                  Save or discard the current report edits before submitting.
                </p>
              ) : null}
            </div>
            <Button
              className="shrink-0"
              disabled={hasUnsavedReportEdits || submitMutation.isPending}
              onClick={() => void handleSubmitForReview()}
            >
              {submitMutation.isPending ? "Submitting..." : report.review_status === "reviewed" ? "Submit for Another Review" : "Submit for Review"}
            </Button>
          </section>
        ) : !report.is_editable ? (
          <section className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-card border border-border-default bg-surface-default px-6 py-5">
            <div>
              <h2 className="text-card-title font-medium text-white">Locked for review</h2>
              <p className="mt-2 text-label text-text-body">
                Report editing is locked while this review is active.
              </p>
            </div>
            <span className="flex flex-wrap items-center gap-2">
              <DashboardStatusPill status={report.review_status} />
              {report.is_overdue ? <span className="rounded-card bg-red-400/10 px-3 py-2 text-label font-medium text-red-400">Overdue</span> : null}
            </span>
          </section>
        ) : null}

        {submissionError ? (
          <p className="mb-6 rounded-card border border-red-400/30 bg-red-400/10 px-5 py-4 text-label text-red-400" role="alert">
            {submissionError}
          </p>
        ) : null}

        {canManageAdminReportComments ? (
          <div className="mb-4 flex justify-end">
            <Button variant="secondary" onClick={() => setShowAdminComments(true)}>Private admin comments</Button>
          </div>
        ) : null}

        {report.review_status !== "unassigned" ? (
          <div>
            {historyQuery.isPending ? <p className="mb-8 text-label text-text-muted">Loading review history...</p> : null}
            {historyQuery.isError ? (
              <div className="mb-8 flex items-center gap-4 text-label text-red-400" role="alert">
                <span>{classifyReviewerError(historyQuery.error).message}</span>
                <button type="button" className="text-brand hover:underline" onClick={() => void historyQuery.refetch()}>Try again</button>
              </div>
            ) : null}
            {historyQuery.data ? <ReviewHistoryTimeline history={historyQuery.data} /> : null}
            {!isSuperAdmin && hasCompletedCycle && notesQuery.isError ? (
              <p className="mb-8 text-label text-red-400" role="alert">{classifyReviewerError(notesQuery.error).message}</p>
            ) : null}
          </div>
        ) : null}

        <ReportViewer
          reportServiceId={report.report_service_id}
          title={report.title}
          filters={report.generation_snapshot.filters}
          selectedSectionIds={
            report.generation_snapshot.selected_section_ids
          }
          customSectionTitles={report.generation_snapshot.custom_sections}
          isEditable={report.is_editable}
          onEditingDirtyChange={handleEditingDirtyChange}
          onBack={() => router.push(homePath)}
          renderAfterSectionContent={
            canRenderInlineReviewNotes
              ? (section) => (
                  <CompletedReviewNotes
                    notes={getNotesForSection(notes, section)}
                  />
                )
              : undefined
          }
        />
        {canManageAdminReportComments && showAdminComments ? (
          <AdminReportCommentsDialog reportId={report.id} reportTitle={report.title} onClose={() => setShowAdminComments(false)} />
        ) : null}
      </main>
    </div>
  );
}
