"use client";

import { formatDisplayCount, formatDisplayDateTime as formatDate } from "@/lib/formatDisplay";



import { AppHeader } from "@/components/shared/AppHeader";
import {
  ArrowNarrowLeftIcon,
  Button,
  RequestErrorState,
} from "@/components/ui";
import { DashboardHeaderActions } from "@/features/dashboard";
import {
  buildReportSectionItems,
  getReportRequestErrorMessage,
  ReportSectionAccordion,
  ReportSectionPresentation,
  useReportStatus,
  type EditableDocumentResponse,
  type ReportSectionAccordionItem,
} from "@/features/report-generation";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  useCompleteReviewerAssignmentMutation,
  useSaveReviewerNoteMutation,
  useStartReviewerAssignmentMutation,
} from "../hooks/useReviewerMutations";
import {
  useReviewerAssignment,
  useReviewerAssignmentNotes,
} from "../hooks/useReviewerQueries";
import type { ReviewSectionNote } from "../schemas/reviewerSchemas";
import { classifyReviewerError, getReviewerRequestErrorMessage } from "../utils/classifyReviewerError";
import { ReviewerCompletionDialog } from "./ReviewerCompletionDialog";
import { ReviewerStatusPill } from "./ReviewerStatusPill";
import { ReviewerUnsavedNotesDialog } from "./ReviewerUnsavedNotesDialog";

type WorkspaceSectionItem = ReportSectionAccordionItem & {
  headingOccurrence: number;
};

