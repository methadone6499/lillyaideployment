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
  populationType: [],
  studyDuration: "",
  economicStudyTypes: ["cost-effectiveness", "resource-utilization"],
  costPopulationType: "",
  patientRange: "",
  costPopulationTypeSecondary: "",
  costStudyDuration: "",
  outcomeEvidenceFocus: [],
  evidenceQuality: [],
  comparatorType: [],
  customDateFrom: "",
  customDateTo: "",
  costPatientVolume: "",
  costTreatmentDurationDays: "",
  costUnitPrice: "",
  costDosageFrequency: "",
  costRegion: "",
};

function createDefaultFilters(): FilterState {
  return {
    ...DEFAULT_FILTERS,
    clinicalStudyTypes: [...DEFAULT_FILTERS.clinicalStudyTypes],
    economicStudyTypes: [...DEFAULT_FILTERS.economicStudyTypes],
    populationType: [...DEFAULT_FILTERS.populationType],
    outcomeEvidenceFocus: [...DEFAULT_FILTERS.outcomeEvidenceFocus],
    evidenceQuality: [...DEFAULT_FILTERS.evidenceQuality],
    comparatorType: [...DEFAULT_FILTERS.comparatorType],
  };
}

function toggleFilterArray(current: string[], value: string): string[] {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

function coerceStringToStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  return [];
}

function coerceFilterString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function coerceTimeRange(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }

  if (value === "custom-date-range") {
    return "all-time";
  }

  if (value === "last-2-years") {
    return "last-3-years";
  }

  return value;
}

function migrateFiltersToV5(filters: unknown): FilterState {
  const defaults = createDefaultFilters();

  if (!filters || typeof filters !== "object") {
    return defaults;
  }

  const legacy = filters as Record<string, unknown>;

  return {
    timeRange: coerceTimeRange(legacy.timeRange, defaults.timeRange),
    clinicalStudyTypes: coerceStringToStringArray(
      legacy.clinicalStudyTypes ?? defaults.clinicalStudyTypes,
    ),
    evidenceSynthesis: coerceFilterString(legacy.evidenceSynthesis),
    specializedTrialStructures: coerceFilterString(
      legacy.specializedTrialStructures,
    ),
    populationType: coerceStringToStringArray(legacy.populationType),
    studyDuration: coerceFilterString(legacy.studyDuration),
    economicStudyTypes: coerceStringToStringArray(
      legacy.economicStudyTypes ?? defaults.economicStudyTypes,
    ),
    costPopulationType: coerceFilterString(legacy.costPopulationType),
    patientRange: coerceFilterString(legacy.patientRange),
    costPopulationTypeSecondary: coerceFilterString(
      legacy.costPopulationTypeSecondary,
    ),
    costStudyDuration: coerceFilterString(legacy.costStudyDuration),
    outcomeEvidenceFocus: coerceStringToStringArray(legacy.outcomeEvidenceFocus),
    evidenceQuality: coerceStringToStringArray(legacy.evidenceQuality),
    comparatorType: coerceStringToStringArray(legacy.comparatorType),
    customDateFrom: coerceFilterString(legacy.customDateFrom),
    customDateTo: coerceFilterString(legacy.customDateTo),
    costPatientVolume: coerceFilterString(legacy.costPatientVolume),
    costTreatmentDurationDays: coerceFilterString(
      legacy.costTreatmentDurationDays,
    ),
    costUnitPrice: coerceFilterString(legacy.costUnitPrice),
    costDosageFrequency: coerceFilterString(legacy.costDosageFrequency),
    costRegion: coerceFilterString(legacy.costRegion),
  };
}

export type PlatformSaveState =
  | "not_started"
  | "saving"
  | "saved"
  | "save_failed";

