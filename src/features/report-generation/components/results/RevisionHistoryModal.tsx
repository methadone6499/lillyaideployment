"use client";

import { CloseIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ReportApiError } from "../../api/reportApiError";
import {
  useRestoreRevisionMutation,
  useSectionRevision,
  useSectionRevisions,
} from "../../hooks/useReportEditing";
import type { EditableDocumentResponse, EditingActor } from "../../types";
import { toReportSectionContent } from "../../utils/reportBlockEditing";
import {
  buildEditableDocumentTextDiff,
  buildRevisionHistoryItems,
  getRevisionComparisonRevision,
  toDisplayVersion,
  type RevisionDiffSegment,
} from "../../utils/revisionHistory";
import { SectionContentRenderer } from "./SectionContentRenderer";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const revisionDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

type RevisionView = "changes" | "preview";

type RevisionHistoryModalProps = {
  reportServiceId: string;
  sectionId: string;
  sectionTitle: string;
  currentRevision: number;
  actor: EditingActor | null;
  skipFirstHeading?: boolean;
  onClose: () => void;
  onRestored: (document: EditableDocumentResponse) => void;
};

function formatRevisionDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : revisionDateFormatter.format(date);
}

function getRevisionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ReportApiError || error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

function getVersionLabel(revision: number): string {
  return `Version ${toDisplayVersion(revision)}`;
}

function DiffSegment({ segment }: { segment: RevisionDiffSegment }) {
  if (segment.type === "unchanged") {
    return segment.text;
  }

  const isAdded = segment.type === "added";

  return (
    <span
      className={cn(
        "rounded-sm px-0.5",
        isAdded
          ? "bg-brand/15 text-emerald-200 underline decoration-brand decoration-2 underline-offset-2"
          : "bg-red-400/10 text-red-300 line-through decoration-red-300/80",
      )}
    >
      <span className="sr-only">{isAdded ? "Added: " : "Removed: "}</span>
      <span aria-hidden className="mr-0.5 font-medium">
        {isAdded ? "+" : "−"}
      </span>
      {segment.text}
    </span>
  );
}

