"use client";

import {
  ArrowNarrowLeftIcon,
  ArrowNarrowRightIcon,
  Button,
} from "@/components/ui";
import type { WizardStep } from "../types";

type WizardFooterProps = {
  currentStep: WizardStep;
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  showBack?: boolean;
  continueDisabled?: boolean;
};

export function WizardFooter({
  currentStep,
  onBack,
  onContinue,
  continueLabel = "Continue",
  showBack = true,
  continueDisabled = false,
}: WizardFooterProps) {
  return (
    <footer className="mt-auto border-t border-border-default pt-7">
      <div className="flex items-center justify-between">
        {showBack && onBack ? (
          <Button
            variant="secondary"
            onClick={onBack}
            leadingIcon={<ArrowNarrowLeftIcon />}
            className="pl-3.5 pr-5"
          >
            Back
          </Button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-7">
          <span className="text-body-lg font-medium text-text-step">
            Step {currentStep} of 6
          </span>
          <Button
            onClick={onContinue}
            disabled={continueDisabled}
            trailingIcon={<ArrowNarrowRightIcon />}
            className="pl-5 pr-3"
          >
            {continueLabel}
          </Button>
        </div>
      </div>
    </footer>
  );
}
