"use client";

import { create } from "zustand";

export type DosageCalculatorResultView = "hidden" | "preview";

export type DosageCalculatorFormValues = {
  drug: string;
  indication: string;
  age: string;
  weight: string;
  region: string;
  population: string;
  renalFunction: string;
  hepaticFunction: string;
  treatmentDuration: string;
  pregnantOrPlanning: boolean;
  concomitantInsulin: boolean;
};

export type DosageCalculatorTextField = Exclude<
  keyof DosageCalculatorFormValues,
  "pregnantOrPlanning" | "concomitantInsulin"
>;

export type DosageCalculatorRiskFlag =
  | "pregnantOrPlanning"
  | "concomitantInsulin";

type DosageCalculatorStore = DosageCalculatorFormValues & {
  resultView: DosageCalculatorResultView;
  setField: (field: DosageCalculatorTextField, value: string) => void;
  setRiskFlag: (field: DosageCalculatorRiskFlag, checked: boolean) => void;
  showResultPreview: () => void;
  hideResultPreview: () => void;
  resetForm: () => void;
};

export const EMPTY_DOSAGE_CALCULATOR_FORM: DosageCalculatorFormValues = {
  drug: "",
  indication: "",
  age: "",
  weight: "",
  region: "",
  population: "",
  renalFunction: "",
  hepaticFunction: "",
  treatmentDuration: "",
  pregnantOrPlanning: false,
  concomitantInsulin: false,
};

export const useDosageCalculatorStore = create<DosageCalculatorStore>()(
  (set) => ({
    ...EMPTY_DOSAGE_CALCULATOR_FORM,
    resultView: "hidden",
    setField: (field, value) =>
      set({
        [field]: value,
        resultView: "hidden",
      }),
    setRiskFlag: (field, checked) =>
      set({
        [field]: checked,
        resultView: "hidden",
      }),
    showResultPreview: () => set({ resultView: "preview" }),
    hideResultPreview: () => set({ resultView: "hidden" }),
    resetForm: () =>
      set({
        ...EMPTY_DOSAGE_CALCULATOR_FORM,
        resultView: "hidden",
      }),
  }),
);
