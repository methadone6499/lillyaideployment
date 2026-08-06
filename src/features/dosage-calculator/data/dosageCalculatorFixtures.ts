export type DosageCalculatorOption = {
  value: string;
  label: string;
};

/**
 * Visual placeholders copied from the Figma input state. They are not initial
 * values, approved product data, or a complete production option contract.
 */
export const DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS = {
  drug: "Tirzepatide",
  indication: "Type 2 Diabetes",
  age: "56",
  weight: "84",
  region: "Saudi Arabia",
  population: "Adult",
  treatmentDuration: "52",
} as const;

/**
 * Temporary single-option fixtures. Replace these when the product supplies
 * complete indication, region, and population datasets.
 */
export const TEMPORARY_FIGMA_INDICATION_OPTIONS = [
  {
    value: "type-2-diabetes",
    label: DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.indication,
  },
] as const satisfies readonly DosageCalculatorOption[];

export const TEMPORARY_FIGMA_REGION_OPTIONS = [
  {
    value: "saudi-arabia",
    label: DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.region,
  },
] as const satisfies readonly DosageCalculatorOption[];

export const TEMPORARY_FIGMA_POPULATION_OPTIONS = [
  {
    value: "adult",
    label: DOSAGE_CALCULATOR_FIGMA_PLACEHOLDERS.population,
  },
] as const satisfies readonly DosageCalculatorOption[];

export const DOSAGE_RENAL_FUNCTION_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "mild-impairment", label: "Mild Impairment" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
  { value: "dialysis", label: "Dialysis" },
] as const satisfies readonly DosageCalculatorOption[];

export const DOSAGE_HEPATIC_FUNCTION_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "mild-child-pugh-a", label: "Mild (Child-Pugh A)" },
  { value: "moderate-b", label: "Moderate (B)" },
  { value: "severe-c", label: "Severe (C)" },
] as const satisfies readonly DosageCalculatorOption[];

export const DOSAGE_RISK_FLAG_OPTIONS = [
  { value: "pregnantOrPlanning", label: "Pregnant or planning" },
  { value: "concomitantInsulin", label: "Concomitant insulin" },
] as const;

export type DosagePreviewScheduleRow = {
  week: string;
  dose: string;
  route: string;
  notes: string;
};

export type DosagePreviewSafetyFlag = {
  severity: "warning" | "danger";
  title: string;
  description: string;
};

export type DosagePreviewEconomicMetric = {
  label: string;
  value: string;
};

export type DosageResultPreviewFixture = {
  recommendation: {
    status: string;
    subtitle: string;
    initialTitration: {
      label: string;
      dose: string;
      administration: string;
      guidance: string;
    };
    schedule: readonly DosagePreviewScheduleRow[];
  };
  safetyFlags: readonly DosagePreviewSafetyFlag[];
  economicImpact: {
    subtitle: string;
    metrics: readonly DosagePreviewEconomicMetric[];
  };
  disclaimer: string;
};

/**
 * Static Figma-only UI preview data for development and visual verification.
 * This is not an API response and is not a recommendation calculated from the
 * form inputs. Replace or disable it before production calculation integration.
 */
export const DOSAGE_RESULT_PREVIEW_FIXTURE = {
  recommendation: {
    status: "Within label",
    subtitle: "Guideline-aligned · AI-validated",
    initialTitration: {
      label: "Initial titration",
      dose: "2.5 mg",
      administration: "once weekly, SC",
      guidance:
        "Increase by 2.5 mg every 4 weeks · to tolerated maintenance dose",
    },
    schedule: [
      {
        week: "1 – 4",
        dose: "2.5 mg",
        route: "SC, weekly",
        notes: "Initiation: not for glycemic control",
      },
      {
        week: "5 – 8",
        dose: "5.0 mg",
        route: "SC, weekly",
        notes: "Therapeutic dose",
      },
      {
        week: "9 – 12",
        dose: "7.5 mg",
        route: "SC, weekly",
        notes: "If additional glycemic control needed",
      },
      {
        week: "13+",
        dose: "10 – 15 mg",
        route: "SC, weekly",
        notes: "Max maintenance · titrate to response",
      },
    ],
  },
  safetyFlags: [
    {
      severity: "warning",
      title: "Gastrointestinal effects expected",
      description:
        "Nausea, vomiting reported in 12–22% during titration. Slow titration recommended.",
    },
    {
      severity: "warning",
      title: "Severe renal impairment - limited data",
      description: "Use with caution if eGFR <30 mL/min/1.73m².",
    },
    {
      severity: "danger",
      title: "Contraindicated: MTC / MEN-2 history",
      description:
        "Confirm absence of personal/family history of medullary thyroid carcinoma before initiation.",
    },
  ],
  economicImpact: {
    subtitle: "Optional - feeds into report Cost Analysis",
    metrics: [
      { label: "Annual drug cost", value: "£2,648" },
      { label: "Cost per kg lost", value: "£236" },
      { label: "Cost per 1% HbA1c", value: "£1,151" },
    ],
  },
  disclaimer:
    "LillyAI provides decision-support outputs only. Recommendations must be reviewed by a qualified clinician and adapted to individual patient context. Not a substitute for medical judgment.",
} as const satisfies DosageResultPreviewFixture;
