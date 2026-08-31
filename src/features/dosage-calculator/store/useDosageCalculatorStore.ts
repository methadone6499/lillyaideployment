"use client";

import { create } from "zustand";

export type DosageCalculatorFormValues = {
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
};

export type DosageCalculatorTextField = keyof DosageCalculatorFormValues;

type DosageCalculatorStore = DosageCalculatorFormValues & {
  setField: (field: DosageCalculatorTextField, value: string) => void;
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
  };
}

export const useDosageCalculatorStore = create<DosageCalculatorStore>()(
  (set) => ({
    ...EMPTY_DOSAGE_CALCULATOR_FORM,
    setField: (field, value) => set({ [field]: value }),
    resetForm: () => set({ ...EMPTY_DOSAGE_CALCULATOR_FORM }),
  }),
);
