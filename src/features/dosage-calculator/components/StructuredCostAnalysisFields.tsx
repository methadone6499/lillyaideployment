"use client";

import { Select, TextField } from "@/components/ui";
import type {
  StructuredCostAnalysisFormField,
  StructuredCostAnalysisFormValues,
} from "../utils/structuredCostAnalysis";

export type StructuredCostAnalysisFieldErrors = Partial<
  Record<StructuredCostAnalysisFormField, string>
>;

type StructuredCostAnalysisFieldsProps = {
  values: StructuredCostAnalysisFormValues;
  errors?: StructuredCostAnalysisFieldErrors;
  onFieldChange: (
    field: StructuredCostAnalysisFormField,
    value: string,
  ) => void;
  comparatorOptions?: readonly { value: string; label: string }[];
  comparatorDisabled?: boolean;
  idPrefix?: string;
};

type NumberFieldDefinition = {
  field: StructuredCostAnalysisFormField;
  label: string;
  helper?: string;
  step?: string;
};

const ANNUAL_COST_FIELDS: readonly NumberFieldDefinition[] = [
  { field: "costAdministration", label: "Administration" },
  { field: "costMonitoring", label: "Monitoring" },
  { field: "costLabDiagnostics", label: "Lab and diagnostics" },
  { field: "costOutpatientVisits", label: "Outpatient visits" },
  { field: "costAeManagement", label: "AE management" },
  {
    field: "costAeRatePercent",
    label: "AE rate (%)",
    helper: "A number from 0 to 100.",
  },
  { field: "costHospitalizations", label: "Hospitalizations" },
  { field: "costOtherDirectCosts", label: "Other direct costs" },
] as const;

const OFFSET_FIELDS: readonly NumberFieldDefinition[] = [
  {
    field: "costHospitalizationAvoidance",
    label: "Hospitalization avoidance",
  },
  { field: "costOtherOffsets", label: "Other offsets" },
] as const;

const COMPARATOR_COST_FIELDS: readonly NumberFieldDefinition[] = [
  {
    field: "costComparatorAnnualDrugCost",
    label: "Comparator annual drug cost",
  },
  {
    field: "costComparatorAdministrationAndMonitoring",
    label: "Comparator administration and monitoring",
  },
  { field: "costComparatorOffsets", label: "Comparator offsets" },
] as const;

const POPULATION_FIELDS: readonly NumberFieldDefinition[] = [
  {
    field: "costEligiblePatients",
    label: "Eligible patients",
    step: "1",
  },
  {
    field: "costUptakeYear1Percent",
    label: "Year 1 uptake (%)",
    helper: "A number from 0 to 100.",
  },
  {
    field: "costUptakeYear2Percent",
    label: "Year 2 uptake (%)",
    helper: "A number from 0 to 100.",
  },
  {
    field: "costUptakeYear3Percent",
    label: "Year 3 uptake (%)",
    helper: "A number from 0 to 100.",
  },
] as const;

function CostFieldsGrid({
  fields,
  values,
  errors,
  idPrefix,
  onFieldChange,
}: {
  fields: readonly NumberFieldDefinition[];
  values: StructuredCostAnalysisFormValues;
  errors?: StructuredCostAnalysisFieldErrors;
  idPrefix: string;
  onFieldChange: StructuredCostAnalysisFieldsProps["onFieldChange"];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {fields.map(({ field, label, helper, step = "0.01" }) => (
        <TextField
          key={field}
          id={`${idPrefix}-${field}`}
          label={label}
          required
          type="number"
          min={0}
          max={field.includes("Percent") ? 100 : undefined}
          step={step}
          inputMode="decimal"
          value={values[field]}
          helper={helper}
          error={errors?.[field]}
          onChange={(event) => onFieldChange(field, event.target.value)}
        />
      ))}
    </div>
  );
}

export function StructuredCostAnalysisFields({
  values,
  errors,
  onFieldChange,
  comparatorOptions,
  comparatorDisabled = false,
  idPrefix = "structured-cost",
}: StructuredCostAnalysisFieldsProps) {
  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-4" aria-labelledby={`${idPrefix}-annual-heading`}>
        <div>
          <h3 id={`${idPrefix}-annual-heading`} className="text-card-title font-medium text-white">
            Annual treatment costs
          </h3>
          <p className="mt-1 text-helper text-text-muted">
            Enter zero when a cost does not apply.
          </p>
        </div>
        <CostFieldsGrid
          fields={ANNUAL_COST_FIELDS}
          values={values}
          errors={errors}
          idPrefix={idPrefix}
          onFieldChange={onFieldChange}
        />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby={`${idPrefix}-offsets-heading`}>
        <h3 id={`${idPrefix}-offsets-heading`} className="text-card-title font-medium text-white">
          Offsets
        </h3>
        <CostFieldsGrid
          fields={OFFSET_FIELDS}
          values={values}
          errors={errors}
          idPrefix={idPrefix}
          onFieldChange={onFieldChange}
        />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby={`${idPrefix}-comparator-heading`}>
        <div>
          <h3 id={`${idPrefix}-comparator-heading`} className="text-card-title font-medium text-white">
            Priced comparator
          </h3>
          <p className="mt-1 text-helper text-text-muted">
            One comparator is used as the baseline for all three budget years.
          </p>
        </div>
        {comparatorOptions ? (
          <Select
            id={`${idPrefix}-costComparatorName`}
            label="Comparator"
            required
            value={values.costComparatorName}
            options={comparatorOptions}
            disabled={comparatorDisabled}
            error={errors?.costComparatorName}
            onChange={(event) =>
              onFieldChange("costComparatorName", event.target.value)
            }
          />
        ) : (
          <TextField
            id={`${idPrefix}-costComparatorName`}
            label="Comparator name"
            required
            value={values.costComparatorName}
            error={errors?.costComparatorName}
            onChange={(event) =>
              onFieldChange("costComparatorName", event.target.value)
            }
          />
        )}
        <CostFieldsGrid
          fields={COMPARATOR_COST_FIELDS}
          values={values}
          errors={errors}
          idPrefix={idPrefix}
          onFieldChange={onFieldChange}
        />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby={`${idPrefix}-population-heading`}>
        <h3 id={`${idPrefix}-population-heading`} className="text-card-title font-medium text-white">
          Eligible population and uptake
        </h3>
        <CostFieldsGrid
          fields={POPULATION_FIELDS}
          values={values}
          errors={errors}
          idPrefix={idPrefix}
          onFieldChange={onFieldChange}
        />
      </section>
    </div>
  );
}
