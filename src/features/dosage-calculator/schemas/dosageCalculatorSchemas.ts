import { z } from "zod";

import {
  DOSAGE_CALCULATOR_CATEGORY_VALUES,
  DOSAGE_CALCULATOR_CURRENCY_CODES,
  DOSAGE_CALCULATOR_DURATION_UNIT_VALUES,
  DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE,
  DOSAGE_CALCULATOR_POPULATION_SLUGS,
} from "../constants/dosageCalculatorOptions";

function requiredText(label: string) {
  return z.string().trim().min(1, `${label} is required`);
}

function optionalUppercaseText() {
  return z.preprocess((value) => {
    if (value == null) return undefined;
    if (typeof value !== "string") return value;

    const normalized = value.trim().toUpperCase();
    return normalized === "" ? undefined : normalized;
  }, z.string().min(1).optional());
}

function hasRequiredCustomCurrency(value: {
  currency: string;
  customCurrency?: string;
}) {
  return (
    value.currency !== DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE ||
    Boolean(value.customCurrency)
  );
}

const customCurrencyRequiredIssue = {
  path: ["customCurrency"],
  error: "Custom currency code is required",
};

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

function requiredNonNegativeNumber(label: string) {
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
      .nonnegative(`${label} must be 0 or greater`),
  );
}

function requiredPercentage(label: string) {
  return requiredNonNegativeNumber(label).pipe(
    z.number().max(100, `${label} must be 100 or less`),
  );
}

function requiredPositiveInteger(label: string) {
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
      .int(`${label} must be a whole number`)
      .positive(`${label} must be greater than 0`),
  );
}

function optionalPositiveInteger(label: string) {
  return z.preprocess((value) => {
    if (value == null) return undefined;
    if (typeof value !== "string") return value;

    const trimmed = value.trim();
    return trimmed === "" ? undefined : Number(trimmed);
  }, z.number().finite(`${label} must be a finite number`).int(`${label} must be a whole number`).positive(`${label} must be greater than 0`).optional());
}

const isoDateTimeSchema = z.string().datetime({ offset: true });

export const structuredCostAnalysisAnnualCostsSchema = z
  .object({
    administration: z.number().finite().nonnegative(),
    monitoring: z.number().finite().nonnegative(),
    lab_diagnostics: z.number().finite().nonnegative(),
    outpatient_visits: z.number().finite().nonnegative(),
    ae_management: z.number().finite().nonnegative(),
    ae_rate_percent: z.number().finite().min(0).max(100),
    hospitalizations: z.number().finite().nonnegative(),
    other_direct_costs: z.number().finite().nonnegative(),
  })
  .strict();

export const structuredCostAnalysisOffsetsSchema = z
  .object({
    hospitalization_avoidance: z.number().finite().nonnegative(),
    other_offsets: z.number().finite().nonnegative(),
  })
  .strict();

const structuredComparatorCostFieldsSchema = z
  .object({
    annual_drug_cost: z.number().finite().nonnegative(),
    administration_and_monitoring: z.number().finite().nonnegative(),
    offsets: z.number().finite().nonnegative(),
  })
  .strict();

export const standaloneStructuredComparatorSchema =
  structuredComparatorCostFieldsSchema
    .extend({ name: requiredText("Comparator name") })
    .strict();

export const reportStructuredComparatorSchema =
  structuredComparatorCostFieldsSchema
    .extend({
      name: requiredText("Comparator name").nullable().optional(),
    })
    .strict();

export const structuredCostAnalysisPopulationSchema = z
  .object({
    eligible_patients: z.number().finite().int().positive(),
    uptake_year_1_percent: z.number().finite().min(0).max(100),
    uptake_year_2_percent: z.number().finite().min(0).max(100),
    uptake_year_3_percent: z.number().finite().min(0).max(100),
  })
  .strict();

const structuredCostAnalysisBaseShape = {
  annual_costs: structuredCostAnalysisAnnualCostsSchema,
  offsets: structuredCostAnalysisOffsetsSchema,
  population: structuredCostAnalysisPopulationSchema,
};

