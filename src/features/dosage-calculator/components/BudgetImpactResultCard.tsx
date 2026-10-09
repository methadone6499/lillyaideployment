import { Card } from "@/components/ui";
import type { DosageCalculatorBudgetImpact } from "../schemas/dosageCalculatorSchemas";

type BudgetImpactResultCardProps = {
  budgetImpact: DosageCalculatorBudgetImpact;
};

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function displayValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(value);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return null;
}

function objectEntries(value: unknown): [string, string][] {
  if (!isRecord(value)) return [];

  return Object.entries(value).flatMap(([key, item]) => {
    const display = displayValue(item);
    return display === null ? [] : [[key, display] as [string, string]];
  });
}

function BudgetMetrics({
  title,
  value,
}: {
  title: string;
  value: unknown;
}) {
  const entries = objectEntries(value);
  if (entries.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-card-title font-medium text-white">{title}</h3>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map(([key, display]) => (
          <div
            key={key}
            className="rounded-card border border-white/8 bg-white/4 p-4"
          >
            <dt className="text-helper text-text-muted">{humanizeKey(key)}</dt>
            <dd className="mt-2 text-card-title font-medium text-white">
              {display}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function BudgetDataTable({
  title,
  value,
}: {
  title: string;
  value: unknown;
}) {
  if (!Array.isArray(value)) return null;
  const rows = value.filter(isRecord);
  if (rows.length === 0) return null;

  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-card-title font-medium text-white">{title}</h3>
      <div className="overflow-x-auto rounded-card border border-white/8">
        <table className="min-w-full border-collapse text-left text-input">
          <thead className="bg-white/6 text-text-muted">
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="px-4 py-3 font-medium">
                  {humanizeKey(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-white/8">
                {columns.map((column) => (
                  <td key={column} className="px-4 py-3 text-white">
                    {displayValue(row[column]) ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function readFiniteNumber(
  row: Record<string, unknown>,
  keys: readonly string[],
): number | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function BudgetComparisonChart({ years }: { years: unknown }) {
  if (!Array.isArray(years)) return null;

  const rows = years.filter(isRecord).flatMap((row, index) => {
    const baseline = readFiniteNumber(row, ["baseline_spend", "baseline"]);
    const scenario = readFiniteNumber(row, ["scenario_spend", "scenario"]);
    if (baseline === null || scenario === null) return [];

    const year = displayValue(row.year) ?? String(index + 1);
    return [
      {
        label: /^year\b/i.test(year) ? year : `Year ${year}`,
        baseline,
        scenario,
      },
    ];
  });
  if (rows.length === 0) return null;

  const maximum = Math.max(
    1,
    ...rows.flatMap((row) => [row.baseline, row.scenario]),
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-card-title font-medium text-white">
          Baseline versus scenario
        </h3>
        <div className="flex items-center gap-4 text-helper text-text-muted">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-text-muted" /> Baseline
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-brand" /> Scenario
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-5 rounded-card border border-white/8 p-4">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[4.5rem_1fr] gap-3">
            <span className="text-helper text-text-muted">{row.label}</span>
            <div className="flex flex-col gap-2">
              <div className="h-3 overflow-hidden rounded-full bg-white/6">
                <div
                  className="h-full rounded-full bg-text-muted"
                  style={{ width: `${(row.baseline / maximum) * 100}%` }}
                  title={`Baseline: ${displayValue(row.baseline)}`}
                />
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/6">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${(row.scenario / maximum) * 100}%` }}
                  title={`Scenario: ${displayValue(row.scenario)}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function BudgetImpactResultCard({
  budgetImpact,
}: BudgetImpactResultCardProps) {
  const narrative =
    typeof budgetImpact.narrative === "string"
      ? budgetImpact.narrative
      : null;
  const warnings = readStringArray(budgetImpact.warnings);

  return (
    <Card className="w-full overflow-hidden rounded-button">
      <div className="border-b border-border-default px-6 py-5">
        <h2 className="text-card-title font-medium text-white">
          Budget impact analysis
        </h2>
        <p className="mt-2 text-helper text-text-muted">
          Baseline comparator versus the new-drug scenario. A negative budget
          impact represents savings.
        </p>
      </div>

      <div className="flex flex-col gap-7 px-6 py-5">
        <BudgetMetrics title="Summary" value={budgetImpact.summary} />
        <BudgetMetrics
          title="Per-patient breakdown"
          value={budgetImpact.breakdown}
        />
        <BudgetDataTable
          title="Per-patient cost breakdown"
          value={budgetImpact.breakdown}
        />
        <BudgetComparisonChart years={budgetImpact.years} />
        <BudgetDataTable
          title="Year 1–3 budget impact analysis"
          value={budgetImpact.years}
        />

        {narrative ? (
          <section className="rounded-card border border-white/8 bg-white/4 p-4">
            <h3 className="text-card-title font-medium text-white">
              Interpretation
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-input leading-6 text-text-body">
              {narrative}
            </p>
          </section>
        ) : null}

        {warnings.length > 0 ? (
          <section className="rounded-card border border-status-running/20 bg-status-running/8 p-4">
            <h3 className="text-label font-medium text-white">
              Budget-impact warnings
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-helper text-text-body">
              {warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Card>
  );
}
