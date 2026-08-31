import { Card } from "@/components/ui";

type DosageWarningsCardProps = {
  warnings: readonly string[];
};

export function DosageWarningsCard({ warnings }: DosageWarningsCardProps) {
  const hasWarnings = warnings.length > 0;

  return (
    <Card className="w-full overflow-hidden rounded-button">
      <div className="min-h-22 border-b border-border-default px-6 py-5">
        <h2 className="text-card-title font-medium text-white">Warnings</h2>
        <p className="mt-2 text-helper text-text-muted">
          {hasWarnings
            ? `${warnings.length} warning${warnings.length === 1 ? "" : "s"} from the calculator`
            : "No calculation warnings were returned."}
        </p>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        {hasWarnings ? (
          <ul className="flex flex-col gap-4">
            {warnings.map((warning, index) => (
              <li
                key={`${index}-${warning}`}
                className="rounded-card border border-status-running/[0.12] bg-status-running/[0.08] p-4"
              >
                <p className="text-helper leading-normal text-white">
                  {warning}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-helper leading-normal text-text-muted">
            The calculator did not return any warning strings for this run.
          </p>
        )}
      </div>
    </Card>
  );
}
