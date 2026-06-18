"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  createReport,
  discoverClinicalArticles,
  discoverComparators,
  discoverEconomicArticles,
  ReportApiError,
} from "../api/reportApi";
import { reportQueryKeys } from "../api/reportQueryKeys";
import {
  useGenerateReportMutation,
  useUpdateReportSelectionsMutation,
} from "../hooks/useGenerateReport";
import {
  clearReportQueriesForReport,
  syncWizardWithAuthSession,
} from "../store/reportWizardSession";
import { useReportWizardStore } from "../store/useReportWizardStore";
import { mapFiltersToBackend } from "../utils/mapFiltersToBackend";
import { ReportResults } from "./results/ReportResults";
import { Stepper } from "./Stepper";
import { Step1DrugIntake } from "./steps/Step1DrugIntake";
import { Step2Filters } from "./steps/Step2Filters";
import { Step3Evidence } from "./steps/Step3Evidence";
import { Step4Comparators } from "./steps/Step4Comparators";
import { Step5Sections } from "./steps/Step5Sections";
import { WizardFooter } from "./WizardFooter";

function getErrorMessage(error: unknown): string {
  if (error instanceof ReportApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

const DISCOVERY_PREFETCH_LABELS = [
  "Clinical article discovery",
  "Economic article discovery",
  "Comparator discovery",
] as const;

function canContinueStep(
  step: number,
  drugName: string,
  indications: string,
  selectedSectionIds: string[],
): boolean {
  switch (step) {
    case 1:
      return Boolean(drugName.trim() && indications.trim());
    case 5:
      return selectedSectionIds.length > 0;
    default:
      return true;
  }
}

export function GenerateReportShell() {
  const queryClient = useQueryClient();
  const currentStep = useReportWizardStore((s) => s.currentStep);
  const drugName = useReportWizardStore((s) => s.drugName);
  const indications = useReportWizardStore((s) => s.indications);
  const filters = useReportWizardStore((s) => s.filters);
  const reportId = useReportWizardStore((s) => s.reportId);
  const selectedClinicalPmcids = useReportWizardStore(
    (s) => s.selectedClinicalPmcids,
  );
  const selectedEconomicPmcids = useReportWizardStore(
    (s) => s.selectedEconomicPmcids,
  );
  const selectedComparators = useReportWizardStore(
    (s) => s.selectedComparators,
  );
  const customComparators = useReportWizardStore((s) => s.customComparators);
  const selectedSectionIds = useReportWizardStore(
    (s) => s.selectedSectionIds,
  );
  const nextStep = useReportWizardStore((s) => s.nextStep);
  const prevStep = useReportWizardStore((s) => s.prevStep);
  const resetReportPipeline = useReportWizardStore((s) => s.resetReportPipeline);
  const setStep = useReportWizardStore((s) => s.setStep);
  const setReportId = useReportWizardStore((s) => s.setReportId);
  const setGenerationJobId = useReportWizardStore(
    (s) => s.setGenerationJobId,
  );

  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [step5Error, setStep5Error] = useState<string | null>(null);
  const [discoveryWarnings, setDiscoveryWarnings] = useState<string[]>([]);
  const [isPrefetchingDiscovery, setIsPrefetchingDiscovery] = useState(false);

  const createReportMutation = useMutation({
    mutationFn: createReport,
  });
  const saveSelectionsMutation = useUpdateReportSelectionsMutation();
  const generateMutation = useGenerateReportMutation();

  useEffect(() => {
    syncWizardWithAuthSession(queryClient);
  }, [queryClient]);

  const handleBack = () => {
    const nextStepNumber = currentStep - 1;

    if (nextStepNumber <= 2 && reportId) {
      clearReportQueriesForReport(queryClient, reportId);
      resetReportPipeline();
      setDiscoveryWarnings([]);
      setStep2Error(null);
      setStep5Error(null);
    }

    prevStep();
  };

  const handleContinue = async () => {
    if (currentStep === 2) {
      setStep2Error(null);
      setDiscoveryWarnings([]);

      try {
        const report = await createReportMutation.mutateAsync({
          drug: drugName.trim(),
          disease: indications.trim(),
          inputs: mapFiltersToBackend(filters),
        });

        setReportId(report.report_id);
        setIsPrefetchingDiscovery(true);

        const prefetchResults = await Promise.allSettled([
          queryClient.prefetchQuery({
            queryKey: reportQueryKeys.clinicalArticles(report.report_id),
            queryFn: () => discoverClinicalArticles(report.report_id),
          }),
          queryClient.prefetchQuery({
            queryKey: reportQueryKeys.economicArticles(report.report_id),
            queryFn: () => discoverEconomicArticles(report.report_id),
          }),
          queryClient.prefetchQuery({
            queryKey: reportQueryKeys.comparators(report.report_id),
            queryFn: () => discoverComparators(report.report_id),
          }),
        ]);

        const warnings = prefetchResults.flatMap((result, index) => {
          if (result.status === "fulfilled") {
            return [];
          }

          return [
            `${DISCOVERY_PREFETCH_LABELS[index]} failed: ${getErrorMessage(result.reason)}`,
          ];
        });

        setDiscoveryWarnings(warnings);
        setStep(3);
      } catch (error) {
        setStep2Error(getErrorMessage(error));
      } finally {
        setIsPrefetchingDiscovery(false);
      }

      return;
    }

    if (currentStep === 5) {
      setStep5Error(null);

      if (!reportId) {
        setStep5Error(
          "Report is not configured. Go back to Filters and continue again.",
        );
        return;
      }

      try {
        await saveSelectionsMutation.mutateAsync({
          reportId,
          input: {
            comparators: selectedComparators,
            custom_comparators: customComparators,
            clinical_pmcids: selectedClinicalPmcids,
            economic_pmcids: selectedEconomicPmcids,
            section_types: selectedSectionIds,
          },
        });
      } catch (error) {
        setStep5Error(getErrorMessage(error));
        return;
      }

      try {
        const result = await generateMutation.mutateAsync({
          reportId,
          input: {
            force_regenerate: false,
            idempotency_key: crypto.randomUUID(),
          },
        });
        setGenerationJobId(result.job_id);
        setStep(6);
      } catch (error) {
        setStep5Error(getErrorMessage(error));
      }

      return;
    }
    nextStep();
  };

  const isStep2Pending =
    createReportMutation.isPending || isPrefetchingDiscovery;

  const isResultsStep = currentStep === 6;

  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-white">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-[var(--layout-page-padding)] py-6">
        {!isResultsStep && (
          <div className="mb-12 flex max-w-[var(--layout-inner-width)] flex-col gap-7">
            <h1 className="text-page-title font-medium text-text-heading">
              Generate Report
            </h1>
            <p className="text-body-lg text-text-body">
              Configure inputs · the AI clinical intelligence engine will
              synthesize structured, HTA-compliant evidence.
            </p>
            <Stepper currentStep={currentStep} />
          </div>
        )}

        <div className="flex flex-1 flex-col">
          {currentStep === 2 && step2Error && (
            <p className="mb-6 text-body-lg text-red-400" role="alert">
              {step2Error}
            </p>
          )}
          {currentStep >= 3 && discoveryWarnings.length > 0 && (
            <div
              className="mb-6 flex flex-col gap-2 text-body-lg text-amber-300"
              role="status"
            >
              <p>
                Some discovery requests failed. You can continue, but results
                may be incomplete.
              </p>
              <ul className="list-disc pl-7">
                {discoveryWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          {currentStep === 1 && <Step1DrugIntake />}
          {currentStep === 2 && <Step2Filters />}
          {currentStep === 3 && <Step3Evidence />}
          {currentStep === 4 && <Step4Comparators />}
          {currentStep === 5 && step5Error && (
            <p className="mb-6 text-body-lg text-red-400" role="alert">
              {step5Error}
            </p>
          )}
          {currentStep === 5 && <Step5Sections />}
          {currentStep === 6 && <ReportResults />}
        </div>

        {!isResultsStep && (
          <WizardFooter
            currentStep={currentStep}
            onBack={currentStep > 1 ? handleBack : undefined}
            showBack={currentStep > 1}
            onContinue={handleContinue}
            continueLabel={
              currentStep === 5 ? "Generate Report" : "Continue"
            }
            continueDisabled={
              !canContinueStep(
                currentStep,
                drugName,
                indications,
                selectedSectionIds,
              ) ||
              saveSelectionsMutation.isPending ||
              generateMutation.isPending ||
              isStep2Pending
            }
          />
        )}
      </main>
    </div>
  );
}
