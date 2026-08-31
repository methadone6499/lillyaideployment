import {
  DOSAGE_CALCULATOR_CATEGORY_STANDARD_WEIGHT_KG,
  DOSAGE_CALCULATOR_CATEGORY_WEIGHT_DISCLOSURE,
  DOSAGE_CALCULATOR_PHASE_LABELS,
  DOSAGE_CALCULATOR_POPULATION_TO_CATEGORY,
  type DosageCalculatorPhaseLabelKey,
  type DosageCalculatorPopulationSlug,
} from "../constants/dosageCalculatorOptions";
import type { DosageCalculatorIndicationMatch } from "../schemas/dosageCalculatorSchemas";
import type { DosageCalculatorSubmittedInputViewModel } from "./mapDosageCalculatorRequest";

export type DosageSnapshotRow = {
  label: string;
  value: string;
};

export type DosageIndicationMatchNotice = {
  tone: "success" | "warning";
  title: string;
  body: string;
};

export const DOSAGE_SNAPSHOT_NOT_SENT = "Not sent";

function isPopulationSlug(
  value: string,
): value is DosageCalculatorPopulationSlug {
  return Object.hasOwn(DOSAGE_CALCULATOR_POPULATION_TO_CATEGORY, value);
}

function formatCategoryDerivedStandardWeight(
  standardWeightKg: number,
  category: string,
): string {
  return `${standardWeightKg} kg (derived from ${category})`;
}

function formatPatientVolume(patientVolume: number | undefined): string {
  return patientVolume == null
    ? DOSAGE_SNAPSHOT_NOT_SENT
    : String(patientVolume);
}

export function getCategoryWeightHelper(population: string): string {
  if (isPopulationSlug(population)) {
    const category = DOSAGE_CALCULATOR_POPULATION_TO_CATEGORY[population];
    const standardWeightKg =
      DOSAGE_CALCULATOR_CATEGORY_STANDARD_WEIGHT_KG[category];
    return `Standard weight for ${category}: ${standardWeightKg} kg. ${DOSAGE_CALCULATOR_CATEGORY_WEIGHT_DISCLOSURE}`;
  }

  return DOSAGE_CALCULATOR_CATEGORY_WEIGHT_DISCLOSURE;
}

export function getDosagePhaseLabel(phase: string): string {
  if (Object.hasOwn(DOSAGE_CALCULATOR_PHASE_LABELS, phase)) {
    return DOSAGE_CALCULATOR_PHASE_LABELS[phase as DosageCalculatorPhaseLabelKey];
  }

  return phase;
}

export function getIndicationMatchNotice(
  match: DosageCalculatorIndicationMatch,
): DosageIndicationMatchNotice {
  if (match === "exact") {
    return {
      tone: "success",
      title: "Indication matched",
      body: "The submitted indication was found on the label.",
    };
  }

  return {
    tone: "warning",
    title: "Indication not on label",
    body: "The submitted indication was not found on the label. The table uses fallback labeled dosing.",
  };
}

export function getAppliedSnapshotRows(
  applied: DosageCalculatorSubmittedInputViewModel["applied"],
): DosageSnapshotRow[] {
  return [
    { label: "Drug", value: applied.drug },
    { label: "Indication", value: applied.indication },
    { label: "Patient category", value: applied.category },
    {
      label: "Standard weight",
      value: formatCategoryDerivedStandardWeight(
        applied.standardWeightKg,
        applied.category,
      ),
    },
    { label: "Frequency", value: applied.frequency },
    { label: "Duration", value: applied.duration },
    { label: "Currency", value: applied.currency },
    {
      label: "Unit price",
      value: `${applied.currency} ${applied.unitPrice}`,
    },
    {
      label: "Patient volume",
      value: formatPatientVolume(applied.patientVolume),
    },
  ];
}
