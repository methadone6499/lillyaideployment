"use client";

import {
  ArrowNarrowLeftIcon,
  ArrowNarrowRightIcon,
  Button,
  PlusIcon,
} from "@/components/ui";
import type { GenerationFilters } from "@/features/reports";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  downloadPdfWhenReady,
  downloadPptxWhenReady,
  ReportApiError,
} from "../../api/reportApi";
import { PDF_EXPORT_DEFAULT_PROGRESS_LABEL } from "../../constants/pdfExport";
import { useReportStatus } from "../../hooks/useGenerateReport";
import { useSingleExpandedSection } from "../../hooks/useSingleExpandedSection";
import type { EditableDocumentResponse } from "../../types";
import { buildReportSectionItems } from "../../utils/buildReportSectionItems";
import { formatPptxExportProgress } from "../../utils/pptxExportProgress";
import { ReportSectionAccordion } from "./ReportSectionAccordion";
import { ReportSectionPresentation } from "./ReportSectionPresentation";
import { ExportReportModal, type ExportReportFormat } from "./ExportReportModal";
import { ReportEditorConfirmationDialog } from "./ReportEditorConfirmationDialog";
import { SearchFiltersModal } from "./SearchFiltersModal";

export type ReportViewerProps = {
  reportServiceId: string;
  title: string;
  filters: GenerationFilters;
  selectedSectionIds: string[];
  /** Ordered fallback titles for `custom:<uuid>` rows (snapshot or wizard). */
  customSectionTitles?: string[];
  onBack: () => void;
  onRegenerate?: () => Promise<void>;
};

type ViewerAction =
  | {
      kind: "toggle" | "edit";
      accordionKey: string;
      element: HTMLDivElement;
    }
  | { kind: "back" }
  | { kind: "export" };

