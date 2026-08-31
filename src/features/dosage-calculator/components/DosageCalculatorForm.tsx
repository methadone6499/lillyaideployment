"use client";

import { Button, Card, Select, TextField } from "@/components/ui";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  DOSAGE_CALCULATOR_CATEGORY_OPTIONS,
  DOSAGE_CALCULATOR_CURRENCY_OPTIONS,
  DOSAGE_CALCULATOR_DEFAULT_PATIENT_VOLUME,
  DOSAGE_CALCULATOR_DURATION_UNIT_OPTIONS,
  DOSAGE_CALCULATOR_FREQUENCY_OPTIONS,
  DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE,
} from "../constants/dosageCalculatorOptions";
import { DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS } from "../data/dosageCalculatorFixtures";
import { dosageCalculatorFormSchema } from "../schemas/dosageCalculatorSchemas";
import {
  selectDosageCalculatorFormValues,
  useDosageCalculatorStore,
  type DosageCalculatorTextField,
} from "../store/useDosageCalculatorStore";
import { getCategoryWeightHelper } from "../utils/dosageCalculatorDisplay";
import {
  mapDosageCalculatorSubmission,
  type DosageCalculatorSubmission,
} from "../utils/mapDosageCalculatorRequest";

const FIELD_IDS = {
  drug: "dosage-drug",
  indication: "dosage-indication",
  population: "dosage-population",
  frequency: "dosage-frequency",
  treatmentDuration: "dosage-treatment-duration",
  durationUnit: "dosage-duration-unit",
  currency: "dosage-currency",
  customCurrency: "dosage-custom-currency",
  unitPrice: "dosage-unit-price",
  patientVolume: "dosage-patient-volume",
} as const satisfies Record<DosageCalculatorTextField, string>;

const FREQUENCY_SUGGESTIONS_ID = `${FIELD_IDS.frequency}-suggestions`;

type FieldErrors = Partial<Record<DosageCalculatorTextField, string>>;

type DosageCalculatorFormProps = {
  isSubmitting?: boolean;
  onSubmitCalculation: (
    submission: DosageCalculatorSubmission,
  ) => Promise<void>;
};

