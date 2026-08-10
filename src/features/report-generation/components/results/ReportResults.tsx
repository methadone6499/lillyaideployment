"use client";

import { useQueryClient } from "@tanstack/react-query";
import { reportQueryKeys } from "../../api/reportQueryKeys";
import { useGenerateReportMutation } from "../../hooks/useGenerateReport";
import { clearReportQueriesForReport } from "../../store/reportWizardSession";
import { useReportWizardStore } from "../../store/useReportWizardStore";
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
  const setStep = useReportWizardStore((s) => s.setStep);
  const resetWizard = useReportWizardStore((s) => s.resetWizard);
  const setGenerationJobId = useReportWizardStore((s) => s.setGenerationJobId);

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
    setGenerationJobId(result.job_id);
    await queryClient.invalidateQueries({
      queryKey: reportQueryKeys.status(reportServiceId),
    });
    await queryClient.removeQueries({
      queryKey: reportQueryKeys.pdfQueue(reportServiceId),
    });
  };

  return (
    <ReportViewer
      reportServiceId={reportServiceId}
      title={buildReportTitle(drugName, indications)}
      filters={filters}
      selectedSectionIds={selectedSectionIds}
      onBack={handleBack}
      onRegenerate={handleRegenerate}
    />
  );
}
