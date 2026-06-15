"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FilterState, WizardStep } from "../types";

export const DEFAULT_FILTERS: FilterState = {
  timeRange: "last-1-year",
  clinicalStudyTypes: [
    "rcts",
    "phase-ii",
    "observational",
    "cohort",
  ],
  evidenceSynthesis: "",
  specializedTrialStructures: "",
  populationType: "",
  studyDuration: "",
  economicStudyTypes: ["cost-effectiveness", "resource-utilization"],
  costPopulationType: "",
  patientRange: "",
  costPopulationTypeSecondary: "",
  costStudyDuration: "",
  averageWeight: "",
  genderDistribution: "",
  treatmentDuration: "",
  dosageFrequency: "",
  regionPricingMarket: "",
  outcomeEvidenceFocus: "",
  geographyRegulatoryRegion: "",
  evidenceQuality: "",
  comparatorType: "",
};

type ReportWizardState = {
  currentStep: WizardStep;
  drugName: string;
  indications: string;
  filters: FilterState;
  selectedEvidenceIds: string[];
  selectedComparatorIds: string[];
  customComparators: string[];
  selectedSectionIds: string[];
  customSections: string[];
  generationJobId: string | null;
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setDrugName: (name: string) => void;
  setIndications: (indications: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  toggleClinicalStudyType: (type: string) => void;
  toggleEconomicStudyType: (type: string) => void;
  setSelectedEvidenceIds: (ids: string[]) => void;
  toggleEvidenceId: (id: string) => void;
  toggleComparatorId: (id: string) => void;
  addCustomComparator: (name: string) => void;
  toggleSectionId: (id: string) => void;
  selectAllSections: (ids: string[]) => void;
  deselectAllSections: () => void;
  setGenerationJobId: (jobId: string | null) => void;
  resetWizard: () => void;
};

const initialState = {
  currentStep: 1 as WizardStep,
  drugName: "",
  indications: "",
  filters: DEFAULT_FILTERS,
  selectedEvidenceIds: [] as string[],
  selectedComparatorIds: [] as string[],
  customComparators: [] as string[],
  selectedSectionIds: [
    "disease-overview",
    "drug-overview",
    "clinical-evidence",
    "economic-evidence",
    "competitor-analysis",
    "hta-summary",
    "executive-summary",
  ],
  customSections: [] as string[],
  generationJobId: null as string | null,
};

export const useReportWizardStore = create<ReportWizardState>()(
  persist(
    (set) => ({
      ...initialState,
      setStep: (step) => set({ currentStep: step }),
      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(6, state.currentStep + 1) as WizardStep,
        })),
      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(1, state.currentStep - 1) as WizardStep,
        })),
      setDrugName: (drugName) => set({ drugName }),
      setIndications: (indications) => set({ indications }),
      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),
      toggleClinicalStudyType: (type) =>
        set((state) => {
          const types = state.filters.clinicalStudyTypes;
          const next = types.includes(type)
            ? types.filter((t) => t !== type)
            : [...types, type];
          return {
            filters: { ...state.filters, clinicalStudyTypes: next },
          };
        }),
      toggleEconomicStudyType: (type) =>
        set((state) => {
          const types = state.filters.economicStudyTypes;
          const next = types.includes(type)
            ? types.filter((t) => t !== type)
            : [...types, type];
          return {
            filters: { ...state.filters, economicStudyTypes: next },
          };
        }),
      setSelectedEvidenceIds: (selectedEvidenceIds) =>
        set({ selectedEvidenceIds }),
      toggleEvidenceId: (id) =>
        set((state) => {
          const selected = state.selectedEvidenceIds;
          const next = selected.includes(id)
            ? selected.filter((item) => item !== id)
            : [...selected, id];
          return { selectedEvidenceIds: next };
        }),
      toggleComparatorId: (id) =>
        set((state) => {
          const selected = state.selectedComparatorIds;
          const next = selected.includes(id)
            ? selected.filter((item) => item !== id)
            : [...selected, id];
          return { selectedComparatorIds: next };
        }),
      addCustomComparator: (name) =>
        set((state) => ({
          customComparators: [...state.customComparators, name],
          selectedComparatorIds: [
            ...state.selectedComparatorIds,
            `custom-${name}`,
          ],
        })),
      toggleSectionId: (id) =>
        set((state) => {
          const selected = state.selectedSectionIds;
          const next = selected.includes(id)
            ? selected.filter((item) => item !== id)
            : [...selected, id];
          return { selectedSectionIds: next };
        }),
      selectAllSections: (ids) => set({ selectedSectionIds: ids }),
      deselectAllSections: () => set({ selectedSectionIds: [] }),
      setGenerationJobId: (generationJobId) => set({ generationJobId }),
      resetWizard: () => set(initialState),
    }),
    {
      name: "report-wizard-storage",
      partialize: (state) => ({
        currentStep: state.currentStep,
        drugName: state.drugName,
        indications: state.indications,
        filters: state.filters,
        selectedEvidenceIds: state.selectedEvidenceIds,
        selectedComparatorIds: state.selectedComparatorIds,
        customComparators: state.customComparators,
        selectedSectionIds: state.selectedSectionIds,
        customSections: state.customSections,
        generationJobId: state.generationJobId,
      }),
    },
  ),
);

export const WIZARD_STEPS = [
  { step: 1, label: "Drug Intake" },
  { step: 2, label: "Filters" },
  { step: 3, label: "Evidence" },
  { step: 4, label: "Comparators" },
  { step: 5, label: "Sections" },
  { step: 6, label: "Generate" },
] as const;
