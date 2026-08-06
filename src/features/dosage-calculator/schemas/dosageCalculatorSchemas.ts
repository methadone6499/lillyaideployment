import { z } from "zod";

function requiredText(label: string) {
  return z.string().trim().min(1, `${label} is required`);
}

function requiredPositiveNumber(label: string) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed === "" ? undefined : Number(trimmed);
    },
    z
      .number({ error: `${label} is required and must be a number` })
      .finite(`${label} must be a finite number`)
      .positive(`${label} must be greater than 0`),
  );
}

export const dosageCalculatorFormSchema = z.object({
  drug: requiredText("Drug"),
  indication: requiredText("Indication"),
  age: requiredPositiveNumber("Age"),
  weight: requiredPositiveNumber("Weight"),
  region: requiredText("Region"),
  population: requiredText("Population"),
  renalFunction: requiredText("Renal function"),
  hepaticFunction: requiredText("Hepatic function"),
  treatmentDuration: requiredPositiveNumber("Treatment duration"),
  pregnantOrPlanning: z.boolean(),
  concomitantInsulin: z.boolean(),
});

export const dosageCalculatorSubmissionSchema = dosageCalculatorFormSchema;

export type DosageCalculatorFormInput = z.input<
  typeof dosageCalculatorFormSchema
>;
export type DosageCalculatorSubmission = z.output<
  typeof dosageCalculatorSubmissionSchema
>;
