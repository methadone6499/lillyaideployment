"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import {
  ArrowNarrowLeftIcon,
  ArrowNarrowRightIcon,
  Button,
} from "@/components/ui";
import { DashboardHeaderActions } from "@/features/dashboard";
import { ReportSectionPresentation } from "@/features/report-generation";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  reportHasDirtyNotes,
  useReviewerSessionStore,
} from "../store/useReviewerSessionStore";
import type { ReviewerNotification, ReviewerReportDetail } from "../types";
import { toReviewerSectionPresentationItems } from "../utils/mapReviewerReportContent";
import { ReviewerSectionNotes } from "./ReviewerSectionNotes";
import { ReviewerUnsavedNotesDialog } from "./ReviewerUnsavedNotesDialog";

const REVIEWER_DASHBOARD_HREF = "/reviewer/dashboard";
const EMPTY_NOTIFICATIONS: readonly ReviewerNotification[] = [];

type ReviewerReportShellProps = {
  report: ReviewerReportDetail | null;
  notifications?: readonly ReviewerNotification[];
};

export function ReviewerReportShell({
  report,
  notifications = EMPTY_NOTIFICATIONS,
}: ReviewerReportShellProps) {
  const router = useRouter();
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const sectionItems = useMemo(
    () =>
      report ? toReviewerSectionPresentationItems(report.sections) : [],
    [report],
  );
  const platformReportId = report?.platformReportId;
  const hasDirtyNotes = useReviewerSessionStore((state) =>
    platformReportId
      ? reportHasDirtyNotes(state.notesByKey, platformReportId)
      : false,
  );
  const isSubmitted = useReviewerSessionStore((state) =>
    platformReportId
      ? Boolean(state.submissionsByReportId[platformReportId])
      : false,
  );
  const discardDrafts = useReviewerSessionStore((state) => state.discardDrafts);
  const submitReview = useReviewerSessionStore((state) => state.submitReview);

  useEffect(() => {
    if (!hasDirtyNotes) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasDirtyNotes]);

  const navigateToDashboard = () => {
    router.push(REVIEWER_DASHBOARD_HREF);
  };

  const handleBack = () => {
    if (hasDirtyNotes) {
      setIsLeaveDialogOpen(true);
      return;
    }

    navigateToDashboard();
  };

  const handleConfirmLeave = () => {
    if (platformReportId) {
      discardDrafts(platformReportId);
    }
    setIsLeaveDialogOpen(false);
    navigateToDashboard();
  };

  const handleSubmit = () => {
    if (!platformReportId || isSubmitted) {
      return;
    }

    submitReview(platformReportId);
  };

  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader
        actions={<DashboardHeaderActions notifications={notifications} />}
      />

      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 pt-10 pb-14 sm:px-6 lg:px-12 lg:pt-12">
        <div>
          <Button
            variant="secondary"
            leadingIcon={<ArrowNarrowLeftIcon />}
            className="pl-3.5 pr-5"
            onClick={handleBack}
          >
            Back to Dashboard
          </Button>
        </div>

        {report ? (
          <div className="mt-14 flex flex-col gap-12">
            <div className="flex flex-col gap-7">
              <h1 className="text-page-title font-medium text-text-heading">
                {report.title}
              </h1>
              <p className="text-body-lg text-text-body">
                {report.generatedOnLabel}
              </p>
            </div>

            <ReportSectionPresentation
              items={sectionItems}
              defaultExpandFirst
              emptyMessage={
                <p className="text-body-lg text-text-muted">
                  No sections are available for this report.
                </p>
              }
              renderAfterContent={(item) => (
                <ReviewerSectionNotes
                  platformReportId={report.platformReportId}
                  sectionId={item.id}
                  sectionTitle={item.title}
                />
              )}
            />
          </div>
        ) : (
          <div className="mt-14 flex flex-col gap-4">
            <h1 className="text-page-title font-medium text-text-heading">
              Report unavailable
            </h1>
            <p className="text-body-lg text-text-body" role="alert">
              This report could not be found or is no longer available.
            </p>
          </div>
        )}

        {report ? (
          <footer className="mt-auto border-t border-border-default pt-7">
            <div className="flex flex-wrap items-center justify-end gap-4">
              <p
                className={cn(
                  "text-helper text-brand",
                  !isSubmitted && "sr-only",
                )}
                role="status"
                aria-live="polite"
              >
                {isSubmitted ? "Review submitted." : ""}
              </p>
              <Button
                trailingIcon={<ArrowNarrowRightIcon />}
                className="pl-5 pr-3"
                disabled={isSubmitted}
                onClick={handleSubmit}
              >
                Submit Review
              </Button>
            </div>
          </footer>
        ) : null}
      </main>

      <ReviewerUnsavedNotesDialog
        open={isLeaveDialogOpen}
        onConfirm={handleConfirmLeave}
        onCancel={() => setIsLeaveDialogOpen(false)}
      />
    </div>
  );
}
