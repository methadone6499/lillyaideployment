"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SECTION_IDS } from "../constants/reportSections";
import type { FilterState, SectionType, WizardStep } from "../types";

export { DEFAULT_SECTION_IDS };

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
  geographyRegulatoryRegion: "gcc-middle-east",
  evidenceQuality: "",
  comparatorType: "",
};

const LEGACY_SECTION_ID_MAP: Record<string, SectionType> = {
  "disease-overview": "disease",
  "drug-overview": "drug",
  "clinical-evidence": "clinical",
  "economic-evidence": "economic",
  "competitor-analysis": "comparator",
  "hta-summary": "hta",
  "executive-summary": "executive",
};

type PersistedWizardState = {
  currentStep?: WizardStep;
  drugName?: string;
  indications?: string;
  filters?: FilterState;
  reportId?: string | null;
  selectedClinicalPmcids?: string[];
  selectedEconomicPmcids?: string[];
  selectedComparators?: string[];
  customComparators?: string[];
  selectedSectionIds?: string[];
  customSections?: string[];
  generationJobId?: string | null;
  userId?: string | null;
  selectedEvidenceIds?: string[];
  selectedComparatorIds?: string[];
};

type ReportWizardState = {
  currentStep: WizardStep;
  drugName: string;
  indications: string;
  filters: FilterState;
  reportId: string | null;
  selectedClinicalPmcids: string[];
  selectedEconomicPmcids: string[];
  selectedComparators: string[];
  customComparators: string[];
  selectedSectionIds: SectionType[];
  customSections: string[];
  generationJobId: string | null;
  userId: string | null;
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setDrugName: (name: string) => void;
  setIndications: (indications: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  toggleClinicalStudyType: (type: string) => void;
  toggleEconomicStudyType: (type: string) => void;
  setReportId: (reportId: string | null) => void;
  setSelectedClinicalPmcids: (pmcids: string[]) => void;
  setSelectedEconomicPmcids: (pmcids: string[]) => void;
  toggleClinicalPmcid: (pmcid: string) => void;
  toggleEconomicPmcid: (pmcid: string) => void;
  toggleComparator: (name: string) => void;
  addCustomComparator: (name: string) => void;
  toggleSectionId: (id: SectionType) => void;
  selectAllSections: (ids: SectionType[]) => void;
  deselectAllSections: () => void;
  setGenerationJobId: (jobId: string | null) => void;
  setUserId: (userId: string | null) => void;
  resetReportPipeline: () => void;
  resetWizard: () => void;
};

const initialState = {
  currentStep: 1 as WizardStep,
  drugName: "",
  indications: "",
  filters: DEFAULT_FILTERS,
  reportId: null as string | null,
  selectedClinicalPmcids: [] as string[],
  selectedEconomicPmcids: [] as string[],
  selectedComparators: [] as string[],
  customComparators: [] as string[],
  selectedSectionIds: [...DEFAULT_SECTION_IDS],
  customSections: [] as string[],
  generationJobId: null as string | null,
  userId: null as string | null,
};

const reportPipelineState = {
  reportId: null as string | null,
  generationJobId: null as string | null,
  selectedClinicalPmcids: [] as string[],
  selectedEconomicPmcids: [] as string[],
  selectedComparators: [] as string[],
  customComparators: [] as string[],
};

function isSectionType(id: string): id is SectionType {
  return DEFAULT_SECTION_IDS.includes(id as SectionType);
}

function migrateLegacySectionIds(sectionIds: string[]): SectionType[] {
  const mapped = sectionIds
    .map((id) => LEGACY_SECTION_ID_MAP[id] ?? (isSectionType(id) ? id : null))
    .filter((id): id is SectionType => id !== null);

  return mapped.length > 0 ? [...new Set(mapped)] : [...DEFAULT_SECTION_IDS];
}

function migrateSelectedComparators(
  selectedComparatorIds: string[] | undefined,
  customComparators: string[] | undefined,
): string[] {
  if (!selectedComparatorIds) {
    return [];
  }

  return customComparators?.filter((name) =>
    selectedComparatorIds.includes(`custom-${name}`),
  ) ?? [];
}

function migratePersistedState(
  persisted: unknown,
  version: number,
): PersistedWizardState {
  let state = (persisted ?? {}) as PersistedWizardState;

  if (version < 1) {
    const migrated: PersistedWizardState = { ...state };

    migrated.reportId = state.reportId ?? null;

    if (state.selectedEvidenceIds) {
      migrated.selectedClinicalPmcids = [];
      migrated.selectedEconomicPmcids = [];
    }

    if (state.selectedComparatorIds || state.selectedEvidenceIds) {
      migrated.selectedComparators = migrateSelectedComparators(
        state.selectedComparatorIds,
        state.customComparators,
      );
    }

    if (state.selectedSectionIds) {
      const hasLegacySectionIds = state.selectedSectionIds.some(
        (id) => id in LEGACY_SECTION_ID_MAP || !isSectionType(id),
      );

      migrated.selectedSectionIds = hasLegacySectionIds
        ? migrateLegacySectionIds(state.selectedSectionIds)
        : state.selectedSectionIds;
    }

    delete migrated.selectedEvidenceIds;
    delete migrated.selectedComparatorIds;

    state = migrated;
  }

  if (version < 2) {
    state = {
      ...state,
      userId: state.userId ?? null,
    };
  }

  return state;
}

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
      setReportId: (reportId) => set({ reportId }),
      setSelectedClinicalPmcids: (selectedClinicalPmcids) =>
        set({ selectedClinicalPmcids }),
      setSelectedEconomicPmcids: (selectedEconomicPmcids) =>
        set({ selectedEconomicPmcids }),
      toggleClinicalPmcid: (pmcid) =>
        set((state) => {
          const selected = state.selectedClinicalPmcids;
          const next = selected.includes(pmcid)
            ? selected.filter((item) => item !== pmcid)
            : [...selected, pmcid];
          return { selectedClinicalPmcids: next };
        }),
      toggleEconomicPmcid: (pmcid) =>
        set((state) => {
          const selected = state.selectedEconomicPmcids;
          const next = selected.includes(pmcid)
            ? selected.filter((item) => item !== pmcid)
            : [...selected, pmcid];
          return { selectedEconomicPmcids: next };
        }),
      toggleComparator: (name) =>
        set((state) => {
          const selected = state.selectedComparators;
          const next = selected.includes(name)
            ? selected.filter((item) => item !== name)
            : [...selected, name];
          return { selectedComparators: next };
        }),
      addCustomComparator: (name) =>
        set((state) => ({
          customComparators: state.customComparators.includes(name)
            ? state.customComparators
            : [...state.customComparators, name],
          selectedComparators: state.selectedComparators.includes(name)
            ? state.selectedComparators
            : [...state.selectedComparators, name],
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
      setUserId: (userId) => set({ userId }),
      resetReportPipeline: () => set(reportPipelineState),
      resetWizard: () =>
        set((state) => ({
          ...initialState,
          userId: state.userId,
        })),
    }),
    {
      name: "report-wizard-storage",
      version: 2,
      migrate: migratePersistedState,
      partialize: (state) => ({
        currentStep: state.currentStep,
        drugName: state.drugName,
        indications: state.indications,
        filters: state.filters,
        reportId: state.reportId,
        selectedClinicalPmcids: state.selectedClinicalPmcids,
        selectedEconomicPmcids: state.selectedEconomicPmcids,
        selectedComparators: state.selectedComparators,
        customComparators: state.customComparators,
        selectedSectionIds: state.selectedSectionIds,
        customSections: state.customSections,
        generationJobId: state.generationJobId,
        userId: state.userId,
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
