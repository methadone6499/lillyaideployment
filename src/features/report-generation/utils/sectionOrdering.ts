import {
  ALL_WIZARD_SECTION_IDS,
  REPORT_SECTION_DEFINITIONS,
} from "../constants/reportSections";
import type { SectionType, WizardSectionId } from "../types";

const LEGACY_WIZARD_SECTION_ID_MAP: Record<string, WizardSectionId> = {
  "disease-overview": "disease",
  "drug-overview": "drug",
  "clinical-evidence": "clinical",
  "economic-evidence": "economic",
  "competitor-analysis": "comparator",
  "environmental-analysis": "environmental",
  "hta-summary": "hta",
  "executive-summary": "executive",
};

const wizardSectionIdSet = new Set<string>(ALL_WIZARD_SECTION_IDS);

/** Canonical Step 5 section order derived from report section definitions. */
export function getWizardSectionOrder(): readonly WizardSectionId[] {
  return ALL_WIZARD_SECTION_IDS;
}

export function getReportSectionDefinition(sectionId: WizardSectionId) {
  return REPORT_SECTION_DEFINITIONS.find((section) => section.id === sectionId);
}

export function isWizardSectionId(id: string): id is WizardSectionId {
  return wizardSectionIdSet.has(id);
}

/** Reorder selected IDs to match Step 5 definition order. */
export function orderWizardSectionIds(
  ids: readonly WizardSectionId[],
): WizardSectionId[] {
  const selected = new Set(ids);
  return ALL_WIZARD_SECTION_IDS.filter((id) => selected.has(id));
}

/** Drop unknown/legacy IDs, map legacy aliases, and normalize to Step 5 order. */
export function normalizeWizardSectionIds(
  ids: readonly string[],
): WizardSectionId[] {
  const mapped = ids
    .map((id) => LEGACY_WIZARD_SECTION_ID_MAP[id] ?? id)
    .filter((id): id is WizardSectionId => isWizardSectionId(id));

  return orderWizardSectionIds([...new Set(mapped)]);
}

/** Backend section types to send, preserving Step 5 definition order. */
export function filterApiSectionIds(
  ids: readonly WizardSectionId[],
): SectionType[] {
  return orderWizardSectionIds(ids);
}

export type SectionSelectionInputs = {
  selectedClinicalPmcids: readonly string[];
  selectedEconomicPmcids: readonly string[];
  selectedComparators: readonly string[];
};

const INPUT_DEPENDENT_SECTION_IDS = [
  "clinical",
  "economic",
  "comparator",
] as const satisfies readonly WizardSectionId[];

export function isInputDependentSectionId(
  id: WizardSectionId,
): id is (typeof INPUT_DEPENDENT_SECTION_IDS)[number] {
  return (INPUT_DEPENDENT_SECTION_IDS as readonly string[]).includes(id);
}

/** Whether a section can be toggled on in Step 5 given current wizard inputs. */
export function isSectionAvailable(
  id: WizardSectionId,
  inputs: SectionSelectionInputs,
): boolean {
  if (id === "clinical") {
    return inputs.selectedClinicalPmcids.length > 0;
  }
  if (id === "economic") {
    return inputs.selectedEconomicPmcids.length > 0;
  }
  if (id === "comparator") {
    return inputs.selectedComparators.length > 0;
  }
  return true;
}

/** Step 5 section IDs the user can select, preserving definition order. */
export function getToggleableSectionIds(
  inputs: SectionSelectionInputs,
): WizardSectionId[] {
  return ALL_WIZARD_SECTION_IDS.filter((id) => isSectionAvailable(id, inputs));
}

/** Default Step 5 selections: all sections except environmental and input-dependent gaps. */
export function getDefaultSelectedSectionIds(
  inputs: SectionSelectionInputs,
): WizardSectionId[] {
  const base = ALL_WIZARD_SECTION_IDS.filter((id) => id !== "environmental");
  return syncSelectedSectionIdsOnInputChange(base, inputs);
}

/** Remove clinical/economic/comparator when their inputs are cleared. */
export function syncSelectedSectionIdsOnInputChange(
  selectedSectionIds: readonly WizardSectionId[],
  inputs: SectionSelectionInputs,
): WizardSectionId[] {
  const next = new Set(selectedSectionIds);

  if (inputs.selectedClinicalPmcids.length === 0) {
    next.delete("clinical");
  }
  if (inputs.selectedEconomicPmcids.length === 0) {
    next.delete("economic");
  }
  if (inputs.selectedComparators.length === 0) {
    next.delete("comparator");
  }

  return orderWizardSectionIds([...next]);
}

/** Align input-dependent sections with current evidence/comparator selections. */
export function reconcileSelectedSectionIdsWithInputs(
  selectedSectionIds: readonly WizardSectionId[],
  inputs: SectionSelectionInputs,
): WizardSectionId[] {
  const next = new Set(selectedSectionIds);

  if (inputs.selectedClinicalPmcids.length === 0) {
    next.delete("clinical");
  } else {
    next.add("clinical");
  }

  if (inputs.selectedEconomicPmcids.length === 0) {
    next.delete("economic");
  } else {
    next.add("economic");
  }

  if (inputs.selectedComparators.length === 0) {
    next.delete("comparator");
  } else {
    next.add("comparator");
  }

  return orderWizardSectionIds([...next]);
}