export function RevisionHistoryModal({
  reportServiceId,
  sectionId,
  sectionTitle,
  currentRevision: initialCurrentRevision,
  actor,
  skipFirstHeading = false,
  onClose,
  onRestored,
}: RevisionHistoryModalProps) {
  const [selectedRevision, setSelectedRevision] = useState(
    initialCurrentRevision,
  );
  const [view, setView] = useState<RevisionView>("changes");
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const cancelRestoreRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const isRestoringRef = useRef(false);
  const isConfirmingRestoreRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  const revisionsQuery = useSectionRevisions(reportServiceId, sectionId);
  const currentRevision =
    revisionsQuery.data?.current_revision ?? initialCurrentRevision;
  const revisionItems = useMemo(
    () =>
      buildRevisionHistoryItems(
        currentRevision,
        revisionsQuery.data?.items ?? [],
      ),
    [currentRevision, revisionsQuery.data?.items],
  );
  const comparisonRevision = getRevisionComparisonRevision(
    selectedRevision,
    currentRevision,
  );
  const selectedDocumentQuery = useSectionRevision(
    reportServiceId,
    sectionId,
    selectedRevision,
  );
  const comparisonDocumentQuery = useSectionRevision(
    reportServiceId,
    sectionId,
    comparisonRevision,
    view === "changes" && comparisonRevision !== null,
  );
  const restoreMutation = useRestoreRevisionMutation();
  const selectedDocument = selectedDocumentQuery.data;
  const comparisonDocument = comparisonDocumentQuery.data;
  const textDiff = useMemo(
    () =>
      selectedDocument && comparisonDocument
        ? buildEditableDocumentTextDiff(
            comparisonDocument.blocks,
            selectedDocument.blocks,
          )
        : [],
    [comparisonDocument, selectedDocument],
  );
  const isContentLoading =
    selectedDocumentQuery.isLoading ||
    (view === "changes" &&
      comparisonRevision !== null &&
      comparisonDocumentQuery.isLoading);
  const contentError =
    selectedDocumentQuery.error ??
    (view === "changes" ? comparisonDocumentQuery.error : null);
  const isRestoring = restoreMutation.isPending;
  const canRestore = selectedRevision !== currentRevision;

  useEffect(() => {
    onCloseRef.current = onClose;
    isRestoringRef.current = isRestoring;
    isConfirmingRestoreRef.current = isConfirmingRestore;
  }, [isConfirmingRestore, isRestoring, onClose]);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isRestoringRef.current) {
          return;
        }
        if (isConfirmingRestoreRef.current) {
          setIsConfirmingRestore(false);
          return;
        }
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
        dialogRef.current.focus();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, []);

  useEffect(() => {
    if (!isConfirmingRestore) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      cancelRestoreRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(focusFrame);
  }, [isConfirmingRestore]);

  const selectRevision = (revision: number) => {
    setSelectedRevision(revision);
    setView("changes");
    setIsConfirmingRestore(false);
    setRestoreError(null);
    restoreMutation.reset();
  };

  const requestClose = () => {
    if (isRestoring) {
      return;
    }
    if (isConfirmingRestore) {
      setIsConfirmingRestore(false);
      return;
    }
    onClose();
  };

  const restoreSelectedRevision = async () => {
    if (!canRestore || !actor || isRestoring) {
      if (!actor) {
        setRestoreError("Your account details are required to restore a version.");
      }
      return;
    }

    setRestoreError(null);
    try {
      const restored = await restoreMutation.mutateAsync({
        reportServiceId,
        sectionId,
        revision: selectedRevision,
        input: {
          base_revision: currentRevision,
          actor,
        },
      });
      onRestored(restored);
      onClose();
    } catch (error) {
      setRestoreError(
        getRevisionErrorMessage(error, "Unable to restore this version."),
      );
      setIsConfirmingRestore(false);
    }
  };

  const selectedVersionLabel = getVersionLabel(selectedRevision);
  const comparisonVersionLabel =
    comparisonRevision === null ? null : getVersionLabel(comparisonRevision);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          requestClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isRestoring}
        tabIndex={-1}
        className="flex h-[calc(100dvh-2rem)] max-h-[720px] w-full max-w-[1040px] flex-col overflow-hidden rounded-card border border-border-default bg-[#171717] font-[family-name:var(--font-inter)] text-white shadow-2xl"
      >
        <header className="flex min-h-[67px] shrink-0 items-center justify-between border-b border-border-default px-5 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-card-title font-medium text-white">
              Revision history
            </h2>
            <p
              id={descriptionId}
              className="mt-1 truncate text-helper text-text-muted"
            >
              {sectionTitle}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={requestClose}
            disabled={isRestoring}
            className="inline-flex size-10 items-center justify-center text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close revision history"
          >
            <CloseIcon className="size-5" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <nav
            className="max-h-44 shrink-0 overflow-y-auto border-b border-border-default bg-black/15 p-3 md:max-h-none md:w-64 md:border-b-0 md:border-r"
            aria-label="Section versions"
          >
            <p className="mb-2 px-2 text-helper font-medium uppercase tracking-wide text-text-muted">
              Versions
            </p>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-1">
              {revisionItems.map((item) => {
                const formattedDate = formatRevisionDate(item.createdAt);
                const isSelected = selectedRevision === item.revision;

                return (
                  <button
                    key={item.revision}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => selectRevision(item.revision)}
                    className={cn(
                      "min-h-16 rounded-button border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                      isSelected
                        ? "border-border-default bg-surface-elevated"
                        : "border-transparent hover:bg-surface-default",
                    )}
                  >
                    <span className="flex items-center gap-2 text-input font-medium text-white">
                      {getVersionLabel(item.revision)}
                      {item.isCurrent ? (
                        <span className="rounded-full bg-brand-bg px-2 py-0.5 text-helper font-normal text-brand">
                          Current
                        </span>
                      ) : item.isOriginal ? (
                        <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-helper font-normal text-text-body">
                          Original
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-helper text-text-muted">
                      {formattedDate ??
                        (item.isOriginal
                          ? "Original generated version"
                          : "Saved version")}
                    </span>
                  </button>
                );
              })}
            </div>

            {revisionsQuery.isLoading && (
              <p className="mt-3 px-2 text-helper text-text-muted" role="status">
                Loading versions…
              </p>
            )}
            {revisionsQuery.isError && (
              <div className="mt-3 px-2">
                <p className="text-helper text-red-400" role="alert">
                  {getRevisionErrorMessage(
                    revisionsQuery.error,
                    "Unable to load all versions.",
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => void revisionsQuery.refetch()}
                  className="mt-2 text-helper font-medium text-white hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Try again
                </button>
              </div>
            )}
          </nav>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-label font-medium text-white">
                  {selectedVersionLabel}
                </h3>
                <p className="mt-1 text-helper text-text-muted">
                  {selectedRevision === currentRevision
                    ? "Current version"
                    : selectedRevision === 0
                      ? "Original generated version"
                      : "Previous version"}
                </p>
              </div>
              <div
                className="inline-flex rounded-button border border-border-default bg-black/15 p-1"
                aria-label="Revision view"
              >
                <button
                  type="button"
                  aria-pressed={view === "changes"}
                  onClick={() => setView("changes")}
                  className={cn(
                    "h-8 rounded-button px-3 text-helper font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                    view === "changes"
                      ? "bg-surface-elevated text-white"
                      : "text-text-muted hover:text-white",
                  )}
                >
                  Changes
                </button>
                <button
                  type="button"
                  aria-pressed={view === "preview"}
                  onClick={() => setView("preview")}
                  className={cn(
                    "h-8 rounded-button px-3 text-helper font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                    view === "preview"
                      ? "bg-surface-elevated text-white"
                      : "text-text-muted hover:text-white",
                  )}
                >
                  Full preview
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {isContentLoading && (
                <p className="text-body-lg text-text-muted" role="status">
                  Loading {view === "changes" ? "changes" : "version"}…
                </p>
              )}
              {contentError != null && !isContentLoading && (
                <p className="text-body-lg text-red-400" role="alert">
                  {getRevisionErrorMessage(
                    contentError,
                    "Unable to load this version.",
                  )}
                </p>
              )}

              {!isContentLoading && !contentError && view === "changes" && (
                <div>
                  {comparisonVersionLabel ? (
                    <p className="mb-5 text-helper text-text-muted">
                      Comparing {selectedVersionLabel} with {comparisonVersionLabel}
                    </p>
                  ) : (
                    <p className="mb-5 text-helper text-text-muted">
                      This is the only version of this section.
                    </p>
                  )}

                  {comparisonRevision === null ? (
                    <p className="rounded-button border border-border-default bg-surface-subtle px-4 py-4 text-label text-text-body">
                      There are no earlier changes to compare.
                    </p>
                  ) : textDiff.length === 0 ? (
                    <p className="rounded-button border border-border-default bg-surface-subtle px-4 py-4 text-label text-text-body">
                      No text differences were found between these versions.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {textDiff.map((change) => (
                        <article
                          key={change.key}
                          className="rounded-button border border-border-default bg-surface-subtle px-4 py-4"
                        >
                          <h4 className="mb-3 text-helper font-medium uppercase tracking-wide text-text-muted">
                            {change.label}
                          </h4>
                          <p className="whitespace-pre-wrap text-label leading-7 text-text-body">
                            {change.segments.map((segment, segmentIndex) => (
                              <DiffSegment
                                key={`${segment.type}:${segmentIndex}`}
                                segment={segment}
                              />
                            ))}
                          </p>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isContentLoading &&
                !contentError &&
                view === "preview" &&
                selectedDocument && (
                  <div className="text-body-lg">
                    <SectionContentRenderer
                      content={toReportSectionContent(selectedDocument.blocks)}
                      skipFirstHeading={skipFirstHeading}
                    />
                  </div>
                )}
            </div>

            {restoreError && (
              <p
                className="shrink-0 border-t border-red-400/20 bg-red-400/10 px-5 py-3 text-helper text-red-300 sm:px-6"
                role="alert"
              >
                {restoreError}
              </p>
            )}
          </section>
        </div>

        <footer className="flex min-h-[70px] shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border-default px-5 py-3 sm:px-6">
          {isConfirmingRestore && (
            <p className="mr-auto min-w-0 text-helper text-text-body">
              Restore {selectedVersionLabel} as a new current version? Existing
              versions will remain available.
            </p>
          )}
          <button
            ref={isConfirmingRestore ? cancelRestoreRef : undefined}
            type="button"
            onClick={requestClose}
            disabled={isRestoring}
            className="inline-flex h-10 items-center px-3 text-label font-medium text-white/72 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConfirmingRestore ? "Cancel" : "Close"}
          </button>
          {canRestore && !isConfirmingRestore && (
            <button
              type="button"
              onClick={() => {
                setRestoreError(null);
                setIsConfirmingRestore(true);
              }}
              className="inline-flex h-10 items-center rounded-button bg-brand px-4 text-label font-medium text-white transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {selectedRevision === 0
                ? "Restore original"
                : "Restore this version"}
            </button>
          )}
          {canRestore && isConfirmingRestore && (
            <button
              type="button"
              onClick={() => void restoreSelectedRevision()}
              disabled={isRestoring}
              className="inline-flex h-10 items-center rounded-button bg-brand px-4 text-label font-medium text-white transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRestoring
                ? "Restoring…"
                : selectedRevision === 0
                  ? "Restore original"
                  : "Restore version"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