function normalizeHeading(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function addHeadingOccurrences(
  items: readonly ReportSectionAccordionItem[],
): WorkspaceSectionItem[] {
  const counts = new Map<string, number>();
  return items.map((item) => {
    const key = normalizeHeading(item.title);
    const occurrence = (counts.get(key) ?? 0) + 1;
    counts.set(key, occurrence);
    return { ...item, headingOccurrence: occurrence };
  });
}

function getSectionNotes(
  notes: readonly ReviewSectionNote[],
  item: WorkspaceSectionItem,
  assignmentId: string,
) {
  const heading = normalizeHeading(item.title);
  const matching = notes.filter(
    (note) =>
      note.section_id && item.section.section_id
        ? note.section_id === item.section.section_id
        : !note.section_id && normalizeHeading(note.section_heading) === heading && note.section_occurrence === item.headingOccurrence,
  );
  const current = matching.find((note) => note.assignment_id === assignmentId);
  return {
    current,
    history: matching.filter((note) => note.id !== current?.id),
  };
}

export function ReviewerAssignmentWorkspace({
  assignmentId,
}: {
  assignmentId: string;
}) {
  const router = useRouter();
  const assignmentQuery = useReviewerAssignment(assignmentId);
  const notesQuery = useReviewerAssignmentNotes(assignmentId);
  const notesUnavailable = notesQuery.isPending || (notesQuery.isError && !notesQuery.data);
  const startMutation = useStartReviewerAssignmentMutation(assignmentId);
  const completeMutation = useCompleteReviewerAssignmentMutation(assignmentId);
  const saveNoteMutation = useSaveReviewerNoteMutation(assignmentId);
  const assignment = assignmentQuery.data;
  const reportStatusQuery = useReportStatus(
    assignment?.report_service_id ?? null,
  );
  const [draftBySection, setDraftBySection] = useState<Record<string, string>>(
    {},
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [dirtyReportBySection, setDirtyReportBySection] = useState<Record<string, boolean>>({});
  const [sessionDocumentByKey, setSessionDocumentByKey] = useState<Record<string, EditableDocumentResponse>>({});
  const handleReportDirtyChange = useCallback((key: string, dirty: boolean) => {
    setDirtyReportBySection((current) => current[key] === dirty ? current : { ...current, [key]: dirty });
  }, []);

  const sectionItems = useMemo(() => {
    const sections = reportStatusQuery.data?.sections ?? [];
    return addHeadingOccurrences(
      buildReportSectionItems(
        sections,
        sections.map((section) => section.section_type),
      ),
    );
  }, [reportStatusQuery.data?.sections]);

  const notes = useMemo(
    () => notesQuery.data?.items ?? [],
    [notesQuery.data?.items],
  );
  const dirtySectionKeys = useMemo(
    () =>
      sectionItems
        .filter((item) => {
          if (!(item.accordionKey in draftBySection)) return false;
          const { current } = getSectionNotes(notes, item, assignmentId);
          return draftBySection[item.accordionKey] !== (current?.content ?? "");
        })
        .map((item) => item.accordionKey),
    [assignmentId, draftBySection, notes, sectionItems],
  );
  const hasUnsavedNotes = dirtySectionKeys.length > 0;
  const hasUnsavedReportEdits = Object.values(dirtyReportBySection).some(Boolean);
  const hasUnsavedChanges = hasUnsavedNotes || hasUnsavedReportEdits;

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const navigateBack = () => router.push("/reviewer/assignments");
  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowLeaveDialog(true);
      return;
    }
    navigateBack();
  };

  const handleStart = async () => {
    setActionError(null);
    try {
      await startMutation.mutateAsync();
    } catch (error) {
      setActionError(getReviewerRequestErrorMessage(error, "We couldn’t start this review. Try Start Review again."));
    }
  };

  const handleComplete = async () => {
    if (hasUnsavedChanges || notesUnavailable || saveNoteMutation.isPending || completeMutation.isPending) return;
    setActionError(null);
    try {
      await completeMutation.mutateAsync();
      setShowCompletionDialog(false);
      setDraftBySection({});
    } catch (error) {
      setActionError(getReviewerRequestErrorMessage(error, "We couldn’t confirm review completion. Refresh the assignment before trying again."));
      setShowCompletionDialog(false);
    }
  };

  if (assignmentQuery.isPending) {
    return <WorkspaceFrame><WorkspaceMessage message="Loading review workspace..." /></WorkspaceFrame>;
  }

  if (assignmentQuery.isError || !assignment) {
    const error = assignmentQuery.isError
      ? classifyReviewerError(assignmentQuery.error)
      : null;
    return (
      <WorkspaceFrame>
        <WorkspaceMessage
          error
          message={error?.message ?? "This review assignment is unavailable."}
          onRetry={() => void assignmentQuery.refetch()}
        />
      </WorkspaceFrame>
    );
  }

  const assignmentIsEditable = assignment.can_edit_report;

  return (
    <WorkspaceFrame>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-8">
          <div>
            <Button
              variant="secondary"
              leadingIcon={<ArrowNarrowLeftIcon />}
              className="pl-3.5 pr-5"
              onClick={handleBack}
            >
              Back to assignments
            </Button>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-page-title font-medium text-text-heading">
                  {assignment.report.title}
                </h1>
                <ReviewerStatusPill
                  status={assignment.status}
                />
                {assignment.is_overdue ? <ReviewerStatusPill status="overdue" /> : null}
              </div>
              <p className="mt-3 text-body-lg text-text-body">
                {assignment.report.drug_name} · Assigned {formatDate(assignment.assigned_at)} · Due {formatDate(assignment.due_at)}
              </p>
            </div>

            {assignment.status === "pending" ? (
              <Button disabled={startMutation.isPending} onClick={() => void handleStart()}>
                {startMutation.isPending ? "Starting..." : "Start Review"}
              </Button>
            ) : null}
          </div>

          {actionError ? (
            <p className="rounded-surface border border-red-400/30 bg-red-400/10 px-5 py-4 text-label text-red-400" role="alert">
              {actionError}
            </p>
          ) : null}

          {assignment.status === "completed" ? (
            <p className="rounded-surface border border-brand/30 bg-brand-bg px-5 py-4 text-label text-text-body" role="status">
              This review is complete. Report content and notes are read-only.
            </p>
          ) : assignment.status === "superseded" ? (
            <p className="rounded-surface border border-border-default bg-surface-default px-5 py-4 text-label text-text-body" role="status">
              This assignment was superseded. Its notes are read-only.
            </p>
          ) : assignment.status === "pending" ? (
            <p className="rounded-surface border border-border-default bg-surface-default px-5 py-4 text-label text-text-body" role="status">
              Start the review to edit report content and add section notes.
            </p>
          ) : null}
        </div>

        {reportStatusQuery.isPending ? (
          <WorkspaceMessage message="Loading generated report content..." />
        ) : reportStatusQuery.isError ? (
          <WorkspaceMessage
            error
            message={getReportRequestErrorMessage(reportStatusQuery.error, "We could not load the report content. Select Retry to try again.")}
            onRetry={() => void reportStatusQuery.refetch()}
          />
        ) : (
          <ReportSectionPresentation
            items={sectionItems}
            defaultExpandFirst
            emptyMessage={<WorkspaceMessage message="No report sections are available." />}
            renderSection={(item, { expanded, onToggle }) => {
              const sectionNotes = getSectionNotes(notes, item, assignmentId);
              const value =
                draftBySection[item.accordionKey] ??
                sectionNotes.current?.content ??
                "";
              return (
                <ReportSectionAccordion
                  key={item.accordionKey}
                  reportServiceId={assignment.report_service_id}
                  reportStatus={reportStatusQuery.data?.report_status ?? ""}
                  item={item}
                  expanded={expanded}
                  isEditing={assignmentIsEditable && editingKey === item.accordionKey}
                  allowEditing={assignmentIsEditable}
                  sessionDocument={sessionDocumentByKey[item.accordionKey]}
                  showSaveConfirmation
                  onToggle={(element) => {
                    if (hasUnsavedReportEdits) {
                      setActionError("Save or discard report edits before changing sections.");
                      return;
                    }
                    onToggle(element);
                  }}
                  onRequestEdit={() => {
                    if (hasUnsavedReportEdits) {
                      setActionError("Save or discard report edits before editing another section.");
                      return;
                    }
                    setActionError(null);
                    setEditingKey(item.accordionKey);
                  }}
                  onStopEditing={() => setEditingKey((key) => key === item.accordionKey ? null : key)}
                  onDirtyChange={handleReportDirtyChange}
                  onDocumentSaved={(key, document) => setSessionDocumentByKey((current) => ({ ...current, [key]: document }))}
                  afterContent={
                    <ReviewerSectionWorkspace
                      item={item}
                      value={value}
                      currentNote={sectionNotes.current}
                      history={sectionNotes.history}
                      canEdit={assignmentIsEditable && !notesUnavailable}
                      notesPending={notesQuery.isPending}
                      notesError={notesQuery.isError ? getReviewerRequestErrorMessage(notesQuery.error, "We couldn’t load your notes. Any draft you have entered is still here. Try again before continuing.") : null}
                      notesFetching={notesQuery.isFetching}
                      onRetryNotes={() => void notesQuery.refetch()}
                      onChange={(nextValue) => setDraftBySection((current) => ({ ...current, [item.accordionKey]: nextValue }))}
                      onDiscard={() => setDraftBySection((current) => ({ ...current, [item.accordionKey]: sectionNotes.current?.content ?? "" }))}
                      onReload={async () => {
                        const refreshed = await notesQuery.refetch();
                        if (refreshed.error) throw refreshed.error;
                        if (!refreshed.data) throw new Error("Latest notes are unavailable.");
                        const latest = getSectionNotes(refreshed.data?.items ?? [], item, assignmentId).current;
                        setDraftBySection((current) => ({ ...current, [item.accordionKey]: latest?.content ?? "" }));
                      }}
                      onSave={async () => {
                        const saved = await saveNoteMutation.mutateAsync({
                          section_id: item.section.section_id ?? undefined,
                          section_heading: item.title,
                          section_occurrence: item.headingOccurrence,
                          content: value.trim(),
                          version: sectionNotes.current?.version,
                        });
                        setDraftBySection((current) => ({ ...current, [item.accordionKey]: saved.content }));
                        return saved.content;
                      }}
                      savePending={saveNoteMutation.isPending}
                    />
                  }
                />
              );
            }}
          />
        )}

        {assignment.status === "in_review" ? (
          <footer className="sticky bottom-0 z-20 border-t border-border-default bg-base-black py-4">
            {notesUnavailable ? (
              <p className="mb-4 text-right text-helper text-status-running">Load reviewer notes before completing the review.</p>
            ) : null}
            {hasUnsavedChanges ? (
              <p className="mb-4 text-right text-helper text-status-running">
                Save or discard report edits and draft notes before completing the review.
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-4">
              {notesQuery.isError ? (
                <Button variant="secondary" disabled={notesQuery.isFetching} onClick={() => void notesQuery.refetch()}>
                  {notesQuery.isFetching ? "Loading notes…" : "Retry notes"}
                </Button>
              ) : null}
              <Button
                disabled={hasUnsavedChanges || notesUnavailable || saveNoteMutation.isPending || completeMutation.isPending}
                onClick={() => setShowCompletionDialog(true)}
              >
                {completeMutation.isPending ? "Completing..." : "Complete Review"}
              </Button>
            </div>
          </footer>
        ) : null}
      </div>

      <ReviewerUnsavedNotesDialog
        open={showLeaveDialog}
        onCancel={() => setShowLeaveDialog(false)}
        onConfirm={() => {
          setDraftBySection({});
          setShowLeaveDialog(false);
          navigateBack();
        }}
      />
      <ReviewerCompletionDialog
        open={showCompletionDialog}
        isSubmitting={completeMutation.isPending}
        onCancel={() => setShowCompletionDialog(false)}
        onConfirm={() => void handleComplete()}
      />
    </WorkspaceFrame>
  );
}

function WorkspaceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader actions={<DashboardHeaderActions />} />
      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 py-10 sm:px-6 lg:px-12 lg:py-12">
        {children}
      </main>
    </div>
  );
}

