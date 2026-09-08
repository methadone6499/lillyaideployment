"use client";

import {
  ArrowNarrowLeftIcon,
  ArrowNarrowRightIcon,
  Button,
  PlusIcon,
} from "@/components/ui";
import type { GenerationFilters } from "@/features/reports";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  downloadPdfWhenReady,
  downloadPptxWhenReady,
  ReportApiError,
} from "../../api/reportApi";
import {
  useQueuePdfExport,
  useReportStatus,
} from "../../hooks/useGenerateReport";
import type {
  ReportSectionContent,
  ReportStatusSection,
} from "../../types";
import { formatPptxExportProgress } from "../../utils/pptxExportProgress";
import {
  getReportSectionDefinition,
  isCustomSectionType,
  isWizardSectionId,
  mergeViewerSectionIds,
} from "../../utils/sectionOrdering";
import {
  getSectionAccordionKey,
  ReportSectionAccordion,
  type ReportSectionAccordionItem,
} from "./ReportSectionAccordion";
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

function buildSectionItems(
  statusSections: ReportStatusSection[],
  selectedSectionIds: string[],
  customSectionTitles: readonly string[] = [],
): ReportSectionAccordionItem[] {
  const sectionsByType = new Map<string, ReportStatusSection>(
    statusSections.map((section) => [section.section_type, section]),
  );

  const outlineIds = mergeViewerSectionIds(selectedSectionIds, statusSections);
  const items: ReportSectionAccordionItem[] = [];
  let customTitleIndex = 0;

  outlineIds.forEach((sectionId) => {
    const isCustom = isCustomSectionType(sectionId);
    const fallbackCustomTitle = isCustom
      ? customSectionTitles[customTitleIndex]
      : undefined;
    if (isCustom) {
      customTitleIndex += 1;
    }

    const section = sectionsByType.get(sectionId);
    if (!section) {
      return;
    }

    const definition = isWizardSectionId(sectionId)
      ? getReportSectionDefinition(sectionId)
      : undefined;

    items.push({
      section,
      order: items.length + 1,
      title:
        section.display_name ??
        fallbackCustomTitle ??
        definition?.title ??
        sectionId,
      description: isCustom ? "" : (definition?.description ?? ""),
      accordionKey: getSectionAccordionKey(section, section.section_type),
      pendingContext: section.pending_context,
    });
  });

  return items;
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

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const scrollCompensationRef = useRef<{
    element: HTMLDivElement;
    topBefore: number;
  } | null>(null);
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
  const [sessionContentByKey, setSessionContentByKey] = useState<
    Record<string, ReportSectionContent>
  >({});
  const [discardVersionByKey, setDiscardVersionByKey] = useState<
    Record<string, number>
  >({});
  const [pendingViewerAction, setPendingViewerAction] =
    useState<PendingViewerAction | null>(null);

  const sections = reportStatus?.sections;

  const sectionItems = useMemo(
    () =>
      buildSectionItems(
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

  const pdfQueueQuery = useQueuePdfExport(reportServiceId, isReportReady);
  const pdfQueueErrorMessage = pdfQueueQuery.isError
    ? getErrorMessage(pdfQueueQuery.error)
    : null;

  useLayoutEffect(() => {
    const pending = scrollCompensationRef.current;
    if (!pending) {
      return;
    }

    const { element, topBefore } = pending;
    const topAfter = element.getBoundingClientRect().top;
    const delta = topAfter - topBefore;

    if (Math.abs(delta) > 0.5) {
      window.scrollBy({ top: delta, behavior: "instant" });
    }

    scrollCompensationRef.current = null;
  }, [expandedKey]);

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

      const isSwitching =
        expandedKey !== null && expandedKey !== action.accordionKey;

      if (isSwitching && action.element.isConnected) {
        scrollCompensationRef.current = {
          element: action.element,
          topBefore: action.element.getBoundingClientRect().top,
        };
      }

      if (action.kind === "edit") {
        setExpandedKey(action.accordionKey);
        setEditingKey(action.accordionKey);
        return;
      }

      const nextExpandedKey =
        expandedKey === action.accordionKey ? null : action.accordionKey;
      setExpandedKey(nextExpandedKey);
      if (editingKey && editingKey !== nextExpandedKey) {
        setEditingKey(null);
      }
    },
    [editingKey, expandedKey, onBack],
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

  const handleSessionSave = useCallback(
    (accordionKey: string, content: ReportSectionContent) => {
      setSessionContentByKey((current) => ({
        ...current,
        [accordionKey]: content,
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
        errorMessage={exportError ?? pdfQueueErrorMessage}
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

      <div className="flex flex-col gap-4">
        {sectionItems.length === 0 ? (
          <p className="text-body-lg text-text-muted">
            {isJobFailed
              ? "No sections are available for this report."
              : "Waiting for section status…"}
          </p>
        ) : (
          sectionItems.map((item) => (
            <ReportSectionAccordion
              key={`${item.accordionKey}:${discardVersionByKey[item.accordionKey] ?? 0}`}
              reportServiceId={reportServiceId}
              reportStatus={reportStatus.report_status}
              item={item}
              expanded={expandedKey === item.accordionKey}
              isEditing={editingKey === item.accordionKey}
              sessionContent={sessionContentByKey[item.accordionKey]}
              onToggle={(element) =>
                requestViewerAction({
                  kind: "toggle",
                  accordionKey: item.accordionKey,
                  element,
                })
              }
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
              onSessionSave={handleSessionSave}
            />
          ))
        )}
      </div>

      <footer className="mt-auto border-t border-border-default pt-7">
        {Object.keys(sessionContentByKey).length > 0 && (
          <p className="mb-4 text-helper text-status-running" role="status">
            Session-only edits are not included in exports until the editing API
            is connected. Exporting now uses the original generated content.
          </p>
        )}
        {!isExportModalOpen && (exportError || pdfQueueErrorMessage) && (
          <p className="mb-4 text-body-lg text-red-400" role="alert">
            {exportError ?? pdfQueueErrorMessage}
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