type PersistedWizardState = {
  currentStep?: WizardStep;
  drugName?: string;
  indications?: string;
  filters?: FilterState;
  /** @deprecated Migrated to `reportServiceId` in persist version 10. */
  reportId?: string | null;
  reportServiceId?: string | null;
  platformReportId?: string | null;
  platformSaveState?: PlatformSaveState;
  selectedClinicalPmcids?: string[];
  selectedEconomicPmcids?: string[];
  selectedClinicalArticleIds?: string[];
  selectedEconomicArticleIds?: string[];
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
  reportServiceId: string | null;
  platformReportId: string | null;
  platformSaveState: PlatformSaveState;
  selectedClinicalArticleIds: string[];
  selectedEconomicArticleIds: string[];
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
  togglePopulationType: (type: string) => void;
  toggleOutcomeEvidenceFocus: (focus: string) => void;
  toggleComparatorType: (type: string) => void;
  toggleEvidenceQuality: (quality: string) => void;
  setReportServiceId: (reportServiceId: string | null) => void;
  setPlatformReportId: (platformReportId: string | null) => void;
  setPlatformSaveState: (platformSaveState: PlatformSaveState) => void;
  setSelectedClinicalArticleIds: (ids: string[]) => void;
  setSelectedEconomicArticleIds: (ids: string[]) => void;
  toggleClinicalArticleId: (id: string) => void;
  toggleEconomicArticleId: (id: string) => void;
  toggleComparator: (name: string) => void;
  addCustomComparator: (name: string) => void;
  toggleSectionId: (id: WizardSectionId) => void;
  selectAllSections: (ids: WizardSectionId[]) => void;
  deselectAllSections: () => void;
  reconcileSectionsAtStep5: () => void;
  setGenerationJobId: (jobId: string | null) => void;
  setUserId: (userId: string | null) => void;
  resetReportPipeline: () => void;
  resetFilters: () => void;
  resetWizard: () => void;
};

const emptySectionInputs: SectionSelectionInputs = {
  selectedClinicalArticleIds: [],
  selectedEconomicArticleIds: [],
  selectedComparators: [],
};

const initialState = {
  currentStep: 1 as WizardStep,
  drugName: "",
  indications: "",
  filters: createDefaultFilters(),
  reportServiceId: null as string | null,
  platformReportId: null as string | null,
  platformSaveState: "not_started" as PlatformSaveState,
  selectedClinicalArticleIds: [] as string[],
  selectedEconomicArticleIds: [] as string[],
  selectedComparators: [] as string[],
  customComparators: [] as string[],
  selectedSectionIds: getDefaultSelectedSectionIds(emptySectionInputs),
  customSections: [] as string[],
  generationJobId: null as string | null,
  userId: null as string | null,
};

const reportPipelineState = {
  reportServiceId: null as string | null,
  platformReportId: null as string | null,
  platformSaveState: "not_started" as PlatformSaveState,
  generationJobId: null as string | null,
  selectedClinicalArticleIds: [] as string[],
  selectedEconomicArticleIds: [] as string[],
  selectedComparators: [] as string[],
  customComparators: [] as string[],
};

function getSectionSelectionInputs(
  state: Pick<
    ReportWizardState,
    | "selectedClinicalArticleIds"
    | "selectedEconomicArticleIds"
    | "selectedComparators"
  >,
): SectionSelectionInputs {
  return {
    selectedClinicalArticleIds: state.selectedClinicalArticleIds,
    selectedEconomicArticleIds: state.selectedEconomicArticleIds,
    selectedComparators: state.selectedComparators,
  };
}