export const standaloneStructuredCostAnalysisSchema = z
  .object({
    ...structuredCostAnalysisBaseShape,
    comparator: standaloneStructuredComparatorSchema,
  })
  .strict();

export const reportStructuredCostAnalysisSchema = z
  .object({
    ...structuredCostAnalysisBaseShape,
    comparator: reportStructuredComparatorSchema,
  })
  .strict();

export const structuredCostAnalysisFormFieldsSchema = z
  .object({
    costAdministration: requiredNonNegativeNumber("Administration cost"),
    costMonitoring: requiredNonNegativeNumber("Monitoring cost"),
    costLabDiagnostics: requiredNonNegativeNumber("Lab and diagnostics cost"),
    costOutpatientVisits: requiredNonNegativeNumber("Outpatient visits cost"),
    costAeManagement: requiredNonNegativeNumber("AE management cost"),
    costAeRatePercent: requiredPercentage("AE rate"),
    costHospitalizations: requiredNonNegativeNumber("Hospitalization cost"),
    costOtherDirectCosts: requiredNonNegativeNumber("Other direct costs"),
    costHospitalizationAvoidance: requiredNonNegativeNumber(
      "Hospitalization avoidance",
    ),
    costOtherOffsets: requiredNonNegativeNumber("Other offsets"),
    costComparatorName: requiredText("Comparator name"),
    costComparatorAnnualDrugCost: requiredNonNegativeNumber(
      "Comparator annual drug cost",
    ),
    costComparatorAdministrationAndMonitoring: requiredNonNegativeNumber(
      "Comparator administration and monitoring",
    ),
    costComparatorOffsets: requiredNonNegativeNumber("Comparator offsets"),
    costEligiblePatients: requiredPositiveInteger("Eligible patients"),
    costUptakeYear1Percent: requiredPercentage("Year 1 uptake"),
    costUptakeYear2Percent: requiredPercentage("Year 2 uptake"),
    costUptakeYear3Percent: requiredPercentage("Year 3 uptake"),
  })
  .strict();

export const dosageCalculatorPopulationSlugSchema = z.enum(
  DOSAGE_CALCULATOR_POPULATION_SLUGS,
);

export const dosageCalculatorCategorySchema = z.enum(
  DOSAGE_CALCULATOR_CATEGORY_VALUES,
);

export const dosageCalculatorDurationUnitSchema = z.enum(
  DOSAGE_CALCULATOR_DURATION_UNIT_VALUES,
);

export const dosageCalculatorCurrencySelectionSchema = z.union([
  z.enum(DOSAGE_CALCULATOR_CURRENCY_CODES),
  z.literal(DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE),
]);

export const dosageCalculatorJobStatusSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "failed",
]);

export const dosageCalculatorJobPhaseSchema = z.enum([
  "queued",
  "label",
  "extract",
  "calculate",
  "done",
]);

export const dosageCalculatorTerminalJobStatusSchema = z.enum([
  "completed",
  "failed",
]);

export const dosageCalculatorIndicationMatchSchema = z.enum([
  "exact",
  "close",
  "none",
]);

export const dosageCalculatorPriceSourceSchema = z.literal("user_provided");

const dosageCalculatorCalculationFieldsObjectSchema = z
  .object({
    drug: requiredText("Drug"),
    indication: requiredText("Indication"),
    population: dosageCalculatorPopulationSlugSchema,
    frequency: requiredText("Frequency"),
    treatmentDuration: requiredPositiveNumber("Treatment duration"),
    durationUnit: dosageCalculatorDurationUnitSchema,
    currency: dosageCalculatorCurrencySelectionSchema,
    customCurrency: optionalUppercaseText(),
    unitPrice: requiredPositiveNumber("Unit price"),
    patientVolume: optionalPositiveInteger("Patient volume"),
    includeCostAnalysis: z.boolean().default(false),
    costAdministration: z.string().default("0"),
    costMonitoring: z.string().default("0"),
    costLabDiagnostics: z.string().default("0"),
    costOutpatientVisits: z.string().default("0"),
    costAeManagement: z.string().default("0"),
    costAeRatePercent: z.string().default("0"),
    costHospitalizations: z.string().default("0"),
    costOtherDirectCosts: z.string().default("0"),
    costHospitalizationAvoidance: z.string().default("0"),
    costOtherOffsets: z.string().default("0"),
    costComparatorName: z.string().default(""),
    costComparatorAnnualDrugCost: z.string().default("0"),
    costComparatorAdministrationAndMonitoring: z.string().default("0"),
    costComparatorOffsets: z.string().default("0"),
    costEligiblePatients: z.string().default(""),
    costUptakeYear1Percent: z.string().default(""),
    costUptakeYear2Percent: z.string().default(""),
    costUptakeYear3Percent: z.string().default(""),
  })
  .strict();

