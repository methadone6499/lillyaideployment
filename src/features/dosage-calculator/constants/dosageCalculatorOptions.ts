export type DosageCalculatorOption = {
  value: string;
  label: string;
};

/** Documented API `category` values that have a standard mg/kg weight. */
export const DOSAGE_CALCULATOR_CATEGORY_VALUES = [
  "Adult",
  "Adolescent",
  "Child 6–12",
  "Child 2–5",
  "Infant",
] as const;

export type DosageCalculatorCategory =
  (typeof DOSAGE_CALCULATOR_CATEGORY_VALUES)[number];

export const DOSAGE_CALCULATOR_POPULATION_SLUGS = [
  "adult",
  "adolescent",
  "child-6-12",
  "child-2-5",
  "infant",
] as const;

export type DosageCalculatorPopulationSlug =
  (typeof DOSAGE_CALCULATOR_POPULATION_SLUGS)[number];

export const DOSAGE_CALCULATOR_POPULATION_TO_CATEGORY = {
  adult: "Adult",
  adolescent: "Adolescent",
  "child-6-12": "Child 6–12",
  "child-2-5": "Child 2–5",
  infant: "Infant",
} as const satisfies Record<
  DosageCalculatorPopulationSlug,
  DosageCalculatorCategory
>;

export const DOSAGE_CALCULATOR_CATEGORY_STANDARD_WEIGHT_KG = {
  Adult: 70,
  Adolescent: 50,
  "Child 6–12": 30,
  "Child 2–5": 15,
  Infant: 8,
} as const satisfies Record<DosageCalculatorCategory, number>;

/** Backend default for omitted `patient_volume`. */
export const DOSAGE_CALCULATOR_DEFAULT_PATIENT_VOLUME = 30;

/**
 * Backend disclosure for mg/kg labels. Copied from the dosage-calculator
 * contract so the submitted-input view model can show what the API applies.
 */
export const DOSAGE_CALCULATOR_CATEGORY_WEIGHT_DISCLOSURE =
  "Patient categories map to standard weights when the label is mg/kg: adult 70 kg, adolescent 50 kg, child 6–12 30 kg, child 2–5 15 kg, infant 8 kg.";

export const DOSAGE_CALCULATOR_CATEGORY_OPTIONS = [
  { value: "adult", label: "Adult" },
  { value: "adolescent", label: "Adolescent" },
  { value: "child-6-12", label: "Child 6–12" },
  { value: "child-2-5", label: "Child 2–5" },
  { value: "infant", label: "Infant" },
] as const satisfies readonly DosageCalculatorOption[];

/**
 * API `frequency` is free text. These documented schedules feed a
 * browser-native suggestion list; the suggestion menu cannot be styled.
 */
export const DOSAGE_CALCULATOR_FREQUENCY_OPTIONS = [
  { value: "once daily", label: "Once daily" },
  { value: "twice daily", label: "Twice daily" },
  { value: "once weekly", label: "Once weekly" },
  { value: "once every 4 weeks", label: "Once every 4 weeks" },
  { value: "once every 4 months", label: "Once every 4 months" },
] as const satisfies readonly DosageCalculatorOption[];

export const DOSAGE_CALCULATOR_DURATION_UNIT_VALUES = [
  "days",
  "weeks",
  "months",
  "years",
] as const;

export type DosageCalculatorDurationUnit =
  (typeof DOSAGE_CALCULATOR_DURATION_UNIT_VALUES)[number];

export const DOSAGE_CALCULATOR_DURATION_UNIT_OPTIONS = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
] as const satisfies readonly DosageCalculatorOption[];

export const DOSAGE_CALCULATOR_CURRENCY_CODES = [
  "USD",
  "SAR",
  "AED",
  "GBP",
  "EUR",
] as const;

export type DosageCalculatorCurrencyCode =
  (typeof DOSAGE_CALCULATOR_CURRENCY_CODES)[number];

/** Select sentinel; never send this value as `currency`. */
export const DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE = "other" as const;

export const DOSAGE_CALCULATOR_CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "SAR", label: "SAR" },
  { value: "AED", label: "AED" },
  { value: "GBP", label: "GBP" },
  { value: "EUR", label: "EUR" },
  {
    value: DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE,
    label: "Other currency",
  },
] as const satisfies readonly DosageCalculatorOption[];

export const DOSAGE_CALCULATOR_ACTIVE_PROGRESS_PHASES = [
  "queued",
  "label",
  "extract",
  "calculate",
] as const;

export const DOSAGE_CALCULATOR_PHASE_LABELS = {
  queued: "Queued",
  label: "Downloading label",
  extract: "Extracting labeled dosing",
  calculate: "Calculating costs",
  done: "Complete",
} as const;

export type DosageCalculatorPhaseLabelKey =
  keyof typeof DOSAGE_CALCULATOR_PHASE_LABELS;
