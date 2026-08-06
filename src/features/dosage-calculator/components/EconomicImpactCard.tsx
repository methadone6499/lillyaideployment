import { Card } from "@/components/ui";
import type { DosageResultPreviewFixture } from "../data/dosageCalculatorFixtures";

type EconomicImpactCardProps = {
  impact: DosageResultPreviewFixture["economicImpact"];
};

export function EconomicImpactCard({ impact }: EconomicImpactCardProps) {
  return (
    <Card className="w-full overflow-hidden rounded-button">
      <div className="min-h-22 border-b border-border-default px-6 py-5">
        <h2 className="text-card-title font-medium text-white">
          Estimated economic impact
        </h2>
        <p className="mt-2 text-helper text-text-muted">{impact.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-3">
        {impact.metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-card border border-white/8 bg-white/4 p-4"
          >
            <p className="text-helper text-text-muted">{metric.label}</p>
            <p className="mt-2 text-card-title font-medium text-white">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