/** Required calculation inputs plus optional cohort size. */
export const dosageCalculatorCalculationFieldsSchema =
  dosageCalculatorCalculationFieldsObjectSchema.refine(
    hasRequiredCustomCurrency,
    customCurrencyRequiredIssue,
  );

export const dosageCalculatorFormSchema =
  dosageCalculatorCalculationFieldsSchema.superRefine((value, context) => {
    if (!value.includeCostAnalysis) {
      return;
    }

    const result = structuredCostAnalysisFormFieldsSchema
      .loose()
      .safeParse(value);
    if (result.success) {
      return;
    }

    for (const issue of result.error.issues) {
      context.addIssue({
        code: "custom",
        path: issue.path,
        message: issue.message,
      });
    }
  });

const dosageCalculatorRequestFieldsSchema = z.object({
  drug: requiredText("Drug"),
  indication: requiredText("Indication"),
  category: dosageCalculatorCategorySchema,
  frequency: requiredText("Frequency"),
  duration: requiredText("Duration"),
  currency: requiredText("Currency"),
  unit_price: z
    .number({ error: "Unit price is required and must be a number" })
    .finite("Unit price must be a finite number")
    .positive("Unit price must be greater than 0"),
  patient_volume: z
    .number()
    .int("Patient volume must be a whole number")
    .positive("Patient volume must be greater than 0")
    .nullable()
    .optional(),
  idempotency_key: z.string().trim().min(1).nullable().optional(),
  cost_analysis: standaloneStructuredCostAnalysisSchema
    .nullable()
    .optional(),
});