function withSyncedSectionIdsOnInputChange<
  T extends Pick<
    ReportWizardState,
    | "selectedSectionIds"
    | "selectedClinicalArticleIds"
    | "selectedEconomicArticleIds"
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
    | "selectedClinicalArticleIds"
    | "selectedEconomicArticleIds"
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
    migrated.reportServiceId = state.reportServiceId ?? state.reportId ?? null;

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
      selectedClinicalArticleIds:
        state.selectedClinicalArticleIds ??
        state.selectedClinicalPmcids ??
        [],
      selectedEconomicArticleIds:
        state.selectedEconomicArticleIds ??
        state.selectedEconomicPmcids ??
        [],
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

  if (version < 5) {
    state = {
      ...state,
      filters: migrateFiltersToV5(state.filters),
    };
  }

  if (version < 6) {
    const selectedClinicalArticleIds =
      state.selectedClinicalArticleIds ??
      state.selectedClinicalPmcids ??
      [];
    const selectedEconomicArticleIds =
      state.selectedEconomicArticleIds ??
      state.selectedEconomicPmcids ??
      [];

    const migrated: PersistedWizardState = {
      ...state,
      selectedClinicalArticleIds,
      selectedEconomicArticleIds,
    };
    delete migrated.selectedClinicalPmcids;
    delete migrated.selectedEconomicPmcids;
    state = migrated;
  }

  if (version < 7) {
    state = {
      ...state,
      filters: migrateFiltersToV5(state.filters),
    };
  }

  if (version < 8) {
    state = {
      ...state,
      filters: migrateFiltersToV5(state.filters),
    };
  }

  if (version < 9) {
    state = {
      ...state,
      filters: migrateFiltersToV5(state.filters),
    };
  }

  if (version < 10) {
    const migrated: PersistedWizardState = {
      ...state,
      reportServiceId: state.reportServiceId ?? state.reportId ?? null,
      platformReportId: null,
      platformSaveState: "not_started",
    };
    delete migrated.reportId;
    state = migrated;
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
      togglePopulationType: (type) =>
        set((state) => ({
          filters: {
            ...state.filters,
            populationType: toggleFilterArray(state.filters.populationType, type),
          },
        })),
      toggleOutcomeEvidenceFocus: (focus) =>
        set((state) => ({
          filters: {
            ...state.filters,
            outcomeEvidenceFocus: toggleFilterArray(
              state.filters.outcomeEvidenceFocus,
              focus,
            ),
          },
        })),
      toggleComparatorType: (type) =>
        set((state) => ({
          filters: {
            ...state.filters,
            comparatorType: toggleFilterArray(state.filters.comparatorType, type),
          },
        })),
      toggleEvidenceQuality: (quality) =>
        set((state) => ({
          filters: {
            ...state.filters,
            evidenceQuality: toggleFilterArray(
              state.filters.evidenceQuality,
              quality,
            ),
          },
        })),
      setReportServiceId: (reportServiceId) => set({ reportServiceId }),
      setPlatformReportId: (platformReportId) => set({ platformReportId }),
      setPlatformSaveState: (platformSaveState) => set({ platformSaveState }),
      setSelectedClinicalArticleIds: (selectedClinicalArticleIds) =>
        set((state) =>
          withSyncedSectionIdsOnInputChange(state, {
            selectedClinicalArticleIds,
          }),
        ),
      setSelectedEconomicArticleIds: (selectedEconomicArticleIds) =>
        set((state) =>
          withSyncedSectionIdsOnInputChange(state, {
            selectedEconomicArticleIds,
          }),
        ),
      toggleClinicalArticleId: (id) =>
        set((state) => {
          const selected = state.selectedClinicalArticleIds;
          const selectedClinicalArticleIds = selected.includes(id)
            ? selected.filter((item) => item !== id)
            : [...selected, id];
          return withSyncedSectionIdsOnInputChange(state, {
            selectedClinicalArticleIds,
          });
        }),
      toggleEconomicArticleId: (id) =>
        set((state) => {
          const selected = state.selectedEconomicArticleIds;
          const selectedEconomicArticleIds = selected.includes(id)
            ? selected.filter((item) => item !== id)
            : [...selected, id];
          return withSyncedSectionIdsOnInputChange(state, {
            selectedEconomicArticleIds,
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
      resetFilters: () => set({ filters: createDefaultFilters() }),
      resetWizard: () =>
        set((state) => ({
          ...initialState,
          userId: state.userId,
        })),
    }),
    {
      name: "report-wizard-storage",
      version: 10,
      migrate: migratePersistedState,
      partialize: (state) => ({
        currentStep: state.currentStep,
        drugName: state.drugName,
        indications: state.indications,
        filters: state.filters,
        reportServiceId: state.reportServiceId,
        platformReportId: state.platformReportId,
        platformSaveState: state.platformSaveState,
        selectedClinicalArticleIds: state.selectedClinicalArticleIds,
        selectedEconomicArticleIds: state.selectedEconomicArticleIds,
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
