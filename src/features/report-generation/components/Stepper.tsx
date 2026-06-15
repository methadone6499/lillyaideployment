"use client";

import { cn } from "@/lib/cn";
import { WIZARD_STEPS } from "../store/useReportWizardStore";
import type { WizardStep } from "../types";

type StepperProps = {
  currentStep: WizardStep;
};

export function Stepper({ currentStep }: StepperProps) {
  return (
    <div className="flex flex-wrap items-center gap-0">
      {WIZARD_STEPS.map((item, index) => {
        const isActive = item.step === currentStep;
        const isPast = item.step < currentStep;

        return (
          <div key={item.step} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-3 rounded-card p-3",
                isActive && "border border-brand-border bg-brand-bg",
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-step-badge text-label",
                  isActive || isPast
                    ? "bg-brand-badge text-white"
                    : "bg-surface-default text-white",
                )}
              >
                {item.step}
              </span>
              <span className="text-card-title font-medium text-white">
                {item.label}
              </span>
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <div className="mx-1 h-px w-9 bg-border-default" />
            )}
          </div>
        );
      })}
    </div>
  );
}
