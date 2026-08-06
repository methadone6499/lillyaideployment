import { Card } from "@/components/ui";
import type { DosageResultPreviewFixture } from "../data/dosageCalculatorFixtures";
import { TitrationSchedule } from "./TitrationSchedule";

type RecommendedDosageCardProps = {
  recommendation: DosageResultPreviewFixture["recommendation"];
};

export function RecommendedDosageCard({
  recommendation,
}: RecommendedDosageCardProps) {
  const { initialTitration } = recommendation;

  return (
    <Card className="w-full overflow-hidden rounded-button">
      <div className="flex min-h-22 items-start justify-between gap-4 border-b border-border-default px-6 py-5">
        <div className="min-w-0">
          <h2 className="text-card-title font-medium text-white">
            Recommended dosage
          </h2>
          <p className="mt-2 text-helper text-text-muted">
            {recommendation.subtitle}
          </p>
        </div>
        <p className="shrink-0 rounded-card bg-brand-badge px-2.5 py-2 text-input font-medium text-brand">
          {recommendation.status}
        </p>
      </div>

      <div className="px-6 py-4">
        <div className="rounded-card border border-brand-border bg-brand-bg p-4">
          <p className="text-input font-medium text-white">
            {initialTitration.label}
          </p>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-1 text-white">
            <span className="text-card-title font-medium">
              {initialTitration.dose}
            </span>
            <span className="text-input font-medium">
              {initialTitration.administration}
            </span>
          </p>
          <p className="mt-2 text-helper text-text-muted">
            {initialTitration.guidance}
          </p>
        </div>
      </div>

      <TitrationSchedule rows={recommendation.schedule} />
    </Card>
  );
}
