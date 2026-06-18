"use client";

import {
  ArrowNarrowLeftIcon,
  ArrowNarrowRightIcon,
  Button,
  PlusIcon,
} from "@/components/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { downloadPdf, queuePdfExport, ReportApiError } from "../../api/reportApi";
import { reportQueryKeys } from "../../api/reportQueryKeys";
import { REPORT_SECTION_DEFINITIONS } from "../../constants/reportSections";
import {
  useGenerateReportMutation,
  useReportStatus,
} from "../../hooks/useGenerateReport";
import { clearAllReportQueries } from "../../store/reportWizardSession";
import { useReportWizardStore } from "../../store/useReportWizardStore";
import type { ReportStatusSection, SectionType } from "../../types";
import {
  getSectionAccordionKey,
  ReportSectionAccordion,
  type ReportSectionAccordionItem,
} from "./ReportSectionAccordion";

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
  selectedSectionIds: SectionType[],
): ReportSectionAccordionItem[] {
  const sectionsByType = new Map(
    statusSections.map((section) => [section.section_type, section]),
  );

  return selectedSectionIds.flatMap((sectionType, index) => {
    const section = sectionsByType.get(sectionType);
    if (!section) {
      return [];
    }

    const definition = REPORT_SECTION_DEFINITIONS.find(
      (item) => item.id === sectionType,
    );

    return [
      {
        section,
        order: index + 1,
        title: section.display_name ?? definition?.title ?? sectionType,
        description: definition?.description ?? "",
        accordionKey: getSectionAccordionKey(section, sectionType),
      },
    ];
  });
}

export function ReportResults() {
  const queryClient = useQueryClient();
  const reportId = useReportWizardStore((s) => s.reportId);
  const drugName = useReportWizardStore((s) => s.drugName);
  const indications = useReportWizardStore((s) => s.indications);
  const selectedSectionIds = useReportWizardStore((s) => s.selectedSectionIds);
  const setStep = useReportWizardStore((s) => s.setStep);
  const resetWizard = useReportWizardStore((s) => s.resetWizard);
  const setGenerationJobId = useReportWizardStore((s) => s.setGenerationJobId);

  const { data: reportStatus, isLoading, isError, error } =
    useReportStatus(reportId);
  const retryMutation = useGenerateReportMutation();

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const sections = reportStatus?.sections;

  const sectionItems = useMemo(() => {
    if (!sections) {
      return [];
    }

    return buildSectionItems(sections, selectedSectionIds);
  }, [sections, selectedSectionIds]);

  const reportTitle = buildReportTitle(drugName, indications);
  const isCompleted = reportStatus?.report_status === "completed";
  const isFailed = reportStatus?.report_status === "failed";
  const isGenerating =
    Boolean(reportStatus) &&
    !isCompleted &&
    !isFailed;

  const subtitle = isCompleted
    ? `Evidence Report - Generated on ${new Date().toLocaleDateString()}`
    : isFailed
      ? "Evidence Report - Generation failed"
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
      await queuePdfExport(reportId);
      const blob = await downloadPdf(reportId);
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
          onClick={() => setStep(2)}
        >
          Filters
        </Button>
      </div>

      {isFailed && reportStatus.status_reason && (
        <div
          className="rounded-card border border-red-400/40 bg-red-400/10 px-8 py-6"
          role="alert"
        >
          <p className="text-body-lg text-red-400">
            {reportStatus.status_reason}
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
              onToggle={() =>
                setExpandedKey(
                  expandedKey === item.accordionKey ? null : item.accordionKey,
                )
              }
            />
          ))
        )}
      </div>

      <footer className="mt-auto border-t border-border-default pt-7">
        {exportError && (
          <p className="mb-4 text-body-lg text-red-400" role="alert">
            {exportError}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => {
              clearAllReportQueries(queryClient);
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
            disabled={!isCompleted || isExporting}
            onClick={handleExport}
          >
            {isExporting ? "Preparing PDF…" : "Get Report"}
          </Button>
        </div>
      </footer>
    </div>
  );
}
