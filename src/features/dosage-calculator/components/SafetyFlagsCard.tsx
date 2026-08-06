import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { DosagePreviewSafetyFlag } from "../data/dosageCalculatorFixtures";

type SafetyFlagsCardProps = {
  flags: readonly DosagePreviewSafetyFlag[];
};

const severityClasses: Record<DosagePreviewSafetyFlag["severity"], string> = {
  warning: "border-status-running/[0.12] bg-status-running/[0.08]",
  danger: "border-[#d92243]/[0.12] bg-[#d92243]/[0.08]",
};

export function SafetyFlagsCard({ flags }: SafetyFlagsCardProps) {
  return (
    <Card className="w-full overflow-hidden rounded-button">
      <div className="min-h-22 border-b border-border-default px-6 py-5">
        <h2 className="text-card-title font-medium text-white">Safety flags</h2>
        <p className="mt-2 text-helper text-text-muted">
          {flags.length} considerations identified
        </p>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        {flags.map((flag) => (
          <section
            key={`${flag.severity}-${flag.title}`}
            className={cn(
              "rounded-card border p-4",
              severityClasses[flag.severity],
            )}
          >
            <h3 className="text-body-lg font-medium text-white">
              {flag.title}
            </h3>
            <p className="mt-2 text-helper leading-normal text-text-muted">
              {flag.description}
            </p>
          </section>
        ))}
      </div>
    </Card>
  );
}
