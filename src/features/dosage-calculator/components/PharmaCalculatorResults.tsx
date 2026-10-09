"use client";

import { cn } from "@/lib/cn";
import { useState } from "react";
import type {
  BudgetImpactAnalysis,
  BudgetImpactModel,
  CostAnalysisResult,
  CostComponent,
  PharmaCurrency,
} from "../utils/pharmaCalculator";
import {
  formatPharmaCurrency,
  formatWholeNumber,
} from "../utils/pharmaCalculator";
import styles from "./PharmaCalculator.module.css";

function ResultCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(styles.resultCard, className)}
    >
      {children}
    </section>
  );
}

function CardHeading({ children }: { children: React.ReactNode }) {
  return <h3 className={styles.cardHeading}>{children}</h3>;
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className={styles.metricCard}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={cn(styles.metricValue, "break-words tabular-nums")}>
        {value}
      </p>
      <p className={styles.metricDetail}>{detail}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <p className={cn(styles.sectionLabel, "min-w-0")}>
        {children}
      </p>
      <span className="h-px flex-1 bg-brand/20" />
    </div>
  );
}

function DataTable({
  children,
  minWidth = "min-w-[680px]",
}: {
  children: React.ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-left", minWidth)}>
        {children}
      </table>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-white/[0.025] text-[10px] uppercase tracking-[0.08em] text-text-muted">
      <tr>{children}</tr>
    </thead>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className={cn(styles.tableHeaderCell, "whitespace-nowrap")}>{children}</th>;
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        styles.tableCell,
        "whitespace-nowrap border-t border-border-subtle text-text-body",
        className,
      )}
    >
      {children}
    </td>
  );
}

function StatusValue({ value, currency }: { value: number; currency: PharmaCurrency }) {
  return (
    <span className={value > 0 ? "text-[#fb7185]" : "text-brand"}>
      {value > 0 ? "+" : ""}
      {formatPharmaCurrency(value, currency)}
    </span>
  );
}