export function DosageCalculatorForm({
  isSubmitting = false,
  onSubmitCalculation,
}: DosageCalculatorFormProps) {
  const {
    drug,
    indication,
    population,
    frequency,
    treatmentDuration,
    durationUnit,
    currency,
    customCurrency,
    unitPrice,
    patientVolume,
    setField,
  } = useDosageCalculatorStore();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const busy = isSubmitting || isStarting;

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
    if (formError) setFormError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const formValues = selectDosageCalculatorFormValues(
      useDosageCalculatorStore.getState(),
    );
    const parsed = dosageCalculatorFormSchema.safeParse(formValues);

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
      setFormError(null);

      if (firstInvalidField) {
        const focusId = FIELD_IDS[firstInvalidField];
        requestAnimationFrame(() => {
          document.getElementById(focusId)?.focus();
        });
      }
      return;
    }

    setErrors({});

    let submission: DosageCalculatorSubmission;
    try {
      submission = mapDosageCalculatorSubmission(formValues);
    } catch {
      setFormError("Check the calculation inputs and try again.");
      return;
    }

    setIsStarting(true);
    try {
      await onSubmitCalculation(submission);
      setFormError(null);
    } catch {
      setFormError(null);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Card className="w-full overflow-visible rounded-button">
      <div className="border-b border-border-default px-6 py-5">
        <h2 className="text-card-title font-medium text-white">
          Calculation inputs
        </h2>
        <p className="mt-2 text-helper text-text-muted">
          These fields are sent to the calculator.
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

        <TextField
          id={FIELD_IDS.indication}
          name="indication"
          label="Indication"
          required
          value={indication}
          placeholder={DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.indication}
          error={errors.indication}
          containerClassName="gap-5"
          onChange={(event) => updateField("indication", event.target.value)}
        />

        <Select
          id={FIELD_IDS.population}
          name="population"
          label="Patient category"
          required
          value={population}
          options={DOSAGE_CALCULATOR_CATEGORY_OPTIONS}
          placeholder={DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.population}
          helper={getCategoryWeightHelper(population)}
          error={errors.population}
          containerClassName="gap-5"
          onChange={(event) => updateField("population", event.target.value)}
        />

        <div>
          <TextField
            id={FIELD_IDS.frequency}
            name="frequency"
            label="Frequency"
            required
            value={frequency}
            list={FREQUENCY_SUGGESTIONS_ID}
            autoComplete="off"
            placeholder={DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.frequency}
            helper="Type any schedule. Suggestions come from the browser's native list."
            error={errors.frequency}
            containerClassName="gap-5"
            onChange={(event) => updateField("frequency", event.target.value)}
          />
          <datalist id={FREQUENCY_SUGGESTIONS_ID}>
            {DOSAGE_CALCULATOR_FREQUENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
          <TextField
            id={FIELD_IDS.treatmentDuration}
            name="treatmentDuration"
            label="Treatment duration"
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
          <Select
            id={FIELD_IDS.durationUnit}
            name="durationUnit"
            label="Duration unit"
            required
            value={durationUnit}
            options={DOSAGE_CALCULATOR_DURATION_UNIT_OPTIONS}
            placeholder={DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.durationUnit}
            error={errors.durationUnit}
            containerClassName="gap-5"
            onChange={(event) =>
              updateField("durationUnit", event.target.value)
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
          <Select
            id={FIELD_IDS.currency}
            name="currency"
            label="Currency code"
            required
            value={currency}
            options={DOSAGE_CALCULATOR_CURRENCY_OPTIONS}
            placeholder={DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.currency}
            error={errors.currency}
            containerClassName="gap-5"
            onChange={(event) => {
              const nextCurrency = event.target.value;
              updateField("currency", nextCurrency);
              if (nextCurrency !== DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE) {
                updateField("customCurrency", "");
              }
            }}
          />
          <TextField
            id={FIELD_IDS.unitPrice}
            name="unitPrice"
            label="Unit price"
            required
            type="number"
            inputMode="decimal"
            step="any"
            value={unitPrice}
            placeholder={DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.unitPrice}
            helper="Price per billed pack, vial, or tablet. Automated price lookup is not used."
            error={errors.unitPrice}
            containerClassName="gap-5"
            onChange={(event) => updateField("unitPrice", event.target.value)}
          />
          {currency === DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE ? (
            <TextField
              id={FIELD_IDS.customCurrency}
              name="customCurrency"
              label="Custom currency code"
              required
              value={customCurrency}
              placeholder={DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.customCurrency}
              helper="Enter a currency code that is not in the list."
              error={errors.customCurrency}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              containerClassName="gap-5"
              onChange={(event) =>
                updateField("customCurrency", event.target.value.toUpperCase())
              }
            />
          ) : null}
        </div>

        <TextField
          id={FIELD_IDS.patientVolume}
          name="patientVolume"
          label="Patient volume"
          type="number"
          inputMode="numeric"
          value={patientVolume}
          placeholder={DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.patientVolume}
          helper={`Optional. Cohort size for cohort cost. If omitted, the calculator uses ${DOSAGE_CALCULATOR_DEFAULT_PATIENT_VOLUME}.`}
          error={errors.patientVolume}
          containerClassName="gap-5"
          onChange={(event) =>
            updateField("patientVolume", event.target.value)
          }
        />

        {formError ? (
          <p role="alert" className="text-helper text-status-running">
            {formError}
          </p>
        ) : null}

        <Button type="submit" disabled={busy} className="h-14 w-full text-body-lg">
          {busy ? "Starting calculation…" : "Run calculation"}
        </Button>
      </form>
    </Card>
  );
}
