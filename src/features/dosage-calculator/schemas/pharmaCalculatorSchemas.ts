import { z } from "zod";

const requiredText = z.string().trim().min(1);
const finiteNumber = z.number().finite();
const nonNegativeNumber = finiteNumber.nonnegative();
const positiveNumber = finiteNumber.positive();
const percentage = finiteNumber.min(0).max(100);

export const dosingRequestSchema = z
  .object({
    unit_cost: nonNegativeNumber,
    unit_size: positiveNumber,
    dose: positiveNumber,
    times_per_day: positiveNumber,
    days_per_year: positiveNumber.max(366),
    dose_type: z.enum(["fixed", "weight_based"]),
    patient_weight: positiveNumber.nullable().optional(),
    wastage_percent: percentage,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.dose_type === "weight_based" && value.patient_weight == null) {
      context.addIssue({
        code: "custom",
        path: ["patient_weight"],
        message: "Patient weight is required for weight-based dosing.",
      });
    }
  });

export const dosingResponseSchema = z
  .object({
    dose_per_administration: positiveNumber,
    actual_dose_per_day: positiveNumber,
    units_per_administration: positiveNumber,
    annual_units_before_wastage: positiveNumber,
    annual_units: positiveNumber,
    annual_drug_cost: nonNegativeNumber,
  })
  .strict();

const standaloneAnnualCostsSchema = z
  .object({
    drug_acquisition: nonNegativeNumber,
    administration: nonNegativeNumber,
    monitoring: nonNegativeNumber,
    laboratory_diagnostics: nonNegativeNumber,
    outpatient_visits: nonNegativeNumber,
    adverse_event_management: nonNegativeNumber,
    adverse_event_rate_percent: percentage,
    hospitalizations: nonNegativeNumber,
    other_direct_costs: nonNegativeNumber,
  })
  .strict();

const standaloneOffsetsSchema = z
  .object({
    hospitalization_avoidance: nonNegativeNumber,
    other_offsets: nonNegativeNumber,
  })
  .strict();

const standaloneComparatorSchema = z
  .object({
    name: requiredText,
    annual_drug_cost: nonNegativeNumber,
    administration_and_monitoring: nonNegativeNumber,
    offsets: nonNegativeNumber,
    patient_count: z.number().int().nonnegative(),
  })
  .strict();

export const costAnalysisRequestSchema = z
  .object({
    drug_name: requiredText,
    indication: requiredText,
    dosage_form: requiredText,
    drug_class: requiredText,
    currency: requiredText,
    annual_costs: standaloneAnnualCostsSchema,
    offsets: standaloneOffsetsSchema,
    new_drug_patient_count: z.number().int().positive(),
    comparator: standaloneComparatorSchema.nullable().optional(),
  })
  .strict();

const costComponentRowSchema = z
  .object({
    component: z.string(),
    per_patient: finiteNumber,
    programme: finiteNumber,
    percentage_of_net_programme: finiteNumber,
  })
  .strict();

const costComparisonRowSchema = z
  .object({
    component: z.string(),
    new_treatment_per_patient: finiteNumber,
    comparator_per_patient: finiteNumber,
    per_patient_difference: finiteNumber,
    new_treatment_programme: finiteNumber,
    comparator_programme: finiteNumber,
    programme_difference: finiteNumber,
  })
  .strict();

const calculatorChartSchema = z
  .object({
    chart_type: z.string().min(1),
    title: z.string(),
    categories: z.array(z.string()),
    series: z.array(
      z
        .object({
          name: z.string(),
          values: z.array(finiteNumber),
        })
        .strict(),
    ),
  })
  .strict();

