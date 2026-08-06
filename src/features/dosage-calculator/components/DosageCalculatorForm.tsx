"use client";

import { Button, Card, Select, TextField } from "@/components/ui";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS,
  DOSAGE_HEPATIC_FUNCTION_OPTIONS,
  DOSAGE_RENAL_FUNCTION_OPTIONS,
  DOSAGE_RISK_FLAG_OPTIONS,
  TEMPORARY_FIGMA_INDICATION_OPTIONS,
  TEMPORARY_FIGMA_POPULATION_OPTIONS,
  TEMPORARY_FIGMA_REGION_OPTIONS,
} from "../data/dosageCalculatorFixtures";
import { dosageCalculatorFormSchema } from "../schemas/dosageCalculatorSchemas";
import {
  useDosageCalculatorStore,
  type DosageCalculatorTextField,
} from "../store/useDosageCalculatorStore";
import { FunctionSelector } from "./FunctionSelector";
import { RiskFlagCheckbox } from "./RiskFlagCheckbox";

const FIELD_IDS = {
  drug: "dosage-drug",
  indication: "dosage-indication",
  age: "dosage-age",
  weight: "dosage-weight",
  region: "dosage-region",
  population: "dosage-population",
  renalFunction: "dosage-renal-function",
  hepaticFunction: "dosage-hepatic-function",
  treatmentDuration: "dosage-treatment-duration",
} as const satisfies Record<DosageCalculatorTextField, string>;

const FIELD_FOCUS_IDS = {
  ...FIELD_IDS,
  renalFunction: `${FIELD_IDS.renalFunction}-${DOSAGE_RENAL_FUNCTION_OPTIONS[0].value}`,
  hepaticFunction: `${FIELD_IDS.hepaticFunction}-${DOSAGE_HEPATIC_FUNCTION_OPTIONS[0].value}`,
} as const satisfies Record<DosageCalculatorTextField, string>;

type FieldErrors = Partial<Record<DosageCalculatorTextField, string>>;

