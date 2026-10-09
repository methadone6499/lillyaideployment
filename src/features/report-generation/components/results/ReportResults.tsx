"use client";

import { useQueryClient } from "@tanstack/react-query";
import { reportQueryKeys } from "../../api/reportQueryKeys";
import { useGenerateReportMutation } from "../../hooks/useGenerateReport";
import { clearReportQueriesForReport } from "../../store/reportWizardSession";
import { useReportWizardStore } from "../../store/useReportWizardStore";
import { enabledCustomSectionTitles } from "../../utils/customSections";
import { buildApiSectionTypes } from "../../utils/sectionOrdering";
import { ReportViewer } from "./ReportViewer";

function buildReportTitle(drugName: string, indications: string): string {
  const drug = drugName.trim();
  const disease = indications.trim();

  if (drug && disease) {
    return `${drug} — ${disease}`;
  }

  return drug || disease || "Evidence Report";
}

export function ReportResults() {
  const queryClient = useQueryClient();
  const reportServiceId = useReportWizardStore((s) => s.reportServiceId);
  const drugName = useReportWizardStore((s) => s.drugName);
  const indications = useReportWizardStore((s) => s.indications);
  const filters = useReportWizardStore((s) => s.filters);
  const selectedSectionIds = useReportWizardStore((s) => s.selectedSectionIds);
  const customSections = useReportWizardStore((s) => s.customSections);
  const generationJobId = useReportWizardStore((s) => s.generationJobId);
  const activeGenerationSectionIds = useReportWizardStore(
    (s) => s.activeGenerationSectionIds,
  );
  const setStep = useReportWizardStore((s) => s.setStep);
  const resetWizard = useReportWizardStore((s) => s.resetWizard);
  const setGenerationJobId = useReportWizardStore((s) => s.setGenerationJobId);
  const setActiveGenerationSectionIds = useReportWizardStore(
    (s) => s.setActiveGenerationSectionIds,
  );

  const retryMutation = useGenerateReportMutation();

  if (!reportServiceId) {
    return (
      <p className="text-body-lg text-red-400" role="alert">
        Report is not configured. Go back to Filters and continue again.
      </p>
    );
  }

  const handleBack = () => {
    clearReportQueriesForReport(queryClient, reportServiceId);
    resetWizard();
    setStep(1);
  };

  const handleRegenerate = async () => {
    const result = await retryMutation.mutateAsync({
      reportServiceId,
      input: {
        force_regenerate: true,
        idempotency_key: crypto.randomUUID(),
      },
    });
    if (result.report_id !== reportServiceId) {
      throw new Error(
        `Report Service ID mismatch: expected ${reportServiceId}, got ${result.report_id}.`,
      );
    }
    setGenerationJobId(result.job_id);
    setActiveGenerationSectionIds(
      result.sections.map((section) => section.section_id),
    );
    await queryClient.invalidateQueries({
      queryKey: reportQueryKeys.status(reportServiceId),
    });
  };

  return (
    <ReportViewer
      reportServiceId={reportServiceId}
      title={buildReportTitle(drugName, indications)}
      filters={filters}
      selectedSectionIds={buildApiSectionTypes(
        selectedSectionIds,
        customSections,
      )}
      customSectionTitles={enabledCustomSectionTitles(customSections)}
      activeGenerationJobId={generationJobId}
      activeGenerationSectionIds={activeGenerationSectionIds}
      onBack={handleBack}
      onRegenerate={handleRegenerate}
    />
  );
}
