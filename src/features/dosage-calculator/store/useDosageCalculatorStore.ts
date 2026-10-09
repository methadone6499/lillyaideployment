"use client";

import { create } from "zustand";
import {
  EMPTY_STRUCTURED_COST_ANALYSIS_FORM,
  pickStructuredCostAnalysisFormValues,
  type StructuredCostAnalysisFormValues,
} from "../utils/structuredCostAnalysis";

export type DosageCalculatorFormValues = StructuredCostAnalysisFormValues & {
  drug: string;
  indication: string;
  population: string;
  frequency: string;
  treatmentDuration: string;
  durationUnit: string;
  currency: string;
  customCurrency: string;
  unitPrice: string;
  patientVolume: string;
  includeCostAnalysis: boolean;
};

export type DosageCalculatorTextField = Exclude<
  keyof DosageCalculatorFormValues,
  "includeCostAnalysis"
>;

type DosageCalculatorStore = DosageCalculatorFormValues & {
  setField: (field: DosageCalculatorTextField, value: string) => void;
  setIncludeCostAnalysis: (enabled: boolean) => void;
  resetForm: () => void;
};

export const EMPTY_DOSAGE_CALCULATOR_FORM: DosageCalculatorFormValues = {
  drug: "",
  indication: "",
  population: "",
  frequency: "",
  treatmentDuration: "",
  durationUnit: "",
  currency: "",
  customCurrency: "",
  unitPrice: "",
  patientVolume: "",
  includeCostAnalysis: false,
  ...EMPTY_STRUCTURED_COST_ANALYSIS_FORM,
};

export function selectDosageCalculatorFormValues(
  state: DosageCalculatorFormValues,
): DosageCalculatorFormValues {
  return {
    drug: state.drug,
    indication: state.indication,
    population: state.population,
    frequency: state.frequency,
    treatmentDuration: state.treatmentDuration,
    durationUnit: state.durationUnit,
    currency: state.currency,
    customCurrency: state.customCurrency,
    unitPrice: state.unitPrice,
    patientVolume: state.patientVolume,
    includeCostAnalysis: state.includeCostAnalysis,
    ...pickStructuredCostAnalysisFormValues(state),
  };
}

export const useDosageCalculatorStore = create<DosageCalculatorStore>()(
  (set) => ({
    ...EMPTY_DOSAGE_CALCULATOR_FORM,
    setField: (field, value) => set({ [field]: value }),
    setIncludeCostAnalysis: (includeCostAnalysis) =>
      set({ includeCostAnalysis }),
    resetForm: () => set({ ...EMPTY_DOSAGE_CALCULATOR_FORM }),
  }),
);
