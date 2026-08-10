"use client";

import {
  ArrowNarrowLeftIcon,
  ArrowNarrowRightIcon,
  Button,
  PlusIcon,
} from "@/components/ui";
import type { GenerationFilters } from "@/features/reports";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  downloadPdfWhenReady,
  ReportApiError,
} from "../../api/reportApi";
import {
  useQueuePdfExport,
  useReportStatus,
} from "../../hooks/useGenerateReport";
import type { ReportStatusSection, WizardSectionId } from "../../types";
import { getReportSectionDefinition } from "../../utils/sectionOrdering";
import {
  getSectionAccordionKey,
  ReportSectionAccordion,
  type ReportSectionAccordionItem,
} from "./ReportSectionAccordion";
import { SearchFiltersModal } from "./SearchFiltersModal";

export type ReportViewerProps = {
  reportServiceId: string;
  title: string;
  filters: GenerationFilters;
  selectedSectionIds: string[];
  onBack: () => void;
  onRegenerate?: () => Promise<void>;
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
): ReportSectionAccordionItem[] {
  const sectionsByType = new Map(
    statusSections.map((section) => [section.section_type, section]),
  );

  const items: ReportSectionAccordionItem[] = [];

  selectedSectionIds.forEach((sectionId, index) => {
    const wizardSectionId = sectionId as WizardSectionId;
    const section = sectionsByType.get(wizardSectionId);
    if (!section) {
      return;
    }

    const definition = getReportSectionDefinition(wizardSectionId);

    items.push({
      section,
      order: index + 1,
      title: section.display_name ?? definition?.title ?? sectionId,
      description: definition?.description ?? "",
      accordionKey: getSectionAccordionKey(section, wizardSectionId),
      pendingContext: section.pending_context,
    });
  });

  return items;
}

export function ReportViewer({
  reportServiceId,
  title,
  filters,
  selectedSectionIds,
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
  const [isExporting, setIsExporting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const sections = reportStatus?.sections;

  const sectionItems = useMemo(
    () => buildSectionItems(sections ?? [], selectedSectionIds),
    [sections, selectedSectionIds],
  );

  const isCompleted = reportStatus?.report_status === "completed";
  const isPartiallyCompleted =
    reportStatus?.report_status === "partially_completed";
  const isJobFailed = reportStatus?.job_status === "failed";
  const isReportReady = isCompleted || isPartiallyCompleted;
  const isGenerating =
    !isJobFailed &&
    (reportStatus?.report_status === "pending" ||
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

  const handleSectionToggle = (
    accordionKey: string,
    element: HTMLDivElement,
  ) => {
    const isSwitching =
      expandedKey !== null && expandedKey !== accordionKey;

    if (isSwitching) {
      scrollCompensationRef.current = {
        element,
        topBefore: element.getBoundingClientRect().top,
      };
    }

    setExpandedKey(expandedKey === accordionKey ? null : accordionKey);
  };

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

  const handleExport = async () => {
    setExportError(null);
    setIsExporting(true);

    try {
      const blob = await downloadPdfWhenReady(reportServiceId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const safeTitle =
        title.trim().replace(/[^\w]+/g, "_").replace(/^_|_$/g, "") || "report";
      anchor.href = url;
      anchor.download = `${safeTitle}_evidence_report.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (exportFailure) {
      setExportError(getErrorMessage(exportFailure));
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
              key={item.accordionKey}
              reportServiceId={reportServiceId}
              reportStatus={reportStatus.report_status}
              item={item}
              expanded={expandedKey === item.accordionKey}
              onToggle={(element) =>
                handleSectionToggle(item.accordionKey, element)
              }
            />
          ))
        )}
      </div>

      <footer className="mt-auto border-t border-border-default pt-7">
        {(exportError || pdfQueueErrorMessage) && (
          <p className="mb-4 text-body-lg text-red-400" role="alert">
            {exportError ?? pdfQueueErrorMessage}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={onBack}
            leadingIcon={<ArrowNarrowLeftIcon />}
            className="pl-3.5 pr-5"
          >
            Back
          </Button>
          <Button
            trailingIcon={<ArrowNarrowRightIcon />}
            className="pl-5 pr-3"
            disabled={!isReportReady || isExporting}
            onClick={handleExport}
          >
            {isExporting ? "Preparing PDF…" : "Get Report"}
          </Button>
        </div>
      </footer>
    </div>
  );
}