type PendingViewerAction = {
  action: ViewerAction;
  dirtyKey: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ReportApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReportViewer({
  reportServiceId,
  title,
  filters,
  selectedSectionIds,
  customSectionTitles,
  onBack,
  onRegenerate,
}: ReportViewerProps) {
  const { data: reportStatus, isLoading, isError, error } =
    useReportStatus(reportServiceId);

  const { expandedId, toggleSection, expandSection } =
    useSingleExpandedSection();
  const [retryError, setRetryError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [dirtySectionKeys, setDirtySectionKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [sessionDocumentByKey, setSessionDocumentByKey] = useState<
    Record<string, EditableDocumentResponse>
  >({});
  const [discardVersionByKey, setDiscardVersionByKey] = useState<
    Record<string, number>
  >({});
  const [pendingViewerAction, setPendingViewerAction] =
    useState<PendingViewerAction | null>(null);

  const sections = reportStatus?.sections;

  const sectionItems = useMemo(
    () =>
      buildReportSectionItems(
        sections ?? [],
        selectedSectionIds,
        customSectionTitles ?? [],
      ),
    [customSectionTitles, sections, selectedSectionIds],
  );

  const isCompleted = reportStatus?.report_status === "completed";
  const isPartiallyCompleted =
    reportStatus?.report_status === "partially_completed";
  const isJobFailed =
    reportStatus?.report_status === "failed" ||
    reportStatus?.job_status === "failed";
  const isReportReady = isCompleted || isPartiallyCompleted;
  const isGenerating =
    !isJobFailed &&
    (reportStatus?.report_status === "queued" ||
      reportStatus?.report_status === "pending" ||
      reportStatus?.report_status === "processing");

  const performViewerAction = useCallback(
    (action: ViewerAction) => {
      if (action.kind === "back") {
        onBack();
        return;
      }

      if (action.kind === "export") {
        setExportError(null);
        setIsExportModalOpen(true);
        return;
      }

      if (action.kind === "edit") {
        expandSection(action.accordionKey, action.element);
        setEditingKey(action.accordionKey);
        return;
      }

      const nextExpandedId = toggleSection(
        action.accordionKey,
        action.element,
      );
      if (editingKey && editingKey !== nextExpandedId) {
        setEditingKey(null);
      }
    },
    [editingKey, expandSection, onBack, toggleSection],
  );

  const requestViewerAction = useCallback(
    (action: ViewerAction) => {
      const dirtyKey =
        editingKey && dirtySectionKeys.has(editingKey)
          ? editingKey
          : dirtySectionKeys.values().next().value;
      const actionKeepsCurrentEditor =
        action.kind === "edit" && action.accordionKey === editingKey;

      if (dirtyKey && !actionKeepsCurrentEditor) {
        setPendingViewerAction({ action, dirtyKey });
        return;
      }

      performViewerAction(action);
    },
    [dirtySectionKeys, editingKey, performViewerAction],
  );

  const handleDirtyChange = useCallback(
    (accordionKey: string, dirty: boolean) => {
      setDirtySectionKeys((current) => {
        const next = new Set(current);
        if (dirty) {
          next.add(accordionKey);
        } else {
          next.delete(accordionKey);
        }
        return next;
      });
    },
    [],
  );

  const handleDocumentSaved = useCallback(
    (accordionKey: string, document: EditableDocumentResponse) => {
      setSessionDocumentByKey((current) => ({
        ...current,
        [accordionKey]: document,
      }));
      handleDirtyChange(accordionKey, false);
    },
    [handleDirtyChange],
  );

  useEffect(() => {
    if (dirtySectionKeys.size === 0) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirtySectionKeys]);

  const subtitle = isCompleted
    ? `Evidence Report - Generated on ${new Date().toLocaleDateString()}`
    : isPartiallyCompleted
      ? `Evidence Report - Partially generated on ${new Date().toLocaleDateString()}`
      : isJobFailed
        ? "Evidence Report - Generation failed"
        : "Evidence Report - Generation in progress";

  const handleRetry = async () => {
    if (!onRegenerate) {
      return;
    }

    setRetryError(null);
    setIsRetrying(true);

    try {
      await onRegenerate();
    } catch (retryFailure) {
      setRetryError(getErrorMessage(retryFailure));
    } finally {
      setIsRetrying(false);
    }
  };

  const handleExport = async (format: ExportReportFormat) => {
    setExportError(null);
    setExportProgress(null);
    setIsExporting(true);

    const safeTitle =
      title.trim().replace(/[^\w]+/g, "_").replace(/^_|_$/g, "") || "report";

    try {
      if (format === "pdf") {
        setExportProgress(PDF_EXPORT_DEFAULT_PROGRESS_LABEL);
        const blob = await downloadPdfWhenReady(reportServiceId);
        triggerBlobDownload(blob, `${safeTitle}_evidence_report.pdf`);
        return;
      }

      setExportProgress(formatPptxExportProgress(undefined));
      const blob = await downloadPptxWhenReady(reportServiceId, {
        onProgress: (progress, status) => {
          setExportProgress(
            formatPptxExportProgress(progress, status.phase),
          );
        },
      });
      triggerBlobDownload(blob, `${safeTitle}_presentation.pptx`);
    } catch (exportFailure) {
      setExportError(getErrorMessage(exportFailure));
      throw exportFailure;
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && !reportStatus) {
    return (
      <p className="text-body-lg text-text-muted">Generating report…</p>
    );
  }

  if (isError) {
    return (
      <p className="text-body-lg text-red-400" role="alert">
        {getErrorMessage(error)}
      </p>
    );
  }

  if (!reportStatus) {
    return (
      <p className="text-body-lg text-text-muted">Generating report…</p>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-7">
          <h1 className="text-page-title font-medium text-text-heading">
            {title}
          </h1>
          <p className="text-body-lg text-text-body">{subtitle}</p>
          {reportStatus.progress && isGenerating && (
            <p className="text-body-lg text-text-muted">
              {reportStatus.progress.completed_sections} of{" "}
              {reportStatus.progress.total_sections} sections complete
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          leadingIcon={<PlusIcon />}
          onClick={() => setIsFiltersOpen(true)}
        >
          Filters
        </Button>
      </div>

      <SearchFiltersModal
        open={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
      />

      <ExportReportModal
        open={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportProgress(null);
        }}
        onExport={handleExport}
        isExporting={isExporting}
        errorMessage={exportError}
        statusMessage={exportProgress}
      />

      {isJobFailed && (
        <div
          className="rounded-card border border-red-400/30 bg-red-400/10 px-8 py-6"
          role="alert"
        >
          <p className="text-body-lg text-red-400">
            {reportStatus.status_reason ??
              "Report generation failed. You can go back and try again."}
          </p>
          {onRegenerate && (
            <div className="mt-6 flex flex-col gap-3">
              <Button
                variant="secondary"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? "Retrying…" : "Retry generation"}
              </Button>
              {retryError && (
                <p className="text-helper text-red-400">{retryError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {isPartiallyCompleted && onRegenerate && (
        <div
          className="rounded-card border border-status-partial/30 bg-status-partial/10 px-8 py-6"
          role="status"
        >
          <p className="text-body-lg text-status-partial">
            {reportStatus.status_reason ??
              "Some sections could not be completed. Available sections can still be reviewed and exported."}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              variant="secondary"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? "Retrying…" : "Retry generation"}
            </Button>
            {retryError && (
              <p className="text-helper text-red-400">{retryError}</p>
            )}
          </div>
        </div>
      )}

      {isPartiallyCompleted && !onRegenerate && (
        <div
          className="rounded-card border border-status-partial/30 bg-status-partial/10 px-8 py-6"
          role="status"
        >
          <p className="text-body-lg text-status-partial">
            {reportStatus.status_reason ??
              "Some sections could not be completed. Available sections can still be reviewed and exported."}
          </p>
        </div>
      )}

      <ReportSectionPresentation
        items={sectionItems}
        expandedId={expandedId}
        onToggle={(id, element) =>
          requestViewerAction({
            kind: "toggle",
            accordionKey: id,
            element,
          })
        }
        emptyMessage={
          <p className="text-body-lg text-text-muted">
            {isJobFailed
              ? "No sections are available for this report."
              : "Waiting for section status…"}
          </p>
        }
        renderSection={(item, { expanded, onToggle }) => (
          <ReportSectionAccordion
            key={`${item.accordionKey}:${discardVersionByKey[item.accordionKey] ?? 0}`}
            reportServiceId={reportServiceId}
            reportStatus={reportStatus.report_status}
            item={item}
            expanded={expanded}
            isEditing={editingKey === item.accordionKey}
            sessionDocument={sessionDocumentByKey[item.accordionKey]}
            onToggle={onToggle}
            onRequestEdit={(element) =>
              requestViewerAction({
                kind: "edit",
                accordionKey: item.accordionKey,
                element,
              })
            }
            onStopEditing={() =>
              setEditingKey((current) =>
                current === item.accordionKey ? null : current,
              )
            }
            onDirtyChange={handleDirtyChange}
            onDocumentSaved={handleDocumentSaved}
          />
        )}
      />

      <footer className="mt-auto border-t border-border-default pt-7">
        {!isExportModalOpen && exportError && (
          <p className="mb-4 text-body-lg text-red-400" role="alert">
            {exportError}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => requestViewerAction({ kind: "back" })}
            leadingIcon={<ArrowNarrowLeftIcon />}
            className="pl-3.5 pr-5"
          >
            Back
          </Button>
          <Button
            trailingIcon={<ArrowNarrowRightIcon />}
            className="pl-5 pr-3"
            disabled={!isReportReady || isExporting}
            onClick={() => {
              requestViewerAction({ kind: "export" });
            }}
          >
            Get Report
          </Button>
        </div>
      </footer>

      <ReportEditorConfirmationDialog
        open={pendingViewerAction !== null}
        title="Discard unsaved changes?"
        description="You have unsaved section edits. Discard them before continuing?"
        confirmLabel="Discard and continue"
        onConfirm={() => {
          if (!pendingViewerAction) {
            return;
          }

          const { action, dirtyKey } = pendingViewerAction;
          setDiscardVersionByKey((current) => ({
            ...current,
            [dirtyKey]: (current[dirtyKey] ?? 0) + 1,
          }));
          handleDirtyChange(dirtyKey, false);
          setEditingKey(null);
          setPendingViewerAction(null);
          performViewerAction(action);
        }}
        onCancel={() => setPendingViewerAction(null)}
      />
    </div>
  );
}