export function DosageCalculatorForm() {
  const {
    drug,
    indication,
    age,
    weight,
    region,
    population,
    renalFunction,
    hepaticFunction,
    treatmentDuration,
    pregnantOrPlanning,
    concomitantInsulin,
    setField,
    setRiskFlag,
    hideResultPreview,
    showResultPreview,
  } = useDosageCalculatorStore();
  const [errors, setErrors] = useState<FieldErrors>({});

  const clearFieldError = (field: DosageCalculatorTextField) => {
    setErrors((current) => {
      if (!current[field]) return current;

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const updateField = (field: DosageCalculatorTextField, value: string) => {
    setField(field, value);
    clearFieldError(field);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    hideResultPreview();

    const parsed = dosageCalculatorFormSchema.safeParse({
      drug,
      indication,
      age,
      weight,
      region,
      population,
      renalFunction,
      hepaticFunction,
      treatmentDuration,
      pregnantOrPlanning,
      concomitantInsulin,
    });

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      let firstInvalidField: DosageCalculatorTextField | undefined;

      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (
          typeof path !== "string" ||
          !Object.prototype.hasOwnProperty.call(FIELD_IDS, path)
        ) {
          continue;
        }

        const field = path as DosageCalculatorTextField;
        if (nextErrors[field]) continue;

        nextErrors[field] = issue.message;
        firstInvalidField ??= field;
      }

      setErrors(nextErrors);

      if (firstInvalidField) {
        const focusId = FIELD_FOCUS_IDS[firstInvalidField];
        requestAnimationFrame(() => {
          document.getElementById(focusId)?.focus();
        });
      }
      return;
    }

    setErrors({});
    showResultPreview();
  };

  return (
    <Card className="w-full overflow-visible rounded-button">
      <div className="border-b border-border-default px-6 py-5">
        <h2 className="text-card-title font-medium text-white">
          Patient &amp; drug inputs
        </h2>
        <p className="mt-2 text-helper text-text-muted">
          All fields required for accurate calculation
        </p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 p-6"
      >
        <TextField
          id={FIELD_IDS.drug}
          name="drug"
          label="Drug"
          required
          value={drug}
          placeholder={DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.drug}
          error={errors.drug}
          containerClassName="gap-5"
          onChange={(event) => updateField("drug", event.target.value)}
        />

        <Select
          id={FIELD_IDS.indication}
          name="indication"
          label="Indication"
          required
          value={indication}
          options={TEMPORARY_FIGMA_INDICATION_OPTIONS}
          placeholder={DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.indication}
          error={errors.indication}
          containerClassName="gap-5"
          onChange={(event) => updateField("indication", event.target.value)}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
          <TextField
            id={FIELD_IDS.age}
            name="age"
            label="Age (years)"
            required
            type="number"
            inputMode="numeric"
            value={age}
            placeholder={DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.age}
            error={errors.age}
            containerClassName="gap-5"
            onChange={(event) => updateField("age", event.target.value)}
          />
          <TextField
            id={FIELD_IDS.weight}
            name="weight"
            label="Weight (kg)"
            required
            type="number"
            inputMode="decimal"
            value={weight}
            placeholder={DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.weight}
            error={errors.weight}
            containerClassName="gap-5"
            onChange={(event) => updateField("weight", event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
          <Select
            id={FIELD_IDS.region}
            name="region"
            label="Region"
            required
            value={region}
            options={TEMPORARY_FIGMA_REGION_OPTIONS}
            placeholder={DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.region}
            error={errors.region}
            containerClassName="gap-5"
            onChange={(event) => updateField("region", event.target.value)}
          />
          <Select
            id={FIELD_IDS.population}
            name="population"
            label="Population"
            required
            value={population}
            options={TEMPORARY_FIGMA_POPULATION_OPTIONS}
            placeholder={DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.population}
            error={errors.population}
            containerClassName="gap-5"
            onChange={(event) => updateField("population", event.target.value)}
          />
        </div>

        <FunctionSelector
          id={FIELD_IDS.renalFunction}
          label={
            <>
              Renal function{" "}
              <span className="font-normal text-text-step">
                (Cockcroft–Gault eGFR)
              </span>
            </>
          }
          required
          value={renalFunction}
          options={DOSAGE_RENAL_FUNCTION_OPTIONS}
          error={errors.renalFunction}
          onChange={(value) => updateField("renalFunction", value)}
        />

        <FunctionSelector
          id={FIELD_IDS.hepaticFunction}
          label="Hepatic function"
          required
          value={hepaticFunction}
          options={DOSAGE_HEPATIC_FUNCTION_OPTIONS}
          error={errors.hepaticFunction}
          onChange={(value) => updateField("hepaticFunction", value)}
        />

        <TextField
          id={FIELD_IDS.treatmentDuration}
          name="treatmentDuration"
          label={
            <>
              Treatment duration{" "}
              <span className="font-normal text-text-step">(weeks)</span>
            </>
          }
          required
          type="number"
          inputMode="numeric"
          value={treatmentDuration}
          placeholder={
            DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.treatmentDuration
          }
          error={errors.treatmentDuration}
          containerClassName="gap-5"
          onChange={(event) =>
            updateField("treatmentDuration", event.target.value)
          }
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
          <RiskFlagCheckbox
            id={`dosage-${DOSAGE_RISK_FLAG_OPTIONS[0].value}`}
            name={DOSAGE_RISK_FLAG_OPTIONS[0].value}
            label={DOSAGE_RISK_FLAG_OPTIONS[0].label}
            checked={pregnantOrPlanning}
            onChange={(checked) =>
              setRiskFlag("pregnantOrPlanning", checked)
            }
          />
          <RiskFlagCheckbox
            id={`dosage-${DOSAGE_RISK_FLAG_OPTIONS[1].value}`}
            name={DOSAGE_RISK_FLAG_OPTIONS[1].value}
            label={DOSAGE_RISK_FLAG_OPTIONS[1].label}
            checked={concomitantInsulin}
            onChange={(checked) => setRiskFlag("concomitantInsulin", checked)}
          />
        </div>

        <Button type="submit" className="h-14 w-full text-body-lg">
          Calculate Dosage
        </Button>
      </form>
    </Card>
  );
}
