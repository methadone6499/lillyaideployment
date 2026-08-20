"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import { useIsAuthenticated } from "@/features/auth";
import {
  buildCreateReportInput,
  createReportInputSchema,
  enqueuePendingPlatformSave,
  enqueuePendingPlatformSaveValidationFailure,
  generationFiltersSchema,
  markPendingPlatformSaveFailed,
  platformReportQueryKeys,
  removePendingPlatformSave,
  savePlatformReportWithRetry,
  syncPendingPlatformSavesWithAuthSession,
  type CreateReportInput,
} from "@/features/reports";
import { ApiRequestError } from "@/services/ApiRequestError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ZodError } from "zod";
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
import { filterApiSectionIds } from "../utils/sectionOrdering";
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

function formatValidationDiagnostic(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
        return `${path}: ${issue.message}`;
      })
      .join("; ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Client validation failed while building the Platform save payload.";
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

function isStillCurrentPlatformSave(
  originatingUserId: string | null,
  originatingReportServiceId: string,
): boolean {
  const current = useReportWizardStore.getState();

  return (
    current.userId === originatingUserId &&
    current.reportServiceId === originatingReportServiceId &&
    current.currentStep === 6
  );
}

export function GenerateReportShell() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const currentStep = useReportWizardStore((s) => s.currentStep);
  const drugName = useReportWizardStore((s) => s.drugName);
  const indications = useReportWizardStore((s) => s.indications);
  const filters = useReportWizardStore((s) => s.filters);
  const reportServiceId = useReportWizardStore((s) => s.reportServiceId);
  const selectedClinicalArticleIds = useReportWizardStore(
    (s) => s.selectedClinicalArticleIds,
  );
  const selectedEconomicArticleIds = useReportWizardStore(
    (s) => s.selectedEconomicArticleIds,
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
  const resetFilters = useReportWizardStore((s) => s.resetFilters);
  const setStep = useReportWizardStore((s) => s.setStep);
  const setReportServiceId = useReportWizardStore((s) => s.setReportServiceId);
  const setGenerationJobId = useReportWizardStore(
    (s) => s.setGenerationJobId,
  );
  const setPlatformSaveState = useReportWizardStore(
    (s) => s.setPlatformSaveState,
  );

  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [step5Error, setStep5Error] = useState<string | null>(null);
  const [discoveryWarnings, setDiscoveryWarnings] = useState<string[]>([]);
  const [isPrefetchingDiscovery, setIsPrefetchingDiscovery] = useState(false);

  const createReportMutation = useMutation({
    mutationFn: (input: Parameters<typeof createReport>[0]) => createReport(input),
  });
  const saveSelectionsMutation = useUpdateReportSelectionsMutation();
  const generateMutation = useGenerateReportMutation();

  useEffect(() => {
    syncWizardWithAuthSession(queryClient);
    void syncPendingPlatformSavesWithAuthSession(queryClient);
  }, [queryClient]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [currentStep]);

  const handleBack = () => {
    const nextStepNumber = currentStep - 1;

    if (nextStepNumber <= 2 && reportServiceId) {
      clearReportQueriesForReport(queryClient, reportServiceId);
      resetReportPipeline();
      setDiscoveryWarnings([]);
      setStep2Error(null);
      setStep5Error(null);
    }

    prevStep();
  };

  const handleContinue = async () => {
    if (currentStep === 2) {
      if (!isAuthenticated) {
        return;
      }

      setStep2Error(null);
      setDiscoveryWarnings([]);

      try {
        const report = await createReportMutation.mutateAsync({
          drug: drugName.trim(),
          disease: indications.trim(),
          inputs: mapFiltersToBackend(filters),
        });

        setReportServiceId(report.report_id);
        setIsPrefetchingDiscovery(true);

        const prefetchResults = await Promise.allSettled([
          queryClient.prefetchQuery({
            queryKey: reportQueryKeys.clinicalArticles(report.report_id),
            queryFn: ({ signal }) =>
              discoverClinicalArticles(report.report_id, signal),
          }),
          queryClient.prefetchQuery({
            queryKey: reportQueryKeys.economicArticles(report.report_id),
            queryFn: ({ signal }) =>
              discoverEconomicArticles(report.report_id, signal),
          }),
          queryClient.prefetchQuery({
            queryKey: reportQueryKeys.comparators(report.report_id),
            queryFn: ({ signal }) =>
              discoverComparators(report.report_id, signal),
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

      if (!reportServiceId) {
        setStep5Error(
          "Report is not configured. Go back to Filters and continue again.",
        );
        return;
      }

      try {
        await saveSelectionsMutation.mutateAsync({
          reportServiceId,
          input: {
            comparators: selectedComparators,
            custom_comparators: customComparators,
            clinical_pmcids: selectedClinicalArticleIds,
            economic_pmcids: selectedEconomicArticleIds,
            section_types: filterApiSectionIds(selectedSectionIds),
          },
        });
      } catch (error) {
        setStep5Error(getErrorMessage(error));
        return;
      }

      try {
        const result = await generateMutation.mutateAsync({
          reportServiceId,
          input: {
            force_regenerate: false,
            idempotency_key: crypto.randomUUID(),
          },
        });

        if (result.report_id !== reportServiceId) {
          setStep5Error(
            `Report Service ID mismatch: expected ${reportServiceId}, got ${result.report_id}.`,
          );
          return;
        }

        const generationJobId = result.job_id;
        const originatingReportServiceId = result.report_id;
        setGenerationJobId(generationJobId);
        setReportServiceId(originatingReportServiceId);

        const wizard = useReportWizardStore.getState();
        const originatingUserId = wizard.userId;

        let createInput: CreateReportInput;
        let candidatePayload: CreateReportInput | null = null;
        try {
          const parsedFilters = generationFiltersSchema.parse(wizard.filters);
          candidatePayload = buildCreateReportInput({
            reportServiceId: originatingReportServiceId,
            generationJobId,
            drugName: wizard.drugName,
            indications: wizard.indications,
            filters: parsedFilters,
            selectedClinicalArticleIds: wizard.selectedClinicalArticleIds,
            selectedEconomicArticleIds: wizard.selectedEconomicArticleIds,
            selectedComparators: wizard.selectedComparators,
            customComparators: wizard.customComparators,
            selectedSectionIds: [...wizard.selectedSectionIds],
            customSections: [...wizard.customSections],
            submittedAt: new Date().toISOString(),
          });
          createInput = createReportInputSchema.parse(candidatePayload);
        } catch (validationError) {
          const validationDiagnostic =
            formatValidationDiagnostic(validationError);

          if (originatingUserId) {
            enqueuePendingPlatformSaveValidationFailure({
              userId: originatingUserId,
              reportServiceId: originatingReportServiceId,
              candidatePayload,
              validationDiagnostic,
            });
          }

          console.error(
            "Platform save payload validation failed",
            validationDiagnostic,
            validationError,
          );

          setPlatformSaveState("save_failed");
          setStep(6);
          return;
        }

        if (!originatingUserId) {
          setStep5Error(
            "Authenticated user is unavailable. Please refresh and try again.",
          );
          return;
        }

        enqueuePendingPlatformSave(originatingUserId, createInput);
        setPlatformSaveState("saving");
        setStep(6);

        void (async () => {
          try {
            const savedReport =
              await savePlatformReportWithRetry(createInput);

            removePendingPlatformSave(originatingReportServiceId);
            await queryClient.invalidateQueries({
              queryKey: platformReportQueryKeys.lists(),
            });
            await queryClient.invalidateQueries({
              queryKey: platformReportQueryKeys.companyLists(originatingUserId),
            });

            if (
              isStillCurrentPlatformSave(
                originatingUserId,
                originatingReportServiceId,
              )
            ) {
              const current = useReportWizardStore.getState();
              current.setPlatformReportId(savedReport.id);
              current.setPlatformSaveState("saved");
              router.replace(`/reports/${savedReport.id}`);
            }
          } catch (error) {
            markPendingPlatformSaveFailed(
              originatingReportServiceId,
              error instanceof ApiRequestError ? error.requestId : null,
            );

            if (
              isStillCurrentPlatformSave(
                originatingUserId,
                originatingReportServiceId,
              )
            ) {
              useReportWizardStore.getState().setPlatformSaveState("save_failed");
            }
          }
        })();
      } catch (error) {
        setStep5Error(getErrorMessage(error));
      }

      return;
    }

    if (currentStep === 1) {
      resetFilters();
      setStep2Error(null);
      nextStep();
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
