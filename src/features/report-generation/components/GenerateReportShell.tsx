"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import { useGenerateReportMutation } from "../hooks/useGenerateReport";
import { useReportWizardStore } from "../store/useReportWizardStore";
import { ReportResults } from "./results/ReportResults";
import { Stepper } from "./Stepper";
import { Step1DrugIntake } from "./steps/Step1DrugIntake";
import { Step2Filters } from "./steps/Step2Filters";
import { Step3Evidence } from "./steps/Step3Evidence";
import { Step4Comparators } from "./steps/Step4Comparators";
import { Step5Sections } from "./steps/Step5Sections";
import { WizardFooter } from "./WizardFooter";

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
  const currentStep = useReportWizardStore((s) => s.currentStep);
  const drugName = useReportWizardStore((s) => s.drugName);
  const indications = useReportWizardStore((s) => s.indications);
  const selectedSectionIds = useReportWizardStore(
    (s) => s.selectedSectionIds,
  );
  const nextStep = useReportWizardStore((s) => s.nextStep);
  const prevStep = useReportWizardStore((s) => s.prevStep);
  const setStep = useReportWizardStore((s) => s.setStep);
  const setGenerationJobId = useReportWizardStore(
    (s) => s.setGenerationJobId,
  );

  const generateMutation = useGenerateReportMutation();

  const handleContinue = async () => {
    if (currentStep === 5) {
      const result = await generateMutation.mutateAsync({
        drugName,
        indications,
        selectedSectionIds,
      });
      setGenerationJobId(result.jobId);
      setStep(6);
      return;
    }
    nextStep();
  };

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
          {currentStep === 1 && <Step1DrugIntake />}
          {currentStep === 2 && <Step2Filters />}
          {currentStep === 3 && <Step3Evidence />}
          {currentStep === 4 && <Step4Comparators />}
          {currentStep === 5 && <Step5Sections />}
          {currentStep === 6 && <ReportResults />}
        </div>

        {!isResultsStep && (
          <WizardFooter
            currentStep={currentStep}
            onBack={currentStep > 1 ? prevStep : undefined}
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
              ) || generateMutation.isPending
            }
          />
        )}
      </main>
    </div>
  );
}