function DonutChart({
  components,
  total,
  currency,
}: {
  components: CostComponent[];
  total: number;
  currency: PharmaCurrency;
}) {
  const { slices } = components.reduce(
    (state, component) => {
      const nextCursor =
        state.cursor + (total > 0 ? (component.value / total) * 100 : 0);

      return {
        cursor: nextCursor,
        slices: [
          ...state.slices,
          `${component.color} ${state.cursor}% ${nextCursor}%`,
        ],
      };
    },
    { cursor: 0, slices: [] as string[] },
  );
  const background =
    slices.length > 0
      ? `conic-gradient(${slices.join(", ")})`
      : "conic-gradient(rgba(255,255,255,.08) 0 100%)";

  return (
    <div className="grid flex-1 items-center gap-6 p-5 sm:grid-cols-[200px_minmax(0,340px)] sm:justify-center lg:gap-8">
      <div
        className="relative mx-auto size-48 rounded-full"
        style={{ background }}
        role="img"
        aria-label="Cost component share chart"
      >
        <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full border border-border-default bg-[#111] text-center">
          <span className="text-[10px] uppercase tracking-[0.08em] text-text-muted">
            Gross
          </span>
          <span className="mt-1 text-[17px] font-medium text-text-heading">
            {formatPharmaCurrency(total, currency)}
          </span>
        </div>
      </div>
      <div className="w-full max-w-[340px] justify-self-center space-y-2.5">
        {components.map((component) => (
          <div
            key={component.label}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 text-[11px]"
          >
            <span className="flex min-w-0 items-center gap-2 text-text-body">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: component.color }}
              />
              <span className="truncate">{component.label}</span>
            </span>
            <span className="shrink-0 font-medium text-text-heading">
              {formatPharmaCurrency(component.value, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CostComparisonChart({
  result,
  currency,
}: {
  result: CostAnalysisResult;
  currency: PharmaCurrency;
}) {
  const comparisonRows = result.comparisonTable;
  const findComparisonRow = (...terms: string[]) =>
    comparisonRows.find((row) =>
      terms.every((term) => row.component.toLocaleLowerCase().includes(term)),
    );
  const grossRow =
    findComparisonRow("gross", "total") ?? findComparisonRow("gross");
  const offsetsRow = findComparisonRow("total", "offset");
  const netRow =
    findComparisonRow("net", "total") ?? findComparisonRow("net");
  const rows = [
    {
      label: "Gross cost",
      primary: grossRow?.new_treatment_per_patient ?? result.grossCost,
      comparator:
        grossRow?.comparator_per_patient ??
        result.comparatorNetCost + result.inputs.comparatorOffsets,
    },
    {
      label: "Offsets",
      primary: Math.abs(
        offsetsRow?.new_treatment_per_patient ?? result.totalOffsets,
      ),
      comparator: Math.abs(
        offsetsRow?.comparator_per_patient ?? result.inputs.comparatorOffsets,
      ),
    },
    {
      label: "Net cost",
      primary: netRow?.new_treatment_per_patient ?? result.netCost,
      comparator:
        netRow?.comparator_per_patient ?? result.comparatorNetCost,
    },
  ];
  const values = rows.flatMap((row) => [row.primary, row.comparator]);
  const rawMinimum = Math.min(0, ...values);
  const rawMaximum = Math.max(0, ...values);
  const rawRange = Math.max(rawMaximum - rawMinimum, 1);
  const roughStep = rawRange / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalizedStep = roughStep / magnitude;
  const niceMultiplier =
    normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10;
  const tickStep = niceMultiplier * magnitude;
  const axisMinimum = Math.floor(rawMinimum / tickStep) * tickStep;
  const axisMaximum = Math.max(
    tickStep,
    Math.ceil(rawMaximum / tickStep) * tickStep,
  );
  const tickCount = Math.round((axisMaximum - axisMinimum) / tickStep);
  const ticks = Array.from(
    { length: tickCount + 1 },
    (_, index) => axisMinimum + index * tickStep,
  );

  const chartWidth = 600;
  const chartHeight = 300;
  const plotLeft = 76;
  const plotRight = 76;
  const plotTop = 18;
  const plotBottom = 54;
  const plotWidth = chartWidth - plotLeft - plotRight;
  const plotHeight = chartHeight - plotTop - plotBottom;
  const axisRange = axisMaximum - axisMinimum;
  const yForValue = (value: number) =>
    plotTop + ((axisMaximum - value) / axisRange) * plotHeight;
  const zeroY = yForValue(0);
  const groupWidth = plotWidth / rows.length;
  const barWidth = 48;
  const barGap = 8;

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap gap-3.5 text-[10px] text-text-muted">
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-brand" />
          {result.inputs.drugName}
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-[#fbbf24]" />
          {result.inputs.comparatorName}
        </span>
      </div>
      <div className="overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Grouped bar chart comparing gross cost, offsets, and net cost for ${result.inputs.drugName} and ${result.inputs.comparatorName}`}
        >
          <title>Net annual cost comparison</title>
          <desc>
            Per-patient gross cost, offsets, and net cost with currency values on
            the vertical axis.
          </desc>

          {ticks.map((tick) => {
            const y = yForValue(tick);
            return (
              <g key={tick}>
                <line
                  x1={plotLeft}
                  x2={chartWidth - plotRight}
                  y1={y}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeWidth="1"
                />
                <text
                  x={plotLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--text-muted)"
                  fontSize="10"
                >
                  {formatPharmaCurrency(tick, currency)}
                </text>
              </g>
            );
          })}

          <line
            x1={plotLeft}
            x2={plotLeft}
            y1={plotTop}
            y2={chartHeight - plotBottom}
            stroke="var(--border-default)"
            strokeWidth="1"
          />
          <line
            x1={plotLeft}
            x2={chartWidth - plotRight}
            y1={zeroY}
            y2={zeroY}
            stroke="var(--text-muted)"
            strokeWidth="1"
          />

          {rows.map((row, index) => {
            const groupCenter = plotLeft + groupWidth * (index + 0.5);
            const primaryY = yForValue(row.primary);
            const comparatorY = yForValue(row.comparator);
            const primaryX = groupCenter - barWidth - barGap / 2;
            const comparatorX = groupCenter + barGap / 2;

            return (
              <g key={row.label}>
                <rect
                  x={primaryX}
                  y={Math.min(primaryY, zeroY)}
                  width={barWidth}
                  height={Math.max(1, Math.abs(zeroY - primaryY))}
                  rx="4"
                  fill="var(--brand-emerald)"
                >
                  <title>
                    {result.inputs.drugName}: {formatPharmaCurrency(row.primary, currency)}
                  </title>
                </rect>
                <rect
                  x={comparatorX}
                  y={Math.min(comparatorY, zeroY)}
                  width={barWidth}
                  height={Math.max(1, Math.abs(zeroY - comparatorY))}
                  rx="4"
                  fill="#fbbf24"
                >
                  <title>
                    {result.inputs.comparatorName}:{" "}
                    {formatPharmaCurrency(row.comparator, currency)}
                  </title>
                </rect>
                <text
                  x={groupCenter}
                  y={chartHeight - 26}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                >
                  {row.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function CostAnalysisSummary({
  result,
  currency,
}: {
  result: CostAnalysisResult;
  currency: PharmaCurrency;
}) {
  const { inputs } = result;

  return (
    <section className="space-y-4" aria-label="Cost analysis summary">
      <div className="rounded-card border border-brand-border bg-brand-bg px-3 py-2.5 text-[10px] leading-5 text-text-muted">
        Annual cost profile for <span className="font-medium text-brand">{inputs.drugName}</span>
        {" · "}<span className="font-medium text-text-heading">{formatWholeNumber(inputs.estimatedPatients)}</span> patients
        {" · "}Currency: <span className="font-medium text-text-heading">{currency}</span>
      </div>
      <div className="space-y-2.5">
        <SectionLabel>Per-patient annual cost</SectionLabel>
        <div className={styles.metricGridFive}>
          <MetricCard label="Drug acquisition" value={formatPharmaCurrency(inputs.annualDrugCost, currency)} detail="per patient / year" />
          <MetricCard label="Gross cost" value={formatPharmaCurrency(result.grossCost, currency)} detail="all components, before offsets" />
          <MetricCard label="Total offsets" value={formatPharmaCurrency(result.totalOffsets, currency)} detail="avoidance + savings" />
          <MetricCard label={`Net cost — ${inputs.drugName}`} value={formatPharmaCurrency(result.netCost, currency)} detail="per patient / year" />
          {result.hasComparator ? (
            <MetricCard label={`Vs ${inputs.comparatorName}`} value={`${result.perPatientDifference > 0 ? "+" : ""}${formatPharmaCurrency(result.perPatientDifference, currency)}`} detail={`${result.perPatientDifference > 0 ? "higher" : "lower"} per patient`} />
          ) : null}
        </div>
      </div>

      <div className="space-y-2.5">
        <SectionLabel>Total annual programme cost · {formatWholeNumber(inputs.estimatedPatients)} patients</SectionLabel>
        <div className={styles.metricGridWide}>
          <MetricCard label="Total gross programme cost" value={formatPharmaCurrency(result.totalGrossCost, currency)} detail={`${formatWholeNumber(inputs.estimatedPatients)} pts × ${formatPharmaCurrency(result.grossCost, currency)}`} />
          <MetricCard label="Total net programme cost" value={formatPharmaCurrency(result.totalNetCost, currency)} detail={`${formatWholeNumber(inputs.estimatedPatients)} pts × ${formatPharmaCurrency(result.netCost, currency)}`} />
          <MetricCard label="Total annual offsets" value={formatPharmaCurrency(result.totalOffsets * inputs.estimatedPatients, currency)} detail={`${formatWholeNumber(inputs.estimatedPatients)} pts × ${formatPharmaCurrency(result.totalOffsets, currency)}`} />
          {result.hasComparator ? (
            <MetricCard label={`Programme Δ vs ${inputs.comparatorName}`} value={`${result.totalDifference > 0 ? "+" : ""}${formatPharmaCurrency(result.totalDifference, currency)}`} detail={`${formatWholeNumber(inputs.estimatedPatients)} vs ${formatWholeNumber(inputs.comparatorPatients)} patients`} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function BudgetImpactSummary({
  analysis,
  currency,
}: {
  analysis: BudgetImpactAnalysis;
  currency: PharmaCurrency;
}) {
  const { inputs, base } = analysis;
  const finalYear = base.years.at(-1)!;

  return (
    <section
      className="space-y-2.5"
      aria-label="Budget impact analysis summary"
    >
      <div className="rounded-card border border-brand-border bg-brand-bg px-3 py-2.5 text-[10px] leading-5 text-text-muted">
        <span className="font-medium text-brand">Eligible population (year 1):</span>{" "}
        {formatWholeNumber(base.eligiblePopulationYearOne)} patients
        {" · "}{inputs.currentTreatment.name}: {formatPharmaCurrency(base.currentTreatmentCost, currency)} / patient
        {" · "}Perspective: {inputs.perspective}
        {" · "}Undiscounted
      </div>
      <SectionLabel>
        {inputs.horizon}-year budget impact analysis · {inputs.perspective}
      </SectionLabel>
      <div className={styles.metricGridWide}>
        <MetricCard label="Eligible population — year 1" value={formatWholeNumber(base.eligiblePopulationYearOne)} detail="patients / year" />
        <MetricCard label={`On ${inputs.drugName} — year ${inputs.horizon}`} value={formatWholeNumber(finalYear.newDrugPatients)} detail={`${Math.round(inputs.uptakePercent[inputs.horizon - 1] ?? 0)}% uptake`} />
        <MetricCard label={`Net cost / patient — year ${inputs.horizon}`} value={formatPharmaCurrency(finalYear.newDrugCostPerPatient, currency)} detail="inflation-adjusted" />
        <MetricCard label={`${inputs.horizon}-year budget impact analysis`} value={`${base.cumulativeImpact > 0 ? "+" : "−"}${formatPharmaCurrency(Math.abs(base.cumulativeImpact), currency)}`} detail={base.cumulativeImpact > 0 ? "additional spend" : "versus baseline savings"} />
      </div>
    </section>
  );
}

export function CalculatorEmptyState({
  kind,
}: {
  kind: "cost" | "budget";
}) {
  const isCost = kind === "cost";

  return (
    <section className="flex min-h-[360px] items-center justify-center rounded-panel border border-border-default bg-[#111] px-6 py-12 text-center">
      <div className="max-w-[400px]">
        <span className="mx-auto flex size-12 items-center justify-center rounded-card bg-brand-bg text-brand">
          {isCost ? (
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M5 19V9m7 10V5m7 14v-7" />
              <path d="M3 19h18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 19V5m0 14h16" />
              <path d="m7 15 4-4 3 2 5-6" />
            </svg>
          )}
        </span>
        <h2 className="mt-5 text-[18px] font-medium text-text-heading">
          {isCost
            ? "Build the annual cost model"
            : "Build the budget impact analysis model"}
        </h2>
        <p className="mt-2 text-[13px] leading-6 text-text-muted">
          {isCost
            ? "Enter the assumptions on the left and calculate costs to see the annual cost breakdown."
            : "Configure the assumptions on the left and run the analysis to generate the multi-year budget impact analysis model."}
        </p>
      </div>
    </section>
  );
}

export function CostAnalysisDetails({
  result,
  currency,
}: {
  result: CostAnalysisResult;
  currency: PharmaCurrency;
}) {
  const { inputs } = result;

  return (
    <section className="space-y-3.5" aria-label="Cost analysis details">
      <ResultCard>
        <CardHeading>
          Annual programme cost summary — {inputs.drugName} ({formatWholeNumber(inputs.estimatedPatients)} patients)
        </CardHeading>
        <DataTable>
          <TableHead>
            <Th>Component</Th>
            <Th>Cost / patient</Th>
            <Th>Programme cost</Th>
            <Th>% of total net</Th>
          </TableHead>
          <tbody>
            {result.componentTable.map((row) => {
              const isNetTotal = row.component.toLowerCase().includes("net");
              const isOffset = row.per_patient < 0;
              return (
                <tr key={row.component} className={isNetTotal ? "bg-brand-bg" : undefined}>
                  <Td className={isNetTotal ? "font-medium text-text-heading" : undefined}>
                    {row.component}
                  </Td>
                  <Td className={isOffset || isNetTotal ? "font-medium text-brand" : undefined}>
                    {formatPharmaCurrency(row.per_patient, currency)}
                  </Td>
                  <Td className={isOffset || isNetTotal ? "font-medium text-brand" : "font-medium text-text-heading"}>
                    {formatPharmaCurrency(row.programme, currency)}
                  </Td>
                  <Td>{row.percentage_of_net_programme.toFixed(1)}%</Td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </ResultCard>

      {result.hasComparator ? (
        <ResultCard>
          <CardHeading>
            Programme comparison: {inputs.drugName} vs {inputs.comparatorName}
          </CardHeading>
          <DataTable>
            <TableHead>
              <Th>Measure</Th>
              <Th>{inputs.drugName}</Th>
              <Th>{inputs.comparatorName}</Th>
              <Th>Difference</Th>
            </TableHead>
            <tbody>
              <tr>
                <Td>Patients</Td>
                <Td>{formatWholeNumber(inputs.estimatedPatients)}</Td>
                <Td>{formatWholeNumber(inputs.comparatorPatients)}</Td>
                <Td>—</Td>
              </tr>
              <tr>
                <Td>Net cost / patient</Td>
                <Td>{formatPharmaCurrency(result.netCost, currency)}</Td>
                <Td>{formatPharmaCurrency(result.comparatorNetCost, currency)}</Td>
                <Td><StatusValue value={result.perPatientDifference} currency={currency} /></Td>
              </tr>
              <tr className="bg-white/[0.02]">
                <Td className="font-medium text-text-heading">Total net programme cost</Td>
                <Td className="font-medium text-brand">
                  {formatPharmaCurrency(result.totalNetCost, currency)}
                </Td>
                <Td>{formatPharmaCurrency(result.totalComparatorCost, currency)}</Td>
                <Td className="font-medium"><StatusValue value={result.totalDifference} currency={currency} /></Td>
              </tr>
            </tbody>
          </DataTable>
        </ResultCard>
      ) : null}

      <SectionLabel>Cost breakdown charts</SectionLabel>
      <div className="grid gap-3.5 xl:grid-cols-2">
        <ResultCard className="flex h-full flex-col">
          <CardHeading>Cost component breakdown — {inputs.drugName}</CardHeading>
          <DonutChart components={result.components} total={result.grossCost} currency={currency} />
        </ResultCard>
        {result.hasComparator ? (
          <ResultCard>
            <CardHeading>Net cost comparison</CardHeading>
            <CostComparisonChart result={result} currency={currency} />
          </ResultCard>
        ) : null}
      </div>

      <ResultCard>
        <CardHeading>Detailed per-patient cost breakdown — {inputs.drugName}</CardHeading>
        <DataTable>
          <TableHead>
            <Th>Component</Th>
            <Th>Annual cost / patient</Th>
            <Th>% of gross</Th>
            <Th>Category</Th>
          </TableHead>
          <tbody>
            {result.components.map((component) => (
              <tr key={component.label}>
                <Td>{component.label}</Td>
                <Td className="font-medium text-text-heading">
                  {formatPharmaCurrency(component.value, currency)}
                </Td>
                <Td>
                  {result.grossCost > 0
                    ? ((component.value / result.grossCost) * 100).toFixed(1)
                    : "0.0"}
                  %
                </Td>
                <Td>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.08em] text-text-body">
                    Cost
                  </span>
                </Td>
              </tr>
            ))}
            {result.offsetComponents.map((component) => (
              <tr key={component.label}>
                <Td>{component.label}</Td>
                <Td className="text-brand">− {formatPharmaCurrency(component.value, currency)}</Td>
                <Td>
                  {result.grossCost > 0
                    ? ((component.value / result.grossCost) * 100).toFixed(1)
                    : "0.0"}
                  %
                </Td>
                <Td>
                  <span className="rounded-full border border-brand-border bg-brand-bg px-2 py-0.5 text-[9px] uppercase tracking-[0.08em] text-brand">
                    Offset
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </ResultCard>

      {result.hasComparator ? (
        <ResultCard>
          <CardHeading>Side-by-side per-patient comparison</CardHeading>
          <DataTable>
            <TableHead>
              <Th>Cost element</Th>
              <Th>{inputs.drugName}</Th>
              <Th>{inputs.comparatorName}</Th>
              <Th>Difference</Th>
            </TableHead>
            <tbody>
              {result.comparisonTable.map((row) => {
                const isNetTotal = row.component.toLowerCase().includes("net");
                return (
                  <tr key={row.component} className={isNetTotal ? "bg-brand-bg" : undefined}>
                    <Td className={isNetTotal ? "font-medium text-text-heading" : undefined}>{row.component}</Td>
                    <Td className={isNetTotal ? "font-medium text-brand" : undefined}>{formatPharmaCurrency(row.new_treatment_per_patient, currency)}</Td>
                    <Td>{formatPharmaCurrency(row.comparator_per_patient, currency)}</Td>
                    <Td className={isNetTotal ? "font-medium" : undefined}><StatusValue value={row.per_patient_difference} currency={currency} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        </ResultCard>
      ) : null}
    </section>
  );
}

function createCurrencyChartScale(
  values: number[],
  plotTop: number,
  plotHeight: number,
) {
  const rawMinimum = Math.min(0, ...values);
  const rawMaximum = Math.max(0, ...values);
  const rawRange = Math.max(rawMaximum - rawMinimum, 1);
  const roughStep = rawRange / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalizedStep = roughStep / magnitude;
  let niceMultiplier = 10;

  if (normalizedStep <= 1) niceMultiplier = 1;
  else if (normalizedStep <= 2) niceMultiplier = 2;
  else if (normalizedStep <= 5) niceMultiplier = 5;

  const tickStep = niceMultiplier * magnitude;
  let minimum = Math.floor(rawMinimum / tickStep) * tickStep;
  let maximum = Math.ceil(rawMaximum / tickStep) * tickStep;

  if (minimum === maximum) {
    if (minimum === 0) maximum = tickStep;
    else minimum -= tickStep;
  }

  const range = maximum - minimum;
  const tickCount = Math.round(range / tickStep);
  const ticks = Array.from(
    { length: tickCount + 1 },
    (_, index) => minimum + index * tickStep,
  );
  const yForValue = (value: number) =>
    plotTop + ((maximum - value) / range) * plotHeight;

  return { ticks, yForValue, zeroY: yForValue(0) };
}

function CurrencyAxisGrid({
  ticks,
  yForValue,
  zeroY,
  plotLeft,
  plotRight,
  plotTop,
  plotBottom,
  currency,
}: {
  ticks: number[];
  yForValue: (value: number) => number;
  zeroY: number;
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
  currency: PharmaCurrency;
}) {
  return (
    <g aria-hidden="true">
      {ticks.map((tick) => {
        const y = yForValue(tick);
        return (
          <g key={tick}>
            <line
              x1={plotLeft}
              x2={plotRight}
              y1={y}
              y2={y}
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />
            <text
              x={plotLeft - 10}
              y={y + 4}
              textAnchor="end"
              fill="var(--text-muted)"
              fontSize="12"
            >
              {formatPharmaCurrency(tick, currency)}
            </text>
          </g>
        );
      })}
      <line
        x1={plotLeft}
        x2={plotLeft}
        y1={plotTop}
        y2={plotBottom}
        stroke="var(--border-default)"
        strokeWidth="1"
      />
      <line
        x1={plotLeft}
        x2={plotRight}
        y1={zeroY}
        y2={zeroY}
        stroke="var(--text-muted)"
        strokeWidth="1"
      />
    </g>
  );
}

function BudgetBars({
  analysis,
  currency,
}: {
  analysis: BudgetImpactAnalysis;
  currency: PharmaCurrency;
}) {
  const width = analysis.base.years.length === 3 ? 500 : 640;
  const height = 330;
  const plotLeft = 82;
  const plotRight = width - 16;
  const plotTop = 14;
  const plotBottom = height - 58;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const scale = createCurrencyChartScale(
    analysis.base.years.flatMap((year) => [year.baselineSpend, year.totalSpend]),
    plotTop,
    plotHeight,
  );
  const groupWidth = plotWidth / analysis.base.years.length;
  const barWidth = Math.min(48, groupWidth * 0.32);
  const barGap = Math.min(8, groupWidth * 0.06);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap gap-3.5 text-[11px] text-text-muted">
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-[#64748b]" />
          Baseline
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-brand" />
          With {analysis.inputs.drugName}
        </span>
      </div>
      <div className="overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Grouped bar chart comparing baseline spend with spend including ${analysis.inputs.drugName} by year`}
        >
          <title>Budget scenario versus baseline</title>
          <desc>Annual per-year spending shown on a currency-scaled vertical axis.</desc>
          <CurrencyAxisGrid
            {...scale}
            plotLeft={plotLeft}
            plotRight={plotRight}
            plotTop={plotTop}
            plotBottom={plotBottom}
            currency={currency}
          />
          {analysis.base.years.map((year, index) => {
            const groupCenter = plotLeft + groupWidth * (index + 0.5);
            const baselineY = scale.yForValue(year.baselineSpend);
            const scenarioY = scale.yForValue(year.totalSpend);
            const baselineX = groupCenter - barWidth - barGap / 2;
            const scenarioX = groupCenter + barGap / 2;

            return (
              <g key={year.year}>
                <rect
                  x={baselineX}
                  y={Math.min(baselineY, scale.zeroY)}
                  width={barWidth}
                  height={Math.max(1, Math.abs(scale.zeroY - baselineY))}
                  rx="4"
                  fill="#64748b"
                  fillOpacity="0.72"
                >
                  <title>
                    Baseline, Year {year.year}:{" "}
                    {formatPharmaCurrency(year.baselineSpend, currency)}
                  </title>
                </rect>
                <rect
                  x={scenarioX}
                  y={Math.min(scenarioY, scale.zeroY)}
                  width={barWidth}
                  height={Math.max(1, Math.abs(scale.zeroY - scenarioY))}
                  rx="4"
                  fill="var(--brand-emerald)"
                  fillOpacity="0.86"
                >
                  <title>
                    With {analysis.inputs.drugName}, Year {year.year}:{" "}
                    {formatPharmaCurrency(year.totalSpend, currency)}
                  </title>
                </rect>
                <text
                  x={groupCenter}
                  y={height - 24}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="12"
                >
                  Year {year.year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function IncrementalBars({
  model,
  currency,
}: {
  model: BudgetImpactModel;
  currency: PharmaCurrency;
}) {
  const width = model.years.length === 3 ? 500 : 640;
  const height = 330;
  const plotLeft = 82;
  const plotRight = width - 16;
  const plotTop = 14;
  const plotBottom = height - 58;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const scale = createCurrencyChartScale(
    model.years.map((year) => year.incrementalImpact),
    plotTop,
    plotHeight,
  );
  const groupWidth = plotWidth / model.years.length;
  const barWidth = Math.min(72, groupWidth * 0.56);

  return (
    <div className="p-4">
      <div className="overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full"
          role="img"
          aria-label="Bar chart showing incremental budget impact analysis by year"
        >
          <title>Incremental budget impact analysis per year</title>
          <desc>Annual incremental impact shown on a currency-scaled vertical axis.</desc>
          <CurrencyAxisGrid
            {...scale}
            plotLeft={plotLeft}
            plotRight={plotRight}
            plotTop={plotTop}
            plotBottom={plotBottom}
            currency={currency}
          />
          {model.years.map((year, index) => {
            const groupCenter = plotLeft + groupWidth * (index + 0.5);
            const valueY = scale.yForValue(year.incrementalImpact);

            return (
              <g key={year.year}>
                <rect
                  x={groupCenter - barWidth / 2}
                  y={Math.min(valueY, scale.zeroY)}
                  width={barWidth}
                  height={Math.max(1, Math.abs(scale.zeroY - valueY))}
                  rx="4"
                  fill="var(--brand-emerald)"
                  fillOpacity="0.88"
                >
                  <title>
                    Year {year.year}: {formatPharmaCurrency(year.incrementalImpact, currency)}
                  </title>
                </rect>
                <text
                  x={groupCenter}
                  y={height - 24}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="12"
                >
                  Year {year.year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function ScenarioChart({
  analysis,
  currency,
}: {
  analysis: BudgetImpactAnalysis;
  currency: PharmaCurrency;
}) {
  const series = [
    { label: "Conservative", color: "#fbbf24", model: analysis.conservative },
    { label: "Base case", color: "#60a5fa", model: analysis.base },
    { label: "Optimistic", color: "#10b981", model: analysis.optimistic },
  ];
  const values = series.flatMap((entry) => entry.model.years.map((year) => year.incrementalImpact));
  const width = 960;
  const height = 330;
  const plotLeft = 92;
  const plotRight = width - 20;
  const plotTop = 14;
  const plotBottom = height - 58;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const scale = createCurrencyChartScale(values, plotTop, plotHeight);
  const pointPadding = analysis.base.years.length > 1 ? 14 : plotWidth / 2;
  const pointWidth = plotWidth - pointPadding * 2;
  const pointFor = (value: number, index: number, count: number) => {
    const x =
      count === 1
        ? plotLeft + plotWidth / 2
        : plotLeft + pointPadding + (index / (count - 1)) * pointWidth;
    return { x, y: scale.yForValue(value) };
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap gap-3.5 text-[11px] text-text-muted">
        {series.map((entry) => (
          <span key={entry.label} className="flex items-center gap-2">
            <span className="h-0.5 w-4" style={{ backgroundColor: entry.color }} />
            {entry.label}
          </span>
        ))}
      </div>
      <div className="overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full"
          role="img"
          aria-label="Line chart comparing annual incremental impact across conservative, base, and optimistic scenarios"
        >
          <title>Incremental impact by scenario</title>
          <desc>Scenario values by year on a currency-scaled vertical axis.</desc>
          <CurrencyAxisGrid
            {...scale}
            plotLeft={plotLeft}
            plotRight={plotRight}
            plotTop={plotTop}
            plotBottom={plotBottom}
            currency={currency}
          />
          {analysis.base.years.map((year, index) => {
            const { x } = pointFor(
              year.incrementalImpact,
              index,
              analysis.base.years.length,
            );
            return (
              <g key={year.year}>
                <line
                  x1={x}
                  x2={x}
                  y1={plotTop}
                  y2={plotBottom}
                  stroke="var(--border-subtle)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - 24}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="12"
                >
                  Year {year.year}
                </text>
              </g>
            );
          })}
          {series.map((entry) => {
            const points = entry.model.years
              .map((year, index) => {
                const point = pointFor(
                  year.incrementalImpact,
                  index,
                  entry.model.years.length,
                );
                return `${point.x},${point.y}`;
              })
              .join(" ");
            return (
              <g key={entry.label}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={entry.color}
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {entry.model.years.map((year, index) => {
                  const point = pointFor(
                    year.incrementalImpact,
                    index,
                    entry.model.years.length,
                  );
                  return (
                    <circle
                      key={year.year}
                      cx={point.x}
                      cy={point.y}
                      r="4.5"
                      fill="#111"
                      stroke={entry.color}
                      strokeWidth="2.5"
                    >
                      <title>
                        {entry.label}, Year {year.year}:{" "}
                        {formatPharmaCurrency(year.incrementalImpact, currency)}
                      </title>
                    </circle>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

type BudgetTab = "results" | "scenarios" | "sensitivity" | "assumptions";

export function BudgetImpactDetails({
  analysis,
  currency,
}: {
  analysis: BudgetImpactAnalysis;
  currency: PharmaCurrency;
}) {
  const [activeTab, setActiveTab] = useState<BudgetTab>("results");
  const { inputs, base, conservative, optimistic } = analysis;
  const maximumSensitivityRange = Math.max(1, ...analysis.sensitivity.map((item) => item.range));
  const tabs: Array<{ value: BudgetTab; label: string }> = [
    { value: "results", label: "Results" },
    { value: "scenarios", label: "Scenarios" },
    { value: "sensitivity", label: "Sensitivity" },
    { value: "assumptions", label: "Assumptions" },
  ];
  const selectTab = (tab: BudgetTab, moveFocus = false) => {
    setActiveTab(tab);
    if (moveFocus) {
      requestAnimationFrame(() => {
        document.getElementById(`budget-results-${tab}-tab`)?.focus();
      });
    }
  };
  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentTab: BudgetTab,
  ) => {
    const currentIndex = tabs.findIndex((tab) => tab.value === currentTab);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    selectTab(tabs[nextIndex].value, true);
  };

  return (
    <section
      className="space-y-3.5"
      aria-label="Budget impact analysis details"
    >
      <div
        className="overflow-x-auto border-b border-border-default"
        role="tablist"
        aria-label="Budget impact analysis results"
      >
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              id={`budget-results-${tab.value}-tab`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              aria-controls={`budget-results-${tab.value}-panel`}
              tabIndex={activeTab === tab.value ? 0 : -1}
              className={cn(
                "border-b-2 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors",
                activeTab === tab.value
                  ? "border-brand text-brand"
                  : "border-transparent text-text-muted hover:text-text-heading",
              )}
              onKeyDown={(event) => handleTabKeyDown(event, tab.value)}
              onClick={() => selectTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "results" ? (
        <div
          id="budget-results-results-panel"
          className="space-y-3.5"
          role="tabpanel"
          aria-labelledby="budget-results-results-tab"
        >
          <BudgetImpactSummary analysis={analysis} currency={currency} />

          <div className="grid gap-3.5 xl:grid-cols-2">
            <ResultCard>
              <CardHeading>Budget: scenario vs baseline ({currency})</CardHeading>
              <BudgetBars analysis={analysis} currency={currency} />
            </ResultCard>
            <ResultCard>
              <CardHeading>Incremental impact per year</CardHeading>
              <IncrementalBars model={base} currency={currency} />
            </ResultCard>
          </div>

          <ResultCard>
            <CardHeading>
              Year-by-year budget impact analysis (undiscounted)
            </CardHeading>
            <DataTable minWidth="min-w-[980px]">
              <TableHead>
                <Th>Year</Th><Th>Population</Th><Th>Patients on {inputs.drugName}</Th><Th>Total spend</Th><Th>Baseline</Th><Th>Incremental</Th><Th>Per-patient Δ</Th>
              </TableHead>
              <tbody>
                {base.years.map((year) => (
                  <tr key={year.year}>
                    <Td className="font-medium text-text-heading">Yr {year.year}</Td>
                    <Td>{formatWholeNumber(year.population)}</Td>
                    <Td>{formatWholeNumber(year.newDrugPatients)} ({year.population > 0 ? Math.round((year.newDrugPatients / year.population) * 100) : 0}%)</Td>
                    <Td>{formatPharmaCurrency(year.totalSpend, currency)}</Td>
                    <Td>{formatPharmaCurrency(year.baselineSpend, currency)}</Td>
                    <Td className="font-medium"><StatusValue value={year.incrementalImpact} currency={currency} /></Td>
                    <Td>{year.perPatientDifference > 0 ? "+" : ""}{formatPharmaCurrency(year.perPatientDifference, currency)}</Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </ResultCard>

          <ResultCard>
            <CardHeading>Current treatment assumptions</CardHeading>
            <DataTable>
              <TableHead><Th>Treatment</Th><Th>Drug price</Th><Th>Extra care</Th><Th>Savings</Th><Th>Net annual cost</Th></TableHead>
              <tbody>
                <tr>
                  <Td>{inputs.currentTreatment.name}</Td>
                  <Td>{formatPharmaCurrency(inputs.currentTreatment.drugPrice, currency)}</Td>
                  <Td>{formatPharmaCurrency(inputs.currentTreatment.extraCareCost, currency)}</Td>
                  <Td className="text-brand">− {formatPharmaCurrency(inputs.currentTreatment.savings, currency)}</Td>
                  <Td className="font-medium text-text-heading">{formatPharmaCurrency(base.currentTreatmentCost, currency)}</Td>
                </tr>
              </tbody>
            </DataTable>
          </ResultCard>
        </div>
      ) : null}

      {activeTab === "scenarios" ? (
        <div
          id="budget-results-scenarios-panel"
          className="space-y-3.5"
          role="tabpanel"
          aria-labelledby="budget-results-scenarios-tab"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard label={`Conservative (×${inputs.conservativeUptakeFactor} uptake, +${inputs.conservativeCostIncreasePercent}% cost)`} value={`${conservative.cumulativeImpact > 0 ? "↑ " : "↓ "}${formatPharmaCurrency(Math.abs(conservative.cumulativeImpact), currency)}`} detail={`${inputs.horizon}-year cumulative`} />
            <MetricCard label="Base case" value={`${base.cumulativeImpact > 0 ? "↑ " : "↓ "}${formatPharmaCurrency(Math.abs(base.cumulativeImpact), currency)}`} detail={`${inputs.horizon}-year cumulative`} />
            <MetricCard label={`Optimistic (×${inputs.optimisticUptakeFactor} uptake, −${inputs.optimisticCostDecreasePercent}% cost)`} value={`${optimistic.cumulativeImpact > 0 ? "↑ " : "↓ "}${formatPharmaCurrency(Math.abs(optimistic.cumulativeImpact), currency)}`} detail={`${inputs.horizon}-year cumulative`} />
          </div>
          <ResultCard><CardHeading>Incremental impact by scenario</CardHeading><ScenarioChart analysis={analysis} currency={currency} /></ResultCard>
          <ResultCard>
            <CardHeading>Scenario comparison</CardHeading>
            <DataTable>
              <TableHead><Th>Year</Th><Th>Conservative</Th><Th>Base case</Th><Th>Optimistic</Th><Th>Range</Th></TableHead>
              <tbody>
                {base.years.map((year, index) => {
                  const conservativeValue = conservative.years[index].incrementalImpact;
                  const optimisticValue = optimistic.years[index].incrementalImpact;
                  return (
                    <tr key={year.year}>
                      <Td className="font-medium text-text-heading">Yr {year.year}</Td>
                      <Td className="text-[#fbbf24]">{formatPharmaCurrency(conservativeValue, currency)}</Td>
                      <Td>{formatPharmaCurrency(year.incrementalImpact, currency)}</Td>
                      <Td className="text-brand">{formatPharmaCurrency(optimisticValue, currency)}</Td>
                      <Td>{formatPharmaCurrency(Math.abs(conservativeValue - optimisticValue), currency)}</Td>
                    </tr>
                  );
                })}
                <tr className="bg-white/[0.02]">
                  <Td className="font-medium text-text-heading">Total</Td>
                  <Td className="font-medium text-[#fbbf24]">{formatPharmaCurrency(conservative.cumulativeImpact, currency)}</Td>
                  <Td className="font-medium text-text-heading">{formatPharmaCurrency(base.cumulativeImpact, currency)}</Td>
                  <Td className="font-medium text-brand">{formatPharmaCurrency(optimistic.cumulativeImpact, currency)}</Td>
                  <Td className="font-medium text-text-heading">{formatPharmaCurrency(Math.abs(conservative.cumulativeImpact - optimistic.cumulativeImpact), currency)}</Td>
                </tr>
              </tbody>
            </DataTable>
          </ResultCard>
        </div>
      ) : null}

      {activeTab === "sensitivity" ? (
        <div
          id="budget-results-sensitivity-panel"
          className="space-y-3.5"
          role="tabpanel"
          aria-labelledby="budget-results-sensitivity-tab"
        >
          <ResultCard>
            <CardHeading>One-way deterministic sensitivity — tornado chart</CardHeading>
            <div className="p-4">
              <p className="mb-4 max-w-3xl text-[10px] leading-5 text-text-muted">
                Each bar shows the {inputs.horizon}-year cumulative impact
                range from the budget impact analysis when a parameter is
                varied from the base case. Results are sorted by influence.
              </p>
              <div className="space-y-4">
                {analysis.sensitivity.map((item) => {
                  const lowerWidth = Math.max(2, (Math.max(0, base.cumulativeImpact - Math.min(item.low, item.high)) / maximumSensitivityRange) * 50);
                  const upperWidth = Math.max(2, (Math.max(0, Math.max(item.low, item.high) - base.cumulativeImpact) / maximumSensitivityRange) * 50);
                  return (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
                        <span className="text-text-body">{item.label}</span>
                        <span className="text-text-muted">range: {formatPharmaCurrency(item.range, currency)}</span>
                      </div>
                      <div className="relative flex h-4 overflow-hidden rounded-sm bg-white/5">
                        <div className="flex w-1/2 justify-end border-r border-white/30">
                          <div className="h-full bg-brand/55" style={{ width: `${lowerWidth}%` }} />
                        </div>
                        <div className="w-1/2"><div className="h-full bg-[#fb7185]/55" style={{ width: `${upperWidth}%` }} /></div>
                      </div>
                      <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 text-[9px] leading-4 text-text-muted">
                        <span className="min-w-0 break-words">{formatPharmaCurrency(Math.min(item.low, item.high), currency)}</span><span className="text-center">Base {formatPharmaCurrency(base.cumulativeImpact, currency)}</span><span className="min-w-0 break-words text-right">{formatPharmaCurrency(Math.max(item.low, item.high), currency)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ResultCard>
          <ResultCard>
            <CardHeading>Sensitivity results</CardHeading>
            <DataTable>
              <TableHead><Th>Parameter</Th><Th>Low estimate</Th><Th>Base case</Th><Th>High estimate</Th><Th>Impact range</Th></TableHead>
              <tbody>
                {analysis.sensitivity.map((item) => (
                  <tr key={item.label}><Td>{item.label}</Td><Td className="text-brand">{formatPharmaCurrency(item.low, currency)}</Td><Td>{formatPharmaCurrency(base.cumulativeImpact, currency)}</Td><Td className="text-[#fb7185]">{formatPharmaCurrency(item.high, currency)}</Td><Td className="font-medium text-text-heading">{formatPharmaCurrency(item.range, currency)}</Td></tr>
                ))}
              </tbody>
            </DataTable>
          </ResultCard>
        </div>
      ) : null}

      {activeTab === "assumptions" ? (
        <div
          id="budget-results-assumptions-panel"
          className="grid gap-3.5 xl:grid-cols-2"
          role="tabpanel"
          aria-labelledby="budget-results-assumptions-tab"
        >
          <ResultCard>
            <CardHeading>Assumption & transparency log</CardHeading>
            <dl className="divide-y divide-border-subtle px-4">
              {[
                ["Currency", currency],
                ["New drug", inputs.drugName],
                ["Indication", inputs.indication],
                ["Eligible population (Y1)", `${formatWholeNumber(base.eligiblePopulationYearOne)} patients`],
                ["Annual net cost — new drug", `${formatPharmaCurrency(base.newDrugNetCost, currency)} per patient`],
                ["Current treatment", inputs.currentTreatment.name],
                ["Current-treatment cost", `${formatPharmaCurrency(base.currentTreatmentCost, currency)} per patient`],
                ...analysis.assumptions.map((assumption) => [
                  assumption.name,
                  assumption.value,
                ]),
                ["Analysis date", analysis.analysisDate],
              ].map(([label, value], index) => (
                <div key={`${label}-${index}`} className="grid gap-2 py-3 text-[11px] sm:grid-cols-[1fr_1.1fr]">
                  <dt className="text-text-muted">{label}</dt><dd className="text-text-heading sm:text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </ResultCard>
          <div className="space-y-3.5">
            <ResultCard>
              <CardHeading>Analyst notes</CardHeading>
              <p className="min-h-24 whitespace-pre-wrap px-4 py-3 text-[11px] leading-5 text-text-body">
                {inputs.notes || <span className="text-text-muted">No notes entered.</span>}
              </p>
            </ResultCard>
            <ResultCard>
              <CardHeading>Model coverage</CardHeading>
              <ul className="divide-y divide-border-subtle px-4">
                {[
                  "Decision-maker perspective specified",
                  "Eligible population defined (top-down epidemiology)",
                  "Current treatment comparator defined",
                  "Undiscounted costs",
                  "Inflation / cost trend adjustment",
                  "Year-specific new-treatment uptake",
                  "Scenario analysis",
                  "One-way deterministic sensitivity",
                  "Condition-related resource use",
                  "Drug wastage accounted for",
                  "Population growth over time horizon",
                  "Assumption documentation and transparency log",
                ].map((item) => (
                  <li key={item} className="flex items-center justify-between gap-3 py-2.5 text-[10px] text-text-body">
                    <span>{item}</span><span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-bg text-brand">✓</span>
                  </li>
                ))}
              </ul>
            </ResultCard>
          </div>
        </div>
      ) : null}
    </section>
  );
}
