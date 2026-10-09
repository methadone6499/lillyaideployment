"use client";

import { cn } from "@/lib/cn";
import {
  useBudgetImpactMutation,
  useCostAnalysisMutation,
  useDailyMedSuggestionsMutation,
  useDosingCalculationMutation,
} from "../hooks/usePharmaCalculatorMutations";
import { useRef, useState } from "react";
import type {
  ButtonHTMLAttributes,
  FormEvent,
  InputHTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import type { DailyMedSuggestionResponse } from "../schemas/pharmaCalculatorSchemas";
import {
  downloadBudgetImpactPdf,
  downloadCostAnalysisPdf,
} from "../utils/pharmaCalculatorPdf";
import {
  applyDailyMedSuggestion,
  DEFAULT_UPTAKE,
  getPharmaCalculatorErrorMessage,
  PHARMA_CURRENCIES,
  toBudgetImpactAnalysis,
  toBudgetImpactRequest,
  toCostAnalysisRequest,
  toCostAnalysisResult,
  toDailyMedSuggestionRequest,
  toDosingRequest,
  toDosingResult,
  type BudgetImpactAnalysis,
  type BudgetImpactInputs,
  type CostAnalysisInputs,
  type CostAnalysisResult,
  type CurrentTreatmentInputs,
  type DosingInputs,
  type LabelSuggestionInputs,
  type PharmaCurrency,
} from "../utils/pharmaCalculator";
import {
  BudgetImpactDetails,
  CalculatorEmptyState,
  CostAnalysisDetails,
  CostAnalysisSummary,
} from "./PharmaCalculatorResults";
import styles from "./PharmaCalculator.module.css";

type CalculatorPage = "cost" | "budget";

const PATIENT_CATEGORIES = [
  "Adult",
  "Adolescent",
  "Child 6–12",
  "Child 2–5",
  "Infant",
] as const;

const DEFAULT_COST_INPUTS: CostAnalysisInputs = {
  drugName: "Drug A",
  indication: "Oncology",
  dosageForm: "Tablet / capsule",
  drugClass: "Targeted therapy",
  annualDrugCost: 45_000,
  administration: 500,
  monitoring: 800,
  labDiagnostics: 600,
  outpatientVisits: 400,
  adverseEventManagement: 1_200,
  adverseEventRatePercent: 15,
  hospitalizations: 2_000,
  otherDirectCosts: 300,
  hospitalizationAvoidance: 3_500,
  otherOffsets: 200,
  comparatorName: "Drug B (SOC)",
  comparatorAnnualCost: 30_000,
  comparatorExtraCost: 900,
  comparatorOffsets: 1_000,
  estimatedPatients: 100,
  comparatorPatients: 100,
};

const DEFAULT_DOSING_INPUTS: DosingInputs = {
  unitCost: 150,
  unitSize: 100,
  doseAmount: 200,
  dosesPerDay: 1,
  daysPerYear: 365,
  doseType: "fixed",
  patientWeight: 70,
  wastagePercent: 0,
};

const DEFAULT_LABEL_INPUTS: LabelSuggestionInputs = {
  category: "Adult",
  patientWeight: 70,
  frequency: "once daily",
  duration: "12 months",
};

const DEFAULT_BUDGET_INPUTS: BudgetImpactInputs = {
  perspective: "Hospital payer",
  horizon: 3,
  drugName: "Drug A",
  indication: "Oncology",
  annualDrugCost: 45_000,
  administrationAndMonitoring: 1_300,
  adverseEventCost: 180,
  offsets: 3_700,
  wastagePercent: 0,
  currentTreatment: {
    name: "Drug B (SOC)",
    drugPrice: 30_000,
    extraCareCost: 900,
    savings: 1_000,
  },
  hospitalBeds: 500,
  bedOccupancyPercent: 75,
  prevalencePercent: 2.5,
  diagnosisRatePercent: 75,
  eligiblePercent: 60,
  averageLengthOfStay: 4.5,
  populationGrowthPercent: 1.5,
  inflationPercent: 3,
  uptakePercent: [...DEFAULT_UPTAKE],
  conservativeUptakeFactor: 0.6,
  optimisticUptakeFactor: 1.4,
  conservativeCostIncreasePercent: 20,
  optimisticCostDecreasePercent: 15,
  notes: "",
};

const inputClassName =
  "h-10 w-full rounded-field border border-border-default bg-input-fill px-3 text-[13px] font-normal text-text-heading outline-none transition-colors placeholder:text-text-muted focus:border-brand-chip-border focus:ring-2 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-50";

function Field({
  label,
  helper,
  suffix,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helper?: string;
  suffix?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex min-h-8 items-end justify-between gap-2 text-[11px] leading-4 font-medium text-text-body">
        <span>{label}</span>
        {suffix ? <span className="text-[10px] text-text-muted">{suffix}</span> : null}
      </span>
      <input className={cn(inputClassName, className)} {...props} />
      {helper ? (
        <span className="mt-1.5 block text-[10px] leading-4 text-text-muted">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex min-h-8 items-end text-[11px] leading-4 font-medium text-text-body">
        {label}
      </span>
      <span className="relative block">
        <select
          className={cn(inputClassName, "appearance-none pr-9", className)}
          {...props}
        >
          {children}
        </select>
        <svg
          viewBox="0 0 20 20"
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path d="m6 8 4 4 4-4" />
        </svg>
      </span>
    </label>
  );
}

function NumberField({
  value,
  onValueChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
}) {
  return (
    <Field
      {...props}
      type="number"
      value={value}
      onChange={(event) => onValueChange(Number(event.target.value))}
    />
  );
}

function FormSection({
  title,
  helper,
  children,
}: {
  title: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h3 className="shrink-0 text-[11px] font-semibold tracking-[0.02em] text-brand">
            {title}
          </h3>
          <span className="h-px flex-1 bg-brand/20" />
        </div>
        {helper ? (
          <p className="max-w-3xl text-[11px] leading-5 text-text-muted">
            {helper}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className={styles.inputPanel}>{children}</div>;
}

function PanelHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-border-default px-5 py-4">
      <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-text-heading">
        {title}
      </h2>
      <p className="mt-1 max-w-[56ch] text-[11px] leading-5 text-text-muted">
        {description}
      </p>
    </div>
  );
}

function ActionButton({
  children,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-button border border-brand/70 bg-brand px-4 text-[12px] font-semibold text-white transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function DownloadResultsButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-button border border-brand-border bg-brand-bg px-4 text-[12px] font-semibold text-brand transition-colors hover:bg-brand/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15.5h12" />
      </svg>
      {children}
    </button>
  );
}

function InlineAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-field border border-status-running/30 bg-status-running/10 px-3 py-2.5 text-[11px] leading-5 text-status-running"
    >
      {children}
    </p>
  );
}

type CostInputPanelProps = {
  inputs: CostAnalysisInputs;
  dosingInputs: DosingInputs;
  labelInputs: LabelSuggestionInputs;
  currency: PharmaCurrency;
  dosingResult: ReturnType<typeof toDosingResult> | null;
  dosingError: string | null;
  labelError: string | null;
  labelResult: DailyMedSuggestionResponse | undefined;
  isCalculatingDosing: boolean;
  isLoadingLabel: boolean;
  isCalculatingCost: boolean;
  costError: string | null;
  onInputsChange: <K extends keyof CostAnalysisInputs>(
    field: K,
    value: CostAnalysisInputs[K],
  ) => void;
  onDosingInputsChange: <K extends keyof DosingInputs>(
    field: K,
    value: DosingInputs[K],
  ) => void;
  onLabelInputsChange: <K extends keyof LabelSuggestionInputs>(
    field: K,
    value: LabelSuggestionInputs[K],
  ) => void;
  onRunDosing: () => void;
  onFindLabel: () => void;
  onApplyLabel: () => void;
  onCalculate: (event: FormEvent<HTMLFormElement>) => void;
};

function CostInputPanel({
  inputs,
  dosingInputs,
  labelInputs,
  currency,
  dosingResult,
  dosingError,
  labelError,
  labelResult,
  isCalculatingDosing,
  isLoadingLabel,
  isCalculatingCost,
  costError,
  onInputsChange,
  onDosingInputsChange,
  onLabelInputsChange,
  onRunDosing,
  onFindLabel,
  onApplyLabel,
  onCalculate,
}: CostInputPanelProps) {
  const symbol = PHARMA_CURRENCIES[currency];
  const missingSuggestionFields = labelResult?.suggestions
    ? [
        labelResult.suggestions.times_per_day == null
          ? "times per day"
          : null,
        labelResult.suggestions.days_per_year == null
          ? "days per year"
          : null,
        labelResult.suggestions.unit_size == null ? "unit size" : null,
      ].filter((field): field is string => field !== null)
    : [];

  return (
    <Panel>
      <PanelHeader
        title="Cost assumptions"
        description="Calculate acquisition, per-patient, and programme costs using the validated calculator API."
      />
      <form onSubmit={onCalculate} className="space-y-7 p-5">
        <FormSection title="Drug details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Drug name"
              required
              value={inputs.drugName}
              onChange={(event) => onInputsChange("drugName", event.target.value)}
            />
            <Field
              label="Indication"
              required
              value={inputs.indication}
              onChange={(event) => onInputsChange("indication", event.target.value)}
            />
            <SelectField
              label="Dosage form"
              value={inputs.dosageForm}
              onChange={(event) => onInputsChange("dosageForm", event.target.value)}
            >
              <option>Tablet / capsule</option>
              <option>Vial (mg)</option>
              <option>Prefilled syringe</option>
              <option>Patch</option>
            </SelectField>
            <Field
              label="Drug class"
              required
              value={inputs.drugClass}
              onChange={(event) => onInputsChange("drugClass", event.target.value)}
            />
          </div>
        </FormSection>

        <details className="group border-y border-border-default py-4">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-3 outline-none focus-visible:ring-2 focus-visible:ring-brand/30 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block text-[13px] font-semibold text-text-heading">
                Dosing and DailyMed assistance
              </span>
              <span className="mt-1 block text-[11px] leading-5 text-text-muted">
                Use label guidance, then calculate annual acquisition cost.
              </span>
            </span>
            <svg
              viewBox="0 0 20 20"
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-brand transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path d="m6 8 4 4 4-4" />
            </svg>
          </summary>

          <div className="mt-5 space-y-6">
            <FormSection
              title="Optional label suggestions"
              helper="DailyMed suggestions never overwrite your values until you apply them."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  label="Patient category"
                  value={labelInputs.category}
                  onChange={(event) =>
                    onLabelInputsChange("category", event.target.value)
                  }
                >
                  {PATIENT_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </SelectField>
                <NumberField
                  label="Patient weight (kg)"
                  min="0.01"
                  step="any"
                  value={labelInputs.patientWeight}
                  onValueChange={(value) =>
                    onLabelInputsChange("patientWeight", value)
                  }
                />
                <Field
                  label="Planned frequency"
                  required
                  value={labelInputs.frequency}
                  onChange={(event) =>
                    onLabelInputsChange("frequency", event.target.value)
                  }
                />
                <Field
                  label="Planned duration"
                  required
                  value={labelInputs.duration}
                  onChange={(event) =>
                    onLabelInputsChange("duration", event.target.value)
                  }
                />
              </div>
              <ActionButton
                onClick={onFindLabel}
                disabled={isLoadingLabel}
                className="w-full border-border-default bg-surface-default text-text-heading hover:bg-surface-elevated sm:w-auto"
              >
                {isLoadingLabel ? "Checking DailyMed…" : "Get label suggestions"}
              </ActionButton>
              {labelError ? <InlineAlert>{labelError}</InlineAlert> : null}
              {labelResult ? (
                <div className="space-y-3 rounded-card border border-brand-border bg-brand-bg p-4">
                  <div>
                    <p className="text-[12px] font-semibold text-text-heading">
                      {labelResult.indication_match === "none"
                        ? "No matching labelled indication"
                        : "Label guidance found"}
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-text-body">
                      {labelResult.indication_match_note}
                    </p>
                  </div>
                  {labelResult.suggestions ? (
                    <>
                      <dl className="grid gap-2 text-[11px] sm:grid-cols-2">
                        <div>
                          <dt className="text-text-muted">Dose</dt>
                          <dd className="mt-0.5 text-text-heading">
                            {labelResult.suggestions.dose} mg ·{" "}
                            {labelResult.suggestions.dose_type === "fixed"
                              ? "Fixed dose"
                              : "Weight-based"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-text-muted">Route</dt>
                          <dd className="mt-0.5 capitalize text-text-heading">
                            {labelResult.suggestions.route}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-text-muted">Schedule</dt>
                          <dd className="mt-0.5 text-text-heading">
                            {labelResult.suggestions.treatment_schedule}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-text-muted">Presentation</dt>
                          <dd className="mt-0.5 text-text-heading">
                            {labelResult.suggestions.presentation}
                          </dd>
                        </div>
                      </dl>
                      {missingSuggestionFields.length > 0 ? (
                        <p className="rounded-field border border-status-running/30 bg-status-running/10 px-3 py-2.5 text-[11px] leading-5 text-status-running">
                          The dose and dose type can be applied. DailyMed could
                          not convert this regimen into{" "}
                          {missingSuggestionFields.join(", ")}, so those fields
                          will remain unchanged. Review them before calculating
                          dosing.
                        </p>
                      ) : null}
                      <ActionButton onClick={onApplyLabel} className="w-full sm:w-auto">
                        {missingSuggestionFields.length > 0
                          ? "Apply available values"
                          : "Apply suggestion to dosing"}
                      </ActionButton>
                    </>
                  ) : null}
                  <a
                    href={labelResult.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-[11px] font-medium text-brand underline decoration-brand/40 underline-offset-4 hover:decoration-brand"
                  >
                    View {labelResult.source.title} on DailyMed
                  </a>
                  {labelResult.warnings.length ? (
                    <ul className="space-y-1 text-[10px] leading-4 text-status-running">
                      {labelResult.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </FormSection>

            <FormSection title="Dosing calculation">
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label={`Unit cost (${symbol})`}
                  min="0"
                  step="any"
                  value={dosingInputs.unitCost}
                  onValueChange={(value) => onDosingInputsChange("unitCost", value)}
                />
                <NumberField
                  label="Unit size (mg)"
                  min="0.01"
                  step="any"
                  value={dosingInputs.unitSize}
                  onValueChange={(value) => onDosingInputsChange("unitSize", value)}
                />
              </div>
              <div className={styles.doseScheduleGrid}>
                <NumberField
                  label="Dose (mg)"
                  min="0.01"
                  step="any"
                  value={dosingInputs.doseAmount}
                  onValueChange={(value) => onDosingInputsChange("doseAmount", value)}
                />
                <NumberField
                  label="Times / day"
                  min="0.01"
                  step="any"
                  value={dosingInputs.dosesPerDay}
                  onValueChange={(value) => onDosingInputsChange("dosesPerDay", value)}
                />
                <NumberField
                  label="Days / year"
                  min="1"
                  max="366"
                  step="any"
                  value={dosingInputs.daysPerYear}
                  onValueChange={(value) => onDosingInputsChange("daysPerYear", value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Dose type"
                  value={dosingInputs.doseType}
                  onChange={(event) =>
                    onDosingInputsChange(
                      "doseType",
                      event.target.value as DosingInputs["doseType"],
                    )
                  }
                >
                  <option value="fixed">Fixed (mg)</option>
                  <option value="weight_based">Weight-based (mg/kg)</option>
                </SelectField>
                <NumberField
                  label="Patient weight (kg)"
                  min="0.01"
                  step="any"
                  disabled={dosingInputs.doseType === "fixed"}
                  value={dosingInputs.patientWeight}
                  onValueChange={(value) =>
                    onDosingInputsChange("patientWeight", value)
                  }
                />
              </div>
              <NumberField
                label="Wastage (%)"
                min="0"
                max="100"
                step="any"
                value={dosingInputs.wastagePercent}
                onValueChange={(value) =>
                  onDosingInputsChange("wastagePercent", value)
                }
              />
              <ActionButton
                onClick={onRunDosing}
                disabled={isCalculatingDosing}
                className="w-full"
              >
                {isCalculatingDosing ? "Calculating dosing…" : "Calculate dosing"}
              </ActionButton>
              {dosingError ? <InlineAlert>{dosingError}</InlineAlert> : null}
              {dosingResult ? (
                <div className="rounded-card border border-brand-border bg-brand-bg px-4 py-3">
                  <dl className="space-y-2 text-[11px] tabular-nums">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-text-muted">Dose / administration</dt>
                      <dd className="font-medium text-text-heading">
                        {dosingResult.dosePerAdministration.toFixed(4)} mg
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-text-muted">Actual dose / day</dt>
                      <dd className="font-medium text-text-heading">
                        {dosingResult.actualDosePerDay.toFixed(4)} mg
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-text-muted">Units / administration</dt>
                      <dd className="font-medium text-text-heading">
                        {dosingResult.unitsPerAdministration.toFixed(4)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-text-muted">Annual units</dt>
                      <dd className="font-medium text-text-heading">
                        {dosingResult.annualUnits.toFixed(4)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-brand/15 pt-2">
                      <dt className="text-text-muted">Annual drug cost</dt>
                      <dd className="text-[14px] font-semibold text-brand">
                        {symbol}{dosingResult.annualDrugCost.toFixed(2)}
                      </dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    className="mt-3 h-10 w-full rounded-field border border-brand-chip-border bg-brand-badge px-3 text-[11px] font-semibold text-brand transition-colors hover:bg-brand/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    onClick={() =>
                      onInputsChange("annualDrugCost", dosingResult.annualDrugCost)
                    }
                  >
                    Apply annual drug cost
                  </button>
                </div>
              ) : null}
            </FormSection>
          </div>
        </details>

        <FormSection title="Annual cost components">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label={`Annual drug cost / patient (${symbol})`} min="0" step="any" value={inputs.annualDrugCost} onValueChange={(value) => onInputsChange("annualDrugCost", value)} />
            <NumberField label={`Administration (${symbol})`} min="0" value={inputs.administration} onValueChange={(value) => onInputsChange("administration", value)} />
            <NumberField label={`Monitoring (${symbol})`} min="0" value={inputs.monitoring} onValueChange={(value) => onInputsChange("monitoring", value)} />
            <NumberField label={`Lab / diagnostics (${symbol})`} min="0" value={inputs.labDiagnostics} onValueChange={(value) => onInputsChange("labDiagnostics", value)} />
            <NumberField label={`Outpatient visits (${symbol})`} min="0" value={inputs.outpatientVisits} onValueChange={(value) => onInputsChange("outpatientVisits", value)} />
            <NumberField label={`AE management (${symbol})`} min="0" value={inputs.adverseEventManagement} onValueChange={(value) => onInputsChange("adverseEventManagement", value)} />
            <NumberField label="AE rate (%)" min="0" max="100" value={inputs.adverseEventRatePercent} onValueChange={(value) => onInputsChange("adverseEventRatePercent", value)} />
            <NumberField label={`Hospitalizations (${symbol})`} min="0" value={inputs.hospitalizations} onValueChange={(value) => onInputsChange("hospitalizations", value)} />
            <NumberField label={`Other direct costs (${symbol})`} min="0" value={inputs.otherDirectCosts} onValueChange={(value) => onInputsChange("otherDirectCosts", value)} />
          </div>
        </FormSection>

        <FormSection title="Offsets and savings" helper="Subtract avoided resource use from the annual gross cost.">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label={`Hospitalization avoidance (${symbol})`} min="0" value={inputs.hospitalizationAvoidance} onValueChange={(value) => onInputsChange("hospitalizationAvoidance", value)} />
            <NumberField label={`Other offsets (${symbol})`} min="0" value={inputs.otherOffsets} onValueChange={(value) => onInputsChange("otherOffsets", value)} />
          </div>
        </FormSection>

        <FormSection title="Comparator (optional)" helper="Leave the comparator name blank to calculate the new treatment only.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Comparator name" value={inputs.comparatorName} onChange={(event) => onInputsChange("comparatorName", event.target.value)} />
            </div>
            <NumberField label={`Annual drug cost / patient (${symbol})`} min="0" value={inputs.comparatorAnnualCost} onValueChange={(value) => onInputsChange("comparatorAnnualCost", value)} />
            <NumberField label={`Admin + monitoring (${symbol})`} min="0" value={inputs.comparatorExtraCost} onValueChange={(value) => onInputsChange("comparatorExtraCost", value)} />
            <NumberField label={`Offsets (${symbol})`} min="0" value={inputs.comparatorOffsets} onValueChange={(value) => onInputsChange("comparatorOffsets", value)} />
          </div>
        </FormSection>

        <FormSection title="Programme population">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="New-treatment patients" min="1" step="1" value={inputs.estimatedPatients} onValueChange={(value) => onInputsChange("estimatedPatients", value)} />
            <NumberField label="Comparator patients" min="0" step="1" value={inputs.comparatorPatients} onValueChange={(value) => onInputsChange("comparatorPatients", value)} />
          </div>
        </FormSection>

        {costError ? <InlineAlert>{costError}</InlineAlert> : null}
        <ActionButton type="submit" disabled={isCalculatingCost} className="w-full">
          {isCalculatingCost ? "Calculating costs…" : "Calculate cost analysis"}
        </ActionButton>
      </form>
    </Panel>
  );
}

type BudgetInputPanelProps = {
  inputs: BudgetImpactInputs;
  currency: PharmaCurrency;
  error: string | null;
  isCalculating: boolean;
  onInputsChange: <K extends keyof BudgetImpactInputs>(
    field: K,
    value: BudgetImpactInputs[K],
  ) => void;
  onCurrentTreatmentChange: <K extends keyof CurrentTreatmentInputs>(
    field: K,
    value: CurrentTreatmentInputs[K],
  ) => void;
  onCalculate: (event: FormEvent<HTMLFormElement>) => void;
};

function BudgetInputPanel({
  inputs,
  currency,
  error,
  isCalculating,
  onInputsChange,
  onCurrentTreatmentChange,
  onCalculate,
}: BudgetInputPanelProps) {
  const symbol = PHARMA_CURRENCIES[currency];

  return (
    <Panel>
      <PanelHeader
        title="Budget impact analysis assumptions"
        description="Model one current treatment against the new treatment over three or five years."
      />
      <form onSubmit={onCalculate} className="space-y-7 p-5">
        <FormSection title="Decision context">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Perspective" value={inputs.perspective} onChange={(event) => onInputsChange("perspective", event.target.value)}>
              <option>Hospital payer</option>
              <option>Payer / health plan</option>
              <option>Government / HTA</option>
              <option>Societal</option>
            </SelectField>
            <SelectField label="Time horizon" value={inputs.horizon} onChange={(event) => onInputsChange("horizon", Number(event.target.value) as 3 | 5)}>
              <option value={3}>3 years</option>
              <option value={5}>5 years</option>
            </SelectField>
            <Field label="Drug name" required value={inputs.drugName} onChange={(event) => onInputsChange("drugName", event.target.value)} />
            <Field label="Indication" required value={inputs.indication} onChange={(event) => onInputsChange("indication", event.target.value)} />
          </div>
        </FormSection>

        <FormSection title="New treatment costs" helper="Annual per-patient inputs before population scaling.">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label={`Annual drug cost / patient (${symbol})`} min="0" value={inputs.annualDrugCost} onValueChange={(value) => onInputsChange("annualDrugCost", value)} />
            <NumberField label={`Administration + monitoring (${symbol})`} min="0" value={inputs.administrationAndMonitoring} onValueChange={(value) => onInputsChange("administrationAndMonitoring", value)} />
            <NumberField label={`Expected AE cost (${symbol})`} min="0" value={inputs.adverseEventCost} onValueChange={(value) => onInputsChange("adverseEventCost", value)} />
            <NumberField label={`Offsets (${symbol})`} min="0" value={inputs.offsets} onValueChange={(value) => onInputsChange("offsets", value)} />
            <NumberField label="Wastage (%)" min="0" max="100" value={inputs.wastagePercent} onValueChange={(value) => onInputsChange("wastagePercent", value)} />
          </div>
        </FormSection>

        <FormSection title="Current treatment" helper="The v4 budget-impact model accepts one current treatment comparator.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Treatment name" required value={inputs.currentTreatment.name} onChange={(event) => onCurrentTreatmentChange("name", event.target.value)} />
            <NumberField label={`Drug price (${symbol})`} min="0" value={inputs.currentTreatment.drugPrice} onValueChange={(value) => onCurrentTreatmentChange("drugPrice", value)} />
            <NumberField label={`Extra care cost (${symbol})`} min="0" value={inputs.currentTreatment.extraCareCost} onValueChange={(value) => onCurrentTreatmentChange("extraCareCost", value)} />
            <NumberField label={`Savings (${symbol})`} min="0" value={inputs.currentTreatment.savings} onValueChange={(value) => onCurrentTreatmentChange("savings", value)} />
          </div>
        </FormSection>

        <FormSection title="Eligible population" helper="Estimate the addressable population from hospital activity and disease prevalence.">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Hospital beds" min="1" step="1" value={inputs.hospitalBeds} onValueChange={(value) => onInputsChange("hospitalBeds", value)} />
            <NumberField label="Bed occupancy (%)" min="0" max="100" value={inputs.bedOccupancyPercent} onValueChange={(value) => onInputsChange("bedOccupancyPercent", value)} />
            <NumberField label="Prevalence (%)" min="0" max="100" step="0.1" value={inputs.prevalencePercent} onValueChange={(value) => onInputsChange("prevalencePercent", value)} />
            <NumberField label="Diagnosis rate (%)" min="0" max="100" value={inputs.diagnosisRatePercent} onValueChange={(value) => onInputsChange("diagnosisRatePercent", value)} />
            <NumberField label="Eligibility (%)" min="0" max="100" value={inputs.eligiblePercent} onValueChange={(value) => onInputsChange("eligiblePercent", value)} />
            <NumberField label="Average LOS (days)" min="0.01" step="any" value={inputs.averageLengthOfStay} onValueChange={(value) => onInputsChange("averageLengthOfStay", value)} />
            <NumberField label="Population growth (% / year)" min="-100" max="100" step="0.1" value={inputs.populationGrowthPercent} onValueChange={(value) => onInputsChange("populationGrowthPercent", value)} />
            <NumberField label="Inflation (% / year)" min="-100" max="100" step="0.1" value={inputs.inflationPercent} onValueChange={(value) => onInputsChange("inflationPercent", value)} />
          </div>
        </FormSection>

        <FormSection title="New-treatment uptake" helper="Set one uptake percentage for every year in the selected horizon.">
          <div className="space-y-4">
            {Array.from({ length: inputs.horizon }, (_, index) => (
              <label key={index} className="block">
                <span className="mb-2 flex items-center justify-between text-[12px] text-text-body">
                  <span>Year {index + 1}</span>
                  <span className="rounded-field border border-brand-border bg-brand-bg px-2.5 py-1 font-semibold tabular-nums text-brand">
                    {inputs.uptakePercent[index]}%
                  </span>
                </span>
                <input
                  aria-label={`Year ${index + 1} uptake`}
                  type="range"
                  min="0"
                  max="100"
                  value={inputs.uptakePercent[index]}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#10b981]"
                  onChange={(event) => {
                    const next = [...inputs.uptakePercent];
                    next[index] = Number(event.target.value);
                    onInputsChange("uptakePercent", next);
                  }}
                />
              </label>
            ))}
          </div>
        </FormSection>

        <FormSection title="Scenario assumptions">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Conservative uptake multiplier" min="0" step="0.05" value={inputs.conservativeUptakeFactor} onValueChange={(value) => onInputsChange("conservativeUptakeFactor", value)} />
            <NumberField label="Optimistic uptake multiplier" min="0" step="0.05" value={inputs.optimisticUptakeFactor} onValueChange={(value) => onInputsChange("optimisticUptakeFactor", value)} />
            <NumberField label="Conservative cost increase (%)" min="0" max="100" step="5" value={inputs.conservativeCostIncreasePercent} onValueChange={(value) => onInputsChange("conservativeCostIncreasePercent", value)} />
            <NumberField label="Optimistic cost decrease (%)" min="0" max="100" step="5" value={inputs.optimisticCostDecreasePercent} onValueChange={(value) => onInputsChange("optimisticCostDecreasePercent", value)} />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-text-body">Notes</span>
            <textarea
              rows={4}
              value={inputs.notes}
              className={cn(inputClassName, "h-auto min-h-24 resize-y py-3 leading-5")}
              placeholder="Document local assumptions or data sources."
              onChange={(event) => onInputsChange("notes", event.target.value)}
            />
          </label>
        </FormSection>

        {error ? <InlineAlert>{error}</InlineAlert> : null}
        <ActionButton type="submit" disabled={isCalculating} className="w-full">
          {isCalculating
            ? "Running budget impact analysis…"
            : "Run budget impact analysis"}
        </ActionButton>
      </form>
    </Panel>
  );
}

function CalculatorToolbar({
  activePage,
  currency,
  onPageChange,
  onCurrencyChange,
}: {
  activePage: CalculatorPage;
  currency: PharmaCurrency;
  onPageChange: (page: CalculatorPage) => void;
  onCurrencyChange: (currency: PharmaCurrency) => void;
}) {
  const costTabRef = useRef<HTMLButtonElement>(null);
  const budgetTabRef = useRef<HTMLButtonElement>(null);

  const handleTabKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    page: CalculatorPage,
  ) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextPage: CalculatorPage = page === "cost" ? "budget" : "cost";
    if (event.key === "Home") nextPage = "cost";
    if (event.key === "End") nextPage = "budget";
    onPageChange(nextPage);
    requestAnimationFrame(() => {
      (nextPage === "cost" ? costTabRef : budgetTabRef).current?.focus();
    });
  };

  return (
    <div className="flex flex-col gap-4 border-b border-border-default pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-text-heading">
          Calculator workspace
        </h2>
        <p className="mt-1 text-[12px] leading-5 text-text-muted">
          Results are calculated by the LillyAI API and validated before display.
        </p>
      </div>
      <label className="flex items-center gap-3 text-[11px] font-medium text-text-body">
        Currency
        <select
          value={currency}
          onChange={(event) => onCurrencyChange(event.target.value as PharmaCurrency)}
          className="h-10 rounded-field border border-border-default bg-input-fill px-3 text-[12px] font-semibold text-text-heading outline-none focus:border-brand-chip-border focus:ring-2 focus:ring-brand/10"
        >
          {Object.keys(PHARMA_CURRENCIES).map((code) => (
            <option key={code}>{code}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-1 rounded-button border border-border-default bg-surface-subtle p-1" role="tablist" aria-label="Calculator mode">
        <button
          ref={costTabRef}
          id="calculator-mode-cost-tab"
          type="button"
          role="tab"
          aria-selected={activePage === "cost"}
          aria-controls="calculator-mode-cost-panel"
          tabIndex={activePage === "cost" ? 0 : -1}
          className={cn(
            "min-h-10 rounded-field px-4 text-[12px] font-semibold transition-colors",
            activePage === "cost"
              ? "bg-brand text-white"
              : "text-text-muted hover:bg-white/5 hover:text-text-heading",
          )}
          onKeyDown={(event) => handleTabKeyDown(event, "cost")}
          onClick={() => onPageChange("cost")}
        >
          Cost analysis
        </button>
        <button
          ref={budgetTabRef}
          id="calculator-mode-budget-tab"
          type="button"
          role="tab"
          aria-selected={activePage === "budget"}
          aria-controls="calculator-mode-budget-panel"
          tabIndex={activePage === "budget" ? 0 : -1}
          className={cn(
            "min-h-10 rounded-field px-4 text-[12px] font-semibold transition-colors",
            activePage === "budget"
              ? "bg-brand text-white"
              : "text-text-muted hover:bg-white/5 hover:text-text-heading",
          )}
          onKeyDown={(event) => handleTabKeyDown(event, "budget")}
          onClick={() => onPageChange("budget")}
        >
          Budget impact analysis
        </button>
      </div>
    </div>
  );
}

export function PharmaCalculatorWorkspace() {
  const [activePage, setActivePage] = useState<CalculatorPage>("cost");
  const [currency, setCurrency] = useState<PharmaCurrency>("USD");
  const [costInputs, setCostInputs] = useState(DEFAULT_COST_INPUTS);
  const [dosingInputs, setDosingInputs] = useState(DEFAULT_DOSING_INPUTS);
  const [labelInputs, setLabelInputs] = useState(DEFAULT_LABEL_INPUTS);
  const [budgetInputs, setBudgetInputs] = useState(DEFAULT_BUDGET_INPUTS);
  const [costResult, setCostResult] = useState<CostAnalysisResult | null>(null);
  const [budgetResult, setBudgetResult] = useState<BudgetImpactAnalysis | null>(null);

  const dosingMutation = useDosingCalculationMutation();
  const labelMutation = useDailyMedSuggestionsMutation();
  const costMutation = useCostAnalysisMutation();
  const budgetMutation = useBudgetImpactMutation();

  const dosingResult = dosingMutation.data
    ? toDosingResult(dosingMutation.data)
    : null;

  const updateCostInputs = <K extends keyof CostAnalysisInputs>(
    field: K,
    value: CostAnalysisInputs[K],
  ) => setCostInputs((current) => ({ ...current, [field]: value }));

  const updateDosingInputs = <K extends keyof DosingInputs>(
    field: K,
    value: DosingInputs[K],
  ) => {
    dosingMutation.reset();
    setDosingInputs((current) => ({ ...current, [field]: value }));
  };

  const updateLabelInputs = <K extends keyof LabelSuggestionInputs>(
    field: K,
    value: LabelSuggestionInputs[K],
  ) => {
    labelMutation.reset();
    setLabelInputs((current) => ({ ...current, [field]: value }));
  };

  const updateBudgetInputs = <K extends keyof BudgetImpactInputs>(
    field: K,
    value: BudgetImpactInputs[K],
  ) => setBudgetInputs((current) => ({ ...current, [field]: value }));

  const updateCurrentTreatment = <K extends keyof CurrentTreatmentInputs>(
    field: K,
    value: CurrentTreatmentInputs[K],
  ) =>
    setBudgetInputs((current) => ({
      ...current,
      currentTreatment: { ...current.currentTreatment, [field]: value },
    }));

  const handleCurrencyChange = (nextCurrency: PharmaCurrency) => {
    setCurrency(nextCurrency);
    setCostResult(null);
    setBudgetResult(null);
    dosingMutation.reset();
    costMutation.reset();
    budgetMutation.reset();
  };

  const handleDosingCalculation = () => {
    dosingMutation.mutate(toDosingRequest(dosingInputs));
  };

  const handleFindLabel = () => {
    labelMutation.mutate(
      toDailyMedSuggestionRequest(
        costInputs.drugName,
        costInputs.indication,
        labelInputs,
      ),
    );
  };

  const handleApplyLabel = () => {
    if (!labelMutation.data?.suggestions) return;
    dosingMutation.reset();
    setDosingInputs((current) =>
      applyDailyMedSuggestion(current, labelMutation.data!),
    );
  };

  const handleCostCalculation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submittedInputs = { ...costInputs };
    costMutation.mutate(toCostAnalysisRequest(submittedInputs, currency), {
      onSuccess: (response) => {
        setCostResult(toCostAnalysisResult(submittedInputs, response));
      },
    });
  };

  const handleUseCostAnalysisForBudget = () => {
    if (!costResult) return;
    const source = costResult.inputs;
    setBudgetInputs((current) => ({
      ...current,
      drugName: source.drugName,
      indication: source.indication,
      annualDrugCost: source.annualDrugCost,
      administrationAndMonitoring:
        source.administration +
        source.monitoring +
        source.labDiagnostics +
        source.outpatientVisits +
        source.hospitalizations +
        source.otherDirectCosts,
      adverseEventCost: costResult.expectedAdverseEventCost,
      offsets: costResult.totalOffsets,
      currentTreatment: costResult.hasComparator
        ? {
            name: source.comparatorName,
            drugPrice: source.comparatorAnnualCost,
            extraCareCost: source.comparatorExtraCost,
            savings: source.comparatorOffsets,
          }
        : current.currentTreatment,
    }));
    setBudgetResult(null);
    budgetMutation.reset();
    setActivePage("budget");
  };

  const handleBudgetCalculation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submittedInputs = {
      ...budgetInputs,
      currentTreatment: { ...budgetInputs.currentTreatment },
      uptakePercent: [...budgetInputs.uptakePercent],
    };
    budgetMutation.mutate(toBudgetImpactRequest(submittedInputs, currency), {
      onSuccess: (response) => {
        setBudgetResult(toBudgetImpactAnalysis(submittedInputs, response));
      },
    });
  };

  return (
    <div className={cn(styles.calculatorUi, "mt-7 lg:mt-9")}>
      <CalculatorToolbar
        activePage={activePage}
        currency={currency}
        onPageChange={setActivePage}
        onCurrencyChange={handleCurrencyChange}
      />

      {activePage === "cost" ? (
        <div
          id="calculator-mode-cost-panel"
          role="tabpanel"
          aria-labelledby="calculator-mode-cost-tab"
          className="mt-6"
        >
          <div className={styles.workspaceGrid}>
            <CostInputPanel
              inputs={costInputs}
              dosingInputs={dosingInputs}
              labelInputs={labelInputs}
              currency={currency}
              dosingResult={dosingResult}
              dosingError={
                dosingMutation.error
                  ? getPharmaCalculatorErrorMessage(dosingMutation.error)
                  : null
              }
              labelError={
                labelMutation.error
                  ? getPharmaCalculatorErrorMessage(labelMutation.error)
                  : null
              }
              labelResult={labelMutation.data}
              isCalculatingDosing={dosingMutation.isPending}
              isLoadingLabel={labelMutation.isPending}
              isCalculatingCost={costMutation.isPending}
              costError={
                costMutation.error
                  ? getPharmaCalculatorErrorMessage(costMutation.error)
                  : null
              }
              onInputsChange={updateCostInputs}
              onDosingInputsChange={updateDosingInputs}
              onLabelInputsChange={updateLabelInputs}
              onRunDosing={handleDosingCalculation}
              onFindLabel={handleFindLabel}
              onApplyLabel={handleApplyLabel}
              onCalculate={handleCostCalculation}
            />
            <section className="min-w-0" aria-live="polite">
              {costResult ? (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <DownloadResultsButton
                      onClick={() =>
                        downloadCostAnalysisPdf(costResult, currency)
                      }
                    >
                      Download cost analysis PDF
                    </DownloadResultsButton>
                  </div>
                  <CostAnalysisSummary result={costResult} currency={currency} />
                  <button
                    type="button"
                    className="w-full rounded-card border border-brand-border bg-brand-bg px-4 py-3 text-left text-[12px] font-semibold text-brand transition-colors hover:bg-brand/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    onClick={handleUseCostAnalysisForBudget}
                  >
                    Use these validated costs in Budget Impact Analysis →
                  </button>
                  <CostAnalysisDetails result={costResult} currency={currency} />
                </div>
              ) : (
                <CalculatorEmptyState kind="cost" />
              )}
            </section>
          </div>
        </div>
      ) : (
        <div
          id="calculator-mode-budget-panel"
          role="tabpanel"
          aria-labelledby="calculator-mode-budget-tab"
          className="mt-6"
        >
          <div className={styles.workspaceGrid}>
            <BudgetInputPanel
              inputs={budgetInputs}
              currency={currency}
              error={
                budgetMutation.error
                  ? getPharmaCalculatorErrorMessage(budgetMutation.error)
                  : null
              }
              isCalculating={budgetMutation.isPending}
              onInputsChange={updateBudgetInputs}
              onCurrentTreatmentChange={updateCurrentTreatment}
              onCalculate={handleBudgetCalculation}
            />
            <section className="min-w-0" aria-live="polite">
              {budgetResult ? (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <DownloadResultsButton
                      onClick={() =>
                        downloadBudgetImpactPdf(budgetResult, currency)
                      }
                    >
                      Download budget impact analysis PDF
                    </DownloadResultsButton>
                  </div>
                  <BudgetImpactDetails
                    analysis={budgetResult}
                    currency={currency}
                  />
                </div>
              ) : (
                <CalculatorEmptyState kind="budget" />
              )}
            </section>
          </div>
        </div>
      )}

      <aside className="mt-8 flex items-start gap-3 border-t border-border-default pt-5 text-[11px] leading-5 text-text-muted">
        <svg
          viewBox="0 0 20 20"
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-brand"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <circle cx="10" cy="10" r="7" />
          <path d="M10 9v4m0-7v.5" />
        </svg>
        <p>
          Calculator outputs are generated by the LillyAI API from the values
          entered here. Review local assumptions and source data before using
          results in a reimbursement decision.
        </p>
      </aside>
    </div>
  );
}