/** Complete backend contract, including optional `model`. */
export const dosageCalculatorRequestSchema = dosageCalculatorRequestFieldsSchema
  .extend({
    model: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

/**
 * UI-generated request: the fields the form mapper may emit. `model` is not
 * included; the complete backend schema still permits it.
 */
export const dosageCalculatorUiRequestSchema =
  dosageCalculatorRequestFieldsSchema
    .required({ idempotency_key: true })
    .strict()
    .refine(
      (value) => value.currency !== DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE,
      {
        path: ["currency"],
        error: "Currency must be a currency code",
      },
    );

export const dosageCalculatorPollUrlsSchema = z
  .object({
    status: z.string().trim().min(1),
    result: z.string().trim().min(1),
    markdown: z.string().trim().min(1),
  })
  .strict();

export const dosageCalculatorProgressSchema = z
  .object({
    percent: z.number().min(0).max(100),
    detail: z.string(),
  })
  .strict();

export const dosageCalculatorEnqueueResponseSchema = z
  .object({
    job_id: z.string().trim().min(1),
    job_status: dosageCalculatorJobStatusSchema,
    phase: dosageCalculatorJobPhaseSchema,
    celery_task_id: z.string().trim().min(1),
    poll_urls: dosageCalculatorPollUrlsSchema,
    created_at: isoDateTimeSchema,
    message: z.string().min(1),
  })
  .strict();

export const dosageCalculatorStatusResponseSchema = z
  .object({
    job_id: z.string().trim().min(1),
    job_status: dosageCalculatorJobStatusSchema,
    phase: dosageCalculatorJobPhaseSchema,
    progress: dosageCalculatorProgressSchema,
    error: z.string().nullable(),
    poll_urls: dosageCalculatorPollUrlsSchema,
  })
  .strict();

export const dosageCalculatorTableRowSchema = z
  .object({
    drug_name: z.string(),
    unit_price: z.string(),
    dose: z.string(),
    estimated_usage: z.string(),
    cost_per_patient: z.string(),
    cost_cohort: z.string(),
    period: z.string(),
    presentation: z.string(),
    units: z.number(),
    unit_price_amount: z.number().finite().nullable().optional(),
    cost_per_patient_amount: z.number().finite().nullable().optional(),
    cost_cohort_amount: z.number().finite().nullable().optional(),
  })
  .strict();

export const dosageCalculatorArtifactsSchema = z
  .object({
    label_html_path: z.string(),
    label_markdown_path: z.string(),
    extraction_path: z.string(),
    markdown_path: z.string(),
    metadata_path: z.string().optional(),
    budget_impact_path: z.string().nullable().optional(),
  })
  .strict();

export const dosageCalculatorResultSchema = z
  .object({
    job_id: z.string().trim().min(1),
    price_source: dosageCalculatorPriceSourceSchema,
    indication_match: dosageCalculatorIndicationMatchSchema,
    table: z.array(dosageCalculatorTableRowSchema),
    extraction: z.unknown(),
    markdown: z.string(),
    artifacts: dosageCalculatorArtifactsSchema,
    warnings: z.array(z.string()),
    budget_impact: z.looseObject({}).nullable().optional(),
  })
  .strict();

export function isDosageCalculatorTerminalJobStatus(
  status: DosageCalculatorJobStatus,
): status is DosageCalculatorTerminalJobStatus {
  return dosageCalculatorTerminalJobStatusSchema.safeParse(status).success;
}

export function isDosageCalculatorResultReady(
  status: DosageCalculatorJobStatus | undefined,
): boolean {
  return status === "completed";
}

export type DosageCalculatorFormInput = z.input<
  typeof dosageCalculatorFormSchema
>;
export type DosageCalculatorParsedForm = z.output<
  typeof dosageCalculatorFormSchema
>;
export type DosageCalculatorRequest = z.output<
  typeof dosageCalculatorRequestSchema
>;
export type DosageCalculatorUiRequest = z.output<
  typeof dosageCalculatorUiRequestSchema
>;
export type DosageCalculatorPollUrls = z.output<
  typeof dosageCalculatorPollUrlsSchema
>;
export type DosageCalculatorProgress = z.output<
  typeof dosageCalculatorProgressSchema
>;
export type DosageCalculatorEnqueueResponse = z.output<
  typeof dosageCalculatorEnqueueResponseSchema
>;
export type DosageCalculatorStatusResponse = z.output<
  typeof dosageCalculatorStatusResponseSchema
>;
export type DosageCalculatorTableRow = z.output<
  typeof dosageCalculatorTableRowSchema
>;
export type DosageCalculatorResult = z.output<
  typeof dosageCalculatorResultSchema
>;
export type StandaloneStructuredCostAnalysis = z.output<
  typeof standaloneStructuredCostAnalysisSchema
>;
export type ReportStructuredCostAnalysis = z.output<
  typeof reportStructuredCostAnalysisSchema
>;
export type StructuredCostAnalysisFormFields = z.input<
  typeof structuredCostAnalysisFormFieldsSchema
>;
export type ParsedStructuredCostAnalysisFormFields = z.output<
  typeof structuredCostAnalysisFormFieldsSchema
>;
export type DosageCalculatorBudgetImpact = NonNullable<
  DosageCalculatorResult["budget_impact"]
>;
export type DosageCalculatorJobStatus = z.infer<
  typeof dosageCalculatorJobStatusSchema
>;
export type DosageCalculatorJobPhase = z.infer<
  typeof dosageCalculatorJobPhaseSchema
>;
export type DosageCalculatorTerminalJobStatus = z.infer<
  typeof dosageCalculatorTerminalJobStatusSchema
>;
export type DosageCalculatorIndicationMatch = z.infer<
  typeof dosageCalculatorIndicationMatchSchema
>;
