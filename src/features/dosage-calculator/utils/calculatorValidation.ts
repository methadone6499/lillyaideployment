import { z } from "zod";

const FIELD_LABELS: Record<string, string> = {
  drug: "drug name", drug_name: "drug name", indication: "indication",
  category: "patient category", dosage_form: "dosage form", drug_class: "drug class",
  currency: "currency", frequency: "planned frequency", duration: "planned duration",
  unit_cost: "unit cost", unit_size: "unit size", dose: "dose",
  times_per_day: "times per day", days_per_year: "days per year",
  dose_type: "dose type", patient_weight: "patient weight", wastage_percent: "wastage percentage",
  drug_acquisition: "annual drug cost per patient", administration: "administration cost",
  monitoring: "monitoring cost", laboratory_diagnostics: "lab and diagnostics cost",
  outpatient_visits: "outpatient visits cost", adverse_event_management: "adverse event management cost",
  adverse_event_rate_percent: "adverse event rate", hospitalizations: "hospitalization cost",
  other_direct_costs: "other direct costs", hospitalization_avoidance: "hospitalization savings",
  other_offsets: "other offsets", new_drug_patient_count: "new-treatment patient count",
  "comparator.name": "comparator name", "comparator.annual_drug_cost": "comparator annual drug cost",
  "comparator.administration_and_monitoring": "comparator administration and monitoring cost",
  "comparator.offsets": "comparator offsets", "comparator.patient_count": "comparator patient count",
  perspective: "perspective", time_horizon: "time horizon",
  annual_drug_cost_per_patient: "annual drug cost per patient",
  administration_and_monitoring: "administration and monitoring cost", expected_ae_cost: "expected adverse event cost",
  offsets: "offsets", "current_treatment.name": "current treatment name",
  "current_treatment.drug_price": "current treatment drug price",
  "current_treatment.extra_care_cost": "current treatment extra care cost",
  "current_treatment.savings": "current treatment savings", hospital_beds: "hospital bed count",
  bed_occupancy_percent: "bed occupancy", prevalence_percent: "prevalence",
  diagnosis_rate_percent: "diagnosis rate", eligibility_percent: "eligibility",
  average_length_of_stay_days: "average length of stay",
  annual_population_growth_percent: "annual population growth", annual_inflation_percent: "annual inflation",
  uptake_percent: "annual uptake", conservative_uptake_multiplier: "conservative uptake multiplier",
  optimistic_uptake_multiplier: "optimistic uptake multiplier",
  conservative_cost_increase_percent: "conservative cost increase",
  optimistic_cost_decrease_percent: "optimistic cost decrease",
};

function fieldLabel(path: readonly PropertyKey[]): string | undefined {
  const parts = path.filter((part) => part !== "body");
  if (parts[0] === "uptake_percent" && typeof parts[1] === "number") {
    return `Year ${parts[1] + 1} uptake`;
  }
  return FIELD_LABELS[parts.map(String).join(".")] ?? FIELD_LABELS[String(parts.at(-1))];
}

export function getCalculatorValidationMessage(error: z.ZodError): string {
  const messages = error.issues.map((issue) => {
    const label = fieldLabel(issue.path);
    if (!label) return "Check the calculation inputs and try again.";
    if (issue.code === "too_small") {
      if (issue.origin === "string") return `Enter the ${label}.`;
      return `Enter a ${label} ${issue.inclusive ? "of at least" : "greater than"} ${String(issue.minimum)}.`;
    }
    if (issue.code === "too_big") return `Enter a ${label} ${issue.inclusive ? "of no more than" : "less than"} ${String(issue.maximum)}.`;
    if (issue.code === "invalid_type") {
      if (issue.expected === "int") return `Enter a whole number for ${label}.`;
      return issue.expected === "number" ? `Enter a number for ${label}.` : `Enter the ${label}.`;
    }
    if (issue.code === "invalid_value" || issue.code === "invalid_union") return `Choose a valid ${label}.`;
    if (issue.code === "invalid_format" && issue.path.at(-1) === "currency") return "Enter a three-letter currency code, such as USD.";
    if (issue.path[0] === "uptake_percent") return "Enter one uptake percentage for each year in the selected time horizon.";
    if (issue.path[0] === "patient_weight") return "Enter a patient weight greater than 0 kg for weight-based dosing.";
    return `Check the ${label} and try again.`;
  });
  return [...new Set(messages)].slice(0, 3).join(" ");
}

const apiIssueSchema = z.object({
  loc: z.array(z.union([z.string(), z.number()])),
  type: z.string(),
  ctx: z.object({ gt: z.number().optional(), ge: z.number().optional(), lt: z.number().optional(), le: z.number().optional() }).optional(),
});
const apiErrorSchema = z.object({ detail: z.unknown().optional(), details: z.unknown().optional() });

export function getCalculatorApiValidationMessages(body: unknown): string[] {
  const envelope = apiErrorSchema.safeParse(body);
  if (!envelope.success) return [];
  const issues = apiIssueSchema.array().safeParse(envelope.data.detail ?? envelope.data.details);
  if (!issues.success) return [];
  return [...new Set(issues.data.map((issue) => {
    const label = fieldLabel(issue.loc);
    if (!label) return "Check the calculation inputs and try again.";
    if (["missing", "string_too_short"].includes(issue.type)) return `Enter the ${label}.`;
    if (issue.type === "int_from_float" || issue.type === "int_parsing") return `Enter a whole number for ${label}.`;
    if (["float_parsing", "float_type", "finite_number", "int_type"].includes(issue.type)) return `Enter a number for ${label}.`;
    if (issue.type === "greater_than" && issue.ctx?.gt !== undefined) return `Enter a ${label} greater than ${issue.ctx.gt}.`;
    if (issue.type === "greater_than_equal" && issue.ctx?.ge !== undefined) return `Enter a ${label} of at least ${issue.ctx.ge}.`;
    if (issue.type === "less_than" && issue.ctx?.lt !== undefined) return `Enter a ${label} less than ${issue.ctx.lt}.`;
    if (issue.type === "less_than_equal" && issue.ctx?.le !== undefined) return `Enter a ${label} of no more than ${issue.ctx.le}.`;
    return `Check the ${label} and try again.`;
  }))].slice(0, 3);
}

export function getCalculatorFieldError(input: HTMLInputElement, label: string): string | null {
  const { validity, min, max, step } = input;
  if (validity.valid) return null;
  if (validity.badInput) return `Enter a number for ${label.toLowerCase()}.`;
  if (validity.valueMissing) return `Enter the ${label.toLowerCase()}.`;
  if (validity.patternMismatch) return `Enter a value for ${label.toLowerCase()}.`;
  if (validity.rangeUnderflow) return `Enter a value of at least ${min}.`;
  if (validity.rangeOverflow) return `Enter a value of no more than ${max}.`;
  if (validity.stepMismatch && step === "1") return "Enter a whole number.";
  return `Enter a valid value for ${label.toLowerCase()}.`;
}