export const costAnalysisResponseSchema = z
  .object({
    currency: requiredText,
    per_patient: z
      .object({
        annual_drug_cost: finiteNumber,
        expected_ae_cost: finiteNumber,
        gross_annual_cost: finiteNumber,
        total_offsets: finiteNumber,
        net_annual_cost: finiteNumber,
        comparator_net_annual_cost: finiteNumber.nullable(),
        per_patient_difference: finiteNumber.nullable(),
      })
      .strict(),
    programme: z
      .object({
        new_drug_patients: z.number().int().nonnegative(),
        comparator_patients: z.number().int().nonnegative().nullable(),
        gross_programme_cost: finiteNumber,
        net_programme_cost: finiteNumber,
        total_annual_offsets: finiteNumber,
        comparator_programme_cost: finiteNumber.nullable(),
        programme_difference: finiteNumber.nullable(),
      })
      .strict(),
    component_table: z.array(costComponentRowSchema),
    programme_table: z.array(costComponentRowSchema),
    comparison_table: z.array(costComparisonRowSchema).nullable(),
    programme_comparison: z
      .object({
        title: z.string(),
        new_treatment_name: z.string(),
        new_treatment_patients: z.number().int().nonnegative(),
        comparator_name: z.string(),
        comparator_patients: z.number().int().nonnegative(),
        rows: z.array(costComparisonRowSchema),
      })
      .strict()
      .nullable(),
    component_chart: calculatorChartSchema,
    comparison_chart: calculatorChartSchema.nullable(),
  })
  .strict();

const currentTreatmentSchema = z
  .object({
    name: requiredText,
    drug_price: nonNegativeNumber,
    extra_care_cost: nonNegativeNumber,
    savings: nonNegativeNumber,
  })
  .strict();

export const budgetImpactRequestSchema = z
  .object({
    perspective: requiredText,
    time_horizon: z.union([z.literal(3), z.literal(5)]),
    drug_name: requiredText,
    indication: requiredText,
    currency: requiredText,
    annual_drug_cost_per_patient: nonNegativeNumber,
    administration_and_monitoring: nonNegativeNumber,
    expected_ae_cost: nonNegativeNumber,
    offsets: nonNegativeNumber,
    wastage_percent: percentage,
    current_treatment: currentTreatmentSchema,
    hospital_beds: z.number().int().positive(),
    bed_occupancy_percent: percentage,
    prevalence_percent: percentage,
    diagnosis_rate_percent: percentage,
    eligibility_percent: percentage,
    average_length_of_stay_days: positiveNumber,
    annual_population_growth_percent: finiteNumber.min(-100).max(100),
    annual_inflation_percent: finiteNumber.min(-100).max(100),
    uptake_percent: z.array(percentage),
    conservative_uptake_multiplier: nonNegativeNumber,
    optimistic_uptake_multiplier: nonNegativeNumber,
    conservative_cost_increase_percent: percentage,
    optimistic_cost_decrease_percent: percentage,
    notes: z.string(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.uptake_percent.length !== value.time_horizon) {
      context.addIssue({
        code: "custom",
        path: ["uptake_percent"],
        message: `Enter exactly ${value.time_horizon} annual uptake values.`,
      });
    }
  });

const budgetImpactYearSchema = z
  .object({
    year: z.number().int().positive(),
    eligible_population: z.number().int().nonnegative(),
    new_treatment_patients: z.number().int().nonnegative(),
    current_treatment_patients: z.number().int().nonnegative(),
    uptake_percent: finiteNumber,
    new_treatment_cost_per_patient: finiteNumber,
    current_treatment_cost_per_patient: finiteNumber,
    per_patient_delta: finiteNumber,
    baseline_spend: finiteNumber,
    scenario_spend: finiteNumber,
    annual_budget_impact: finiteNumber,
    cumulative_budget_impact: finiteNumber,
  })
  .strict();

const budgetScenarioSchema = z
  .object({
    name: z.enum(["conservative", "base", "optimistic"]),
    annual_budget_impact: z.array(finiteNumber),
    cumulative_budget_impact: finiteNumber,
  })
  .strict();

const budgetSensitivitySchema = z
  .object({
    parameter: z.string(),
    low: finiteNumber,
    base: finiteNumber,
    high: finiteNumber,
    impact_range: finiteNumber,
  })
  .strict();