function WorkspaceMessage({
  message,
  error = false,
  onRetry,
}: {
  message: string;
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-surface border border-border-default bg-surface-default px-6 py-12 text-center">
      <p className={cn("text-body-lg text-text-muted", error && "text-red-400")} role={error ? "alert" : "status"}>
        {message}
      </p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>Try again</Button>
      ) : null}
    </div>
  );
}

function ReviewerSectionWorkspace({
  item,
  value,
  currentNote,
  history,
  canEdit,
  notesPending,
  notesError,
  notesFetching,
  onRetryNotes,
  savePending,
  onChange,
  onDiscard,
  onReload,
  onSave,
}: {
  item: WorkspaceSectionItem;
  value: string;
  currentNote?: ReviewSectionNote;
  history: readonly ReviewSectionNote[];
  canEdit: boolean;
  notesPending: boolean;
  notesError: string | null;
  notesFetching: boolean;
  onRetryNotes: () => void;
  savePending: boolean;
  onChange: (value: string) => void;
  onDiscard: () => void;
  onReload: () => Promise<void>;
  onSave: () => Promise<string>;
}) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [savedContent, setSavedContent] = useState<string | null>(null);
  const [reloadPending, setReloadPending] = useState(false);
  const isDirty = value !== (currentNote?.content ?? "");
  const editable = canEdit && (currentNote?.is_editable ?? true);

  useEffect(() => {
    if (savedContent === null) return;
    const timer = window.setTimeout(() => setSavedContent(null), 4_000);
    return () => window.clearTimeout(timer);
  }, [savedContent]);

  const handleSave = async () => {
    if (!editable || savePending || reloadPending || !isDirty || !value.trim() || needsRefresh) return;
    setSavedContent(null);
    setSaveError(null);
    try {
      setSavedContent(await onSave());
    } catch (error) {
      const classified = classifyReviewerError(error);
      setSaveError(getReviewerRequestErrorMessage(error, "We couldn’t save your note. Your draft has been kept. Try Save Note again."));
      if (classified.code === "review_note_version_conflict") setNeedsRefresh(true);
    }
  };

  const handleReload = async () => {
    if (reloadPending || savePending) return;
    setSavedContent(null);
    setReloadPending(true);
    try {
      await onReload();
      setNeedsRefresh(false);
      setSaveError(null);
    } catch (error) {
      setSaveError(getReviewerRequestErrorMessage(error, "We couldn’t load the latest note. Your draft has been kept. Try again."));
    } finally {
      setReloadPending(false);
    }
  };

  return (
    <div className="text-body-lg">
      <div className="mt-8 border-t border-border-default pt-8">
        {editable ? (
          <label htmlFor={`review-note-${item.accordionKey}`} className="text-label font-medium text-white">
            Reviewer Notes
          </label>
        ) : (
          <h4 className="text-label font-medium text-white">Reviewer Notes</h4>
        )}
        {notesError && !needsRefresh ? (
          <RequestErrorState
            className="mt-3"
            title="Couldn’t load reviewer notes"
            message={notesError}
            onRetry={onRetryNotes}
            retryPending={notesFetching}
          />
        ) : null}
        {notesPending ? (
          <p className="mt-3 text-label text-text-muted">Loading notes...</p>
        ) : (
          editable ? (
            <>
            <textarea
              id={`review-note-${item.accordionKey}`}
              value={value}
              maxLength={10_000}
              disabled={!editable || savePending || reloadPending}
              onChange={(event) => {
                setSavedContent(null);
                onChange(event.target.value);
              }}
              placeholder={notesError ? "Notes could not be loaded." : editable ? "Write your notes here..." : "No note was added for this section."}
              className="mt-3.5 h-[180px] w-full resize-y rounded-field border border-border-default bg-landing-surface-input px-4 py-4 text-body-lg leading-[26px] text-text-body outline-none transition-[border-color,box-shadow] placeholder:text-text-muted focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-brand/35 disabled:cursor-not-allowed disabled:opacity-100 sm:px-[23px] sm:py-[23px]"
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-helper text-text-muted">{formatDisplayCount(value.length)} / 10,000</p>
              <div className="flex items-center gap-3">
                  {savedContent !== null && savedContent === value && !savePending ? (
                    <span className="text-label font-medium text-brand" role="status">Saved</span>
                  ) : null}
                  {isDirty ? (
                    <Button variant="secondary" disabled={savePending || reloadPending} onClick={() => {
                      setSavedContent(null);
                      onDiscard();
                    }}>
                      Discard
                    </Button>
                  ) : null}
                  <Button
                    disabled={!isDirty || !value.trim() || savePending || reloadPending || needsRefresh}
                    onClick={() => void handleSave()}
                  >
                    {savePending ? "Saving..." : "Save Note"}
                  </Button>
              </div>
            </div>
            {saveError ? (
              <RequestErrorState
                className="mt-3"
                title={needsRefresh ? "Load the latest note before saving" : "Your note wasn’t saved"}
                message={saveError}
                onRetry={needsRefresh ? () => void handleReload() : undefined}
                retryPending={reloadPending}
                retryLabel="Load latest note"
              />
            ) : null}
            </>
          ) : (
            <div className="mt-3.5 min-h-[120px] rounded-surface border border-border-default bg-surface-subtle px-5 py-4">
              <p className="whitespace-pre-wrap text-label leading-6 text-text-body">
                {value.trim() || "No note was added for this section."}
              </p>
              <p className="mt-4 text-helper text-text-muted">
                This note is read-only because the assignment is no longer in review.
              </p>
            </div>
          )
        )}

        {history.length > 0 ? (
          <div className="mt-8 flex flex-col gap-3">
            <h3 className="text-label font-medium text-white">Previous assignment notes</h3>
            {history.map((note) => (
              <div key={note.id} className="rounded-surface border border-border-default bg-surface-subtle p-4">
                <p className="whitespace-pre-wrap text-label leading-6 text-text-body">{note.content}</p>
                <p className="mt-2 text-helper text-text-muted">Updated {formatDate(note.updated_at)}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
