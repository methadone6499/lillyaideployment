import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import type {
  DosageCalculatorIndicationMatch,
  DosageCalculatorTableRow,
} from "../schemas/dosageCalculatorSchemas";
import { getIndicationMatchNotice } from "../utils/dosageCalculatorDisplay";

type DosageLabelResultCardProps = {
  indicationMatch: DosageCalculatorIndicationMatch;
  rows: readonly DosageCalculatorTableRow[];
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-white/8 bg-white/4 p-4">
      <p className="text-helper text-text-muted">{label}</p>
      <p className="mt-2 text-card-title font-medium text-white">{value}</p>
    </div>
  );
}

export function DosageLabelResultCard({
  indicationMatch,
  rows,
}: DosageLabelResultCardProps) {
  const notice = getIndicationMatchNotice(indicationMatch);

  return (
    <Card className="w-full overflow-hidden rounded-button">
      <div className="flex min-h-22 items-start justify-between gap-4 border-b border-border-default px-6 py-5">
        <div className="min-w-0">
          <h2 className="text-card-title font-medium text-white">
            Label-based dosage and cost
          </h2>
          <p className="mt-2 text-helper text-text-muted">
            Dose, presentation, and costs from the labeled regimen and the
            unit price you provided.
          </p>
        </div>
        <p
          className={cn(
            "shrink-0 rounded-card px-2.5 py-2 text-input font-medium",
            notice.tone === "success"
              ? "bg-brand-badge text-brand"
              : "bg-status-running/[0.12] text-status-running",
          )}
        >
          {notice.title}
        </p>
      </div>

      <div
        className={cn(
          "mx-6 mt-4 rounded-card border p-4",
          notice.tone === "success"
            ? "border-brand-border bg-brand-bg"
            : "border-status-running/[0.12] bg-status-running/[0.08]",
        )}
        role={notice.tone === "warning" ? "status" : undefined}
      >
        <p className="text-helper leading-normal text-white">{notice.body}</p>
      </div>

      {rows.length === 0 ? (
        <p className="px-6 py-4 text-helper text-text-muted">
          No labeled dose rows were returned.
        </p>
      ) : (
        <div className="flex flex-col gap-4 px-6 py-4">
          {rows.map((row, index) => (
            <article
              key={`${row.drug_name}-${row.period}-${index}`}
              className="rounded-card border border-white/8 bg-white/4 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-body-lg font-medium text-white">
                  {row.drug_name}
                </h3>
                <p className="text-helper font-medium text-text-muted">
                  {row.period}
                </p>
              </div>

              <dl className="mt-4 flex flex-col gap-3">
                <div>
                  <dt className="text-helper text-text-muted">Dose</dt>
                  <dd className="mt-1 text-input font-medium text-white">
                    {row.dose}
                  </dd>
                </div>
                <div>
                  <dt className="text-helper text-text-muted">Presentation</dt>
                  <dd className="mt-1 text-input font-medium text-white">
                    {row.presentation}
                  </dd>
                </div>
                <div>
                  <dt className="text-helper text-text-muted">
                    Estimated usage
                  </dt>
                  <dd className="mt-1 text-input font-medium text-white">
                    {row.estimated_usage}
                  </dd>
                </div>
                <div>
                  <dt className="text-helper text-text-muted">Units</dt>
                  <dd className="mt-1 text-input font-medium text-white">
                    {String(row.units)}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Metric label="Unit price" value={row.unit_price} />
                <Metric
                  label="Cost per patient"
                  value={row.cost_per_patient}
                />
                <Metric label="Cohort cost" value={row.cost_cohort} />
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="border-t border-border-default px-6 py-4 text-helper text-text-muted">
        Unit prices are user-provided.
      </p>
    </Card>
  );
}