export const budgetImpactResponseSchema = z
  .object({
    currency: requiredText,
    perspective: requiredText,
    drug_name: requiredText,
    indication: requiredText,
    current_treatment_name: requiredText,
    time_horizon: z.union([z.literal(3), z.literal(5)]),
    year_1_eligible_population: z.number().int().nonnegative(),
    final_year_new_treatment_patients: z.number().int().nonnegative(),
    final_year_new_treatment_cost: finiteNumber,
    base_per_patient_costs: z
      .object({
        new_treatment: finiteNumber,
        current_treatment: finiteNumber,
        delta: finiteNumber,
      })
      .strict(),
    annual_budget_impact: z.array(finiteNumber),
    cumulative_budget_impact: finiteNumber,
    years: z.array(budgetImpactYearSchema),
    scenarios: z.array(budgetScenarioSchema).length(3),
    sensitivity: z.array(budgetSensitivitySchema),
    assumptions: z.array(
      z.object({ name: z.string(), value: z.string() }).strict(),
    ),
    chart_data: z.array(calculatorChartSchema),
    notes: z.string().nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const expectedLength = value.time_horizon;
    const scenarioNames = new Set(value.scenarios.map((scenario) => scenario.name));

    if (value.years.length !== expectedLength) {
      context.addIssue({
        code: "custom",
        path: ["years"],
        message: `Expected ${expectedLength} annual result rows.`,
      });
    }

    if (value.annual_budget_impact.length !== expectedLength) {
      context.addIssue({
        code: "custom",
        path: ["annual_budget_impact"],
        message: `Expected ${expectedLength} annual budget-impact values.`,
      });
    }

    value.scenarios.forEach((scenario, index) => {
      if (scenario.annual_budget_impact.length !== expectedLength) {
        context.addIssue({
          code: "custom",
          path: ["scenarios", index, "annual_budget_impact"],
          message: `Expected ${expectedLength} annual scenario values.`,
        });
      }
    });

    for (const name of ["conservative", "base", "optimistic"] as const) {
      if (!scenarioNames.has(name)) {
        context.addIssue({
          code: "custom",
          path: ["scenarios"],
          message: `Missing the ${name} scenario.`,
        });
      }
    }
  });

export const dailyMedSuggestionRequestSchema = z
  .object({
    drug: requiredText,
    indication: requiredText,
    category: requiredText,
    patient_weight: positiveNumber,
    frequency: requiredText,
    duration: requiredText,
    model: requiredText.optional(),
  })
  .strict();

const dailyMedSuggestionsSchema = z
  .object({
    indication: z.string(),
    dose: positiveNumber,
    dose_type: z.enum(["fixed", "weight_based"]),
    patient_weight: positiveNumber.nullable(),
    times_per_day: positiveNumber.nullable(),
    days_per_year: positiveNumber.max(366).nullable(),
    frequency: z.string(),
    route: z.string(),
    treatment_schedule: z.string(),
    presentation: z.string(),
    unit_size: positiveNumber.nullable(),
  })
  .strict();

export const dailyMedSuggestionResponseSchema = z
  .object({
    indication_match: z.enum(["exact", "close", "none"]),
    indication_match_note: z.string(),
    matched_labeled_indication: z.string().nullable(),
    suggestions: dailyMedSuggestionsSchema.nullable(),
    source: z
      .object({
        set_id: z.string(),
        title: z.string(),
        url: z.string().url(),
        section: z.string(),
        accessed_at: z.string().datetime({ offset: true }),
      })
      .strict(),
    warnings: z.array(z.string()),
  })
  .strict();

export type DosingRequest = z.infer<typeof dosingRequestSchema>;
export type DosingResponse = z.infer<typeof dosingResponseSchema>;
export type CostAnalysisRequest = z.infer<typeof costAnalysisRequestSchema>;
export type CostAnalysisResponse = z.infer<typeof costAnalysisResponseSchema>;
export type BudgetImpactRequest = z.infer<typeof budgetImpactRequestSchema>;
export type BudgetImpactResponse = z.infer<typeof budgetImpactResponseSchema>;
export type DailyMedSuggestionRequest = z.infer<
  typeof dailyMedSuggestionRequestSchema
>;
export type DailyMedSuggestionResponse = z.infer<
  typeof dailyMedSuggestionResponseSchema
>;
