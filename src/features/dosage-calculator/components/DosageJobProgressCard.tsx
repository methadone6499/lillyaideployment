import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DOSAGE_CALCULATOR_ACTIVE_PROGRESS_PHASES } from "../constants/dosageCalculatorOptions";
import type { DosageCalculatorJobPhase } from "../schemas/dosageCalculatorSchemas";
import { getDosagePhaseLabel } from "../utils/dosageCalculatorDisplay";

export type DosageJobProgress = {
  phase: DosageCalculatorJobPhase;
  percent: number;
  detail: string;
};

type DosageJobProgressCardProps = {
  progress: DosageJobProgress;
};

function isPastPhase(
  phase: (typeof DOSAGE_CALCULATOR_ACTIVE_PROGRESS_PHASES)[number],
  current: DosageCalculatorJobPhase,
): boolean {
  if (current === "done") return true;

  const currentIndex = DOSAGE_CALCULATOR_ACTIVE_PROGRESS_PHASES.indexOf(
    current as (typeof DOSAGE_CALCULATOR_ACTIVE_PROGRESS_PHASES)[number],
  );
  const phaseIndex = DOSAGE_CALCULATOR_ACTIVE_PROGRESS_PHASES.indexOf(phase);
  return currentIndex >= 0 && phaseIndex < currentIndex;
}

export function DosageJobProgressCard({ progress }: DosageJobProgressCardProps) {
  const percent = Math.min(100, Math.max(0, Math.round(progress.percent)));
  const phaseLabel = getDosagePhaseLabel(progress.phase);

  return (
    <Card className="w-full overflow-hidden rounded-button">
      <div className="border-b border-border-default px-6 py-5">
        <h2 className="text-card-title font-medium text-white">
          Calculation progress
        </h2>
        <p className="mt-2 text-helper text-text-muted">
          {phaseLabel}
          {progress.detail ? ` · ${progress.detail}` : ""}
        </p>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        <ol className="flex flex-wrap gap-2">
          {DOSAGE_CALCULATOR_ACTIVE_PROGRESS_PHASES.map((phase) => {
            const current = progress.phase === phase;
            const complete = isPastPhase(phase, progress.phase);

            return (
              <li
                key={phase}
                className={cn(
                  "rounded-card px-2.5 py-2 text-helper font-medium",
                  current && "bg-brand-badge text-brand",
                  complete && !current && "bg-white/4 text-white",
                  !current && !complete && "bg-white/4 text-text-muted",
                )}
              >
                {getDosagePhaseLabel(phase)}
              </li>
            );
          })}
        </ol>

        <div
          role="progressbar"
          aria-label="Dosage calculation progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${percent}% ${progress.detail || phaseLabel}`}
          className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p
          role="status"
          aria-live="polite"
          className="text-helper text-text-muted"
        >
          {percent}% complete
        </p>
      </div>
    </Card>
  );
}
