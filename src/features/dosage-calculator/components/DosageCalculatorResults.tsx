import { Button, Card } from "@/components/ui";
import type { Ref } from "react";
import type { DosageCalculatorResult } from "../schemas/dosageCalculatorSchemas";
import type { DosageCalculatorErrorState } from "../utils/classifyDosageCalculatorError";
import { DosageJobProgressCard, type DosageJobProgress } from "./DosageJobProgressCard";
import { DosageLabelResultCard } from "./DosageLabelResultCard";
import { DosageWarningsCard } from "./DosageWarningsCard";

type DosageCalculatorResultsProps = {
  headingRef?: Ref<HTMLHeadingElement>;
  progress: DosageJobProgress | null;
  isInProgress: boolean;
  isCompleted: boolean;
  result?: DosageCalculatorResult;
  error: DosageCalculatorErrorState | null;
  isRetrying: boolean;
  onRetry: () => void;
  onStartOver: () => void;
};

const DISCLAIMER =
  "LillyAI provides decision-support outputs only. This calculation uses labeled dosing and the unit price you entered. Not a substitute for medical judgment.";

export function DosageCalculatorResults({
  headingRef,
  progress,
  isInProgress,
  isCompleted,
  result,
  error,
  isRetrying,
  onRetry,
  onStartOver,
}: DosageCalculatorResultsProps) {
  const showRetry =
    !isInProgress && (Boolean(error?.retryable) || isCompleted);

  return (
    <section
      aria-labelledby="dosage-results-heading"
      className="flex w-full min-w-0 flex-col gap-4"
    >
      <h2
        ref={headingRef}
        id="dosage-results-heading"
        tabIndex={-1}
        className="sr-only outline-none"
      >
        Dosage calculation results
      </h2>

      {isInProgress && progress ? (
        <DosageJobProgressCard progress={progress} />
      ) : null}

      {error && !isInProgress ? (
        <Card className="w-full overflow-hidden rounded-button" role="alert">
          <div className="border-b border-border-default px-6 py-5">
            <h3 className="text-card-title font-medium text-white">
              Calculation could not finish
            </h3>
            <p className="mt-2 text-helper text-text-muted">
              {error.kind === "job_failed"
                ? "The job failed."
                : error.kind === "worker_unavailable"
                  ? "The calculation service is unavailable."
                  : error.kind === "job_not_found"
                    ? "This calculation could not be found."
                    : error.kind === "still_processing"
                      ? "This calculation is still processing."
                      : "Something went wrong."}
            </p>
          </div>
          <p className="px-6 py-4 text-input leading-5.5 text-status-running">
            {error.message}
          </p>
        </Card>
      ) : null}

      {isCompleted && result ? (
        <>
          <DosageLabelResultCard
            indicationMatch={result.indication_match}
            rows={result.table}
          />
          <DosageWarningsCard warnings={result.warnings} />
        </>
      ) : null}

      <aside
        aria-label="Medical disclaimer"
        className="rounded-card bg-surface-default px-5 py-5"
      >
        <p className="text-input leading-5.5 text-text-muted">
          <span className="text-text-heading">Disclaimer:</span> {DISCLAIMER}
        </p>
      </aside>

      <div className="flex flex-col gap-3 sm:flex-row">
        {showRetry ? (
          <Button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="h-14 flex-1 text-body-lg"
          >
            {isRetrying
              ? "Starting…"
              : isCompleted
                ? "Run again"
                : "Try again"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          onClick={onStartOver}
          className="h-14 flex-1 text-body-lg"
        >
          Start over
        </Button>
      </div>
    </section>
  );
}
