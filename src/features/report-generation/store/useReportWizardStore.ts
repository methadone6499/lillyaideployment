"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SECTION_IDS } from "../constants/reportSections";
import type { FilterState, WizardSectionId, WizardStep } from "../types";
import {
  getDefaultSelectedSectionIds,
  isSectionAvailable,
  normalizeWizardSectionIds,
  orderWizardSectionIds,
  reconcileSelectedSectionIdsWithInputs,
  syncSelectedSectionIdsOnInputChange,
  type SectionSelectionInputs,
} from "../utils/sectionOrdering";

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
  selectedSectionIds: WizardSectionId[];
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
  toggleSectionId: (id: WizardSectionId) => void;
  selectAllSections: (ids: WizardSectionId[]) => void;
  deselectAllSections: () => void;
  reconcileSectionsAtStep5: () => void;
  setGenerationJobId: (jobId: string | null) => void;
  setUserId: (userId: string | null) => void;
  resetReportPipeline: () => void;
  resetWizard: () => void;
};

const emptySectionInputs: SectionSelectionInputs = {
  selectedClinicalPmcids: [],
  selectedEconomicPmcids: [],
  selectedComparators: [],
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
  selectedSectionIds: getDefaultSelectedSectionIds(emptySectionInputs),
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

function getSectionSelectionInputs(
  state: Pick<
    ReportWizardState,
    | "selectedClinicalPmcids"
    | "selectedEconomicPmcids"
    | "selectedComparators"
  >,
): SectionSelectionInputs {
  return {
    selectedClinicalPmcids: state.selectedClinicalPmcids,
    selectedEconomicPmcids: state.selectedEconomicPmcids,
    selectedComparators: state.selectedComparators,
  };
}

function withSyncedSectionIdsOnInputChange<
  T extends Pick<
    ReportWizardState,
    | "selectedSectionIds"
    | "selectedClinicalPmcids"
    | "selectedEconomicPmcids"
    | "selectedComparators"
  >,
>(state: T, changes: Partial<T>): Partial<T> {
  const nextState = { ...state, ...changes };
  return {
    ...changes,
    selectedSectionIds: syncSelectedSectionIdsOnInputChange(
      nextState.selectedSectionIds,
      getSectionSelectionInputs(nextState),
    ),
  };
}

function withReconciledSectionIdsAtStep5<
  T extends Pick<
    ReportWizardState,
    | "selectedSectionIds"
    | "selectedClinicalPmcids"
    | "selectedEconomicPmcids"
    | "selectedComparators"
  >,
>(state: T): Pick<T, "selectedSectionIds"> {
  return {
    selectedSectionIds: reconcileSelectedSectionIdsWithInputs(
      state.selectedSectionIds,
      getSectionSelectionInputs(state),
    ),
  };
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

  if (version < 3) {
    const sectionInputs: SectionSelectionInputs = {
      selectedClinicalPmcids: state.selectedClinicalPmcids ?? [],
      selectedEconomicPmcids: state.selectedEconomicPmcids ?? [],
      selectedComparators: state.selectedComparators ?? [],
    };

    const normalized = state.selectedSectionIds
      ? normalizeWizardSectionIds(state.selectedSectionIds)
      : getDefaultSelectedSectionIds(sectionInputs);

    state = {
      ...state,
      selectedSectionIds: reconcileSelectedSectionIdsWithInputs(
        normalized,
        sectionInputs,
      ),
    };
  }

  if (version < 4 && state.selectedSectionIds) {
    state = {
      ...state,
      selectedSectionIds: normalizeWizardSectionIds(state.selectedSectionIds),
    };
  }

  return state;
}

export const useReportWizardStore = create<ReportWizardState>()(
  persist(
    (set) => ({
      ...initialState,
      setStep: (step) =>
        set((state) => ({
          currentStep: step,
          ...(step === 5 ? withReconciledSectionIdsAtStep5(state) : {}),
        })),
      nextStep: () =>
        set((state) => {
          const currentStep = Math.min(6, state.currentStep + 1) as WizardStep;
          return {
            currentStep,
            ...(currentStep === 5
              ? withReconciledSectionIdsAtStep5(state)
              : {}),
          };
        }),
      prevStep: () =>
        set((state) => {
          const currentStep = Math.max(1, state.currentStep - 1) as WizardStep;
          return {
            currentStep,
            ...(currentStep === 5
              ? withReconciledSectionIdsAtStep5(state)
              : {}),
          };
        }),
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
        set((state) =>
          withSyncedSectionIdsOnInputChange(state, { selectedClinicalPmcids }),
        ),
      setSelectedEconomicPmcids: (selectedEconomicPmcids) =>
        set((state) =>
          withSyncedSectionIdsOnInputChange(state, { selectedEconomicPmcids }),
        ),
      toggleClinicalPmcid: (pmcid) =>
        set((state) => {
          const selected = state.selectedClinicalPmcids;
          const selectedClinicalPmcids = selected.includes(pmcid)
            ? selected.filter((item) => item !== pmcid)
            : [...selected, pmcid];
          return withSyncedSectionIdsOnInputChange(state, {
            selectedClinicalPmcids,
          });
        }),
      toggleEconomicPmcid: (pmcid) =>
        set((state) => {
          const selected = state.selectedEconomicPmcids;
          const selectedEconomicPmcids = selected.includes(pmcid)
            ? selected.filter((item) => item !== pmcid)
            : [...selected, pmcid];
          return withSyncedSectionIdsOnInputChange(state, {
            selectedEconomicPmcids,
          });
        }),
      toggleComparator: (name) =>
        set((state) => {
          const selected = state.selectedComparators;
          const selectedComparators = selected.includes(name)
            ? selected.filter((item) => item !== name)
            : [...selected, name];
          return withSyncedSectionIdsOnInputChange(state, { selectedComparators });
        }),
      addCustomComparator: (name) =>
        set((state) => {
          const customComparators = state.customComparators.includes(name)
            ? state.customComparators
            : [...state.customComparators, name];
          const selectedComparators = state.selectedComparators.includes(name)
            ? state.selectedComparators
            : [...state.selectedComparators, name];
          return withSyncedSectionIdsOnInputChange(state, {
            customComparators,
            selectedComparators,
          });
        }),
      toggleSectionId: (id) =>
        set((state) => {
          const inputs = getSectionSelectionInputs(state);
          if (!isSectionAvailable(id, inputs)) {
            return {};
          }
          const selected = state.selectedSectionIds;
          const next = selected.includes(id)
            ? selected.filter((item) => item !== id)
            : [...selected, id];
          return { selectedSectionIds: orderWizardSectionIds(next) };
        }),
      selectAllSections: (ids) =>
        set({ selectedSectionIds: orderWizardSectionIds(ids) }),
      deselectAllSections: () => set({ selectedSectionIds: [] }),
      reconcileSectionsAtStep5: () =>
        set((state) => withReconciledSectionIdsAtStep5(state)),
      setGenerationJobId: (generationJobId) => set({ generationJobId }),
      setUserId: (userId) => set({ userId }),
      resetReportPipeline: () =>
        set((state) =>
          withSyncedSectionIdsOnInputChange(state, reportPipelineState),
        ),
      resetWizard: () =>
        set((state) => ({
          ...initialState,
          userId: state.userId,
        })),
    }),
    {
      name: "report-wizard-storage",
      version: 4,
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
