"use client";

import {
  ArrowNarrowLeftIcon,
  ArrowNarrowRightIcon,
  Button,
  SpinnerIcon,
} from "@/components/ui";
import type { WizardStep } from "../types";

type WizardFooterProps = {
  currentStep: WizardStep;
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  showBack?: boolean;
  continueDisabled?: boolean;
  continueDisabledReason?: string;
  continuePending?: boolean;
};

export function WizardFooter({
  currentStep,
  onBack,
  onContinue,
  continueLabel = "Continue",
  showBack = true,
  continueDisabled = false,
  continueDisabledReason,
  continuePending = false,
}: WizardFooterProps) {
  const helperId = "wizard-continue-helper";

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
            disabled={continueDisabled || continuePending}
            aria-busy={continuePending}
            aria-describedby={continueDisabledReason ? helperId : undefined}
            trailingIcon={continuePending ? <SpinnerIcon /> : <ArrowNarrowRightIcon />}
            className="pl-5 pr-3"
          >
            {continueLabel}
          </Button>
        </div>
      </div>
      {continueDisabledReason ? (
        <p id={helperId} className="mt-2 ml-auto max-w-72 text-right text-helper text-text-muted">
          {continueDisabledReason}
        </p>
      ) : null}
    </footer>
  );
}
