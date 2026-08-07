"use client";

import {
  ArrowNarrowLeftIcon,
  ArrowNarrowRightIcon,
  Button,
  PlusIcon,
} from "@/components/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  downloadPdfWhenReady,
  ReportApiError,
} from "../../api/reportApi";
import { reportQueryKeys } from "../../api/reportQueryKeys";
import {
  useGenerateReportMutation,
  useQueuePdfExport,
  useReportStatus,
} from "../../hooks/useGenerateReport";
import { clearReportQueriesForReport } from "../../store/reportWizardSession";
import { useReportWizardStore } from "../../store/useReportWizardStore";
import type { ReportStatusSection, WizardSectionId } from "../../types";
import { getReportSectionDefinition } from "../../utils/sectionOrdering";
import {
  getSectionAccordionKey,
  ReportSectionAccordion,
  type ReportSectionAccordionItem,
} from "./ReportSectionAccordion";
import { SearchFiltersModal } from "./SearchFiltersModal";

function getErrorMessage(error: unknown): string {
  if (error instanceof ReportApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

function buildReportTitle(drugName: string, indications: string): string {
  const drug = drugName.trim();
  const disease = indications.trim();

  if (drug && disease) {
    return `${drug} — ${disease}`;
  }

  return drug || disease || "Evidence Report";
}

function buildSectionItems(
  statusSections: ReportStatusSection[],
  selectedSectionIds: WizardSectionId[],
): ReportSectionAccordionItem[] {
  const sectionsByType = new Map(
    statusSections.map((section) => [section.section_type, section]),
  );

  const items: ReportSectionAccordionItem[] = [];

  selectedSectionIds.forEach((sectionId, index) => {
    const section = sectionsByType.get(sectionId);
    if (!section) {
      return;
    }

    const definition = getReportSectionDefinition(sectionId);

    items.push({
      section,
      order: index + 1,
      title: section.display_name ?? definition?.title ?? sectionId,
      description: definition?.description ?? "",
      accordionKey: getSectionAccordionKey(section, sectionId),
      pendingContext: section.pending_context,
    });
  });

  return items;
}

export function ReportResults() {
  const queryClient = useQueryClient();
  const reportId = useReportWizardStore((s) => s.reportId);
  const drugName = useReportWizardStore((s) => s.drugName);
  const indications = useReportWizardStore((s) => s.indications);
  const filters = useReportWizardStore((s) => s.filters);
  const selectedSectionIds = useReportWizardStore((s) => s.selectedSectionIds);
  const setStep = useReportWizardStore((s) => s.setStep);
  const resetWizard = useReportWizardStore((s) => s.resetWizard);
  const setGenerationJobId = useReportWizardStore((s) => s.setGenerationJobId);

  const { data: reportStatus, isLoading, isError, error } =
    useReportStatus(reportId);
  const retryMutation = useGenerateReportMutation();

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const scrollCompensationRef = useRef<{
    element: HTMLDivElement;
    topBefore: number;
  } | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const sections = reportStatus?.sections;

  const sectionItems = useMemo(
    () => buildSectionItems(sections ?? [], selectedSectionIds),
    [sections, selectedSectionIds],
  );

  const reportTitle = buildReportTitle(drugName, indications);
  const isCompleted = reportStatus?.report_status === "completed";
  const isPartiallyCompleted =
    reportStatus?.report_status === "partially_completed";
  const isReportReady = isCompleted || isPartiallyCompleted;
  const isGenerating =
    reportStatus?.report_status === "pending" ||
    reportStatus?.report_status === "processing";

  const pdfQueueQuery = useQueuePdfExport(reportId, isReportReady);
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

  useEffect(() => {
    if (!isReportReady || !reportId || !sections) return;
    sections
      .filter((s) => s.status === "partially_completed" && s.section_id)
      .forEach((s) =>
        queryClient.invalidateQueries({
          queryKey: reportQueryKeys.section(reportId, s.section_id!),
        }),
      );
    // Intentionally keyed on the terminal-status transition only — sections at that moment
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [isReportReady]);

  const subtitle = isCompleted
    ? `Evidence Report - Generated on ${new Date().toLocaleDateString()}`
    : isPartiallyCompleted
      ? `Evidence Report - Partially generated on ${new Date().toLocaleDateString()}`
      : "Evidence Report - Generation in progress";

  const handleRetry = async () => {
    if (!reportId) {
      return;
    }

    setRetryError(null);

    try {
      const result = await retryMutation.mutateAsync({
        reportId,
        input: {
          force_regenerate: true,
          idempotency_key: crypto.randomUUID(),
        },
      });
      setGenerationJobId(result.job_id);
      await queryClient.invalidateQueries({
        queryKey: reportQueryKeys.status(reportId),
      });
      await queryClient.removeQueries({
        queryKey: reportQueryKeys.pdfQueue(reportId),
      });
    } catch (retryFailure) {
      setRetryError(getErrorMessage(retryFailure));
    }
  };

  const handleExport = async () => {
    if (!reportId) {
      return;
    }

    setExportError(null);
    setIsExporting(true);

    try {
      const blob = await downloadPdfWhenReady(reportId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const safeDrugName = drugName.trim().replace(/\s+/g, "_") || "report";
      anchor.href = url;
      anchor.download = `${safeDrugName}_evidence_report.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (exportFailure) {
      setExportError(getErrorMessage(exportFailure));
    } finally {
      setIsExporting(false);
    }
  };

  if (!reportId) {
    return (
      <p className="text-body-lg text-red-400" role="alert">
        Report is not configured. Go back to Filters and continue again.
      </p>
    );
  }

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
            {reportTitle}
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

      {isPartiallyCompleted && (
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
              disabled={retryMutation.isPending}
            >
              {retryMutation.isPending ? "Retrying…" : "Retry generation"}
            </Button>
            {retryError && (
              <p className="text-helper text-red-400">{retryError}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {sectionItems.length === 0 ? (
          <p className="text-body-lg text-text-muted">
            Waiting for section status…
          </p>
        ) : (
          sectionItems.map((item) => (
            <ReportSectionAccordion
              key={item.accordionKey}
              reportId={reportId}
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
            onClick={() => {
              if (reportId) {
                clearReportQueriesForReport(queryClient, reportId);
              }
              resetWizard();
              setStep(1);
            }}
            leadingIcon={<ArrowNarrowLeftIcon />}
            className="pl-3.5 pr-5"
          >
            Back to Evaluation
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
