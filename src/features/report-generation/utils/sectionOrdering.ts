import {
  ALL_WIZARD_SECTION_IDS,
  REPORT_SECTION_DEFINITIONS,
} from "../constants/reportSections";
import type {
  CustomSectionType,
  ReportStatusSection,
  SectionType,
  WizardCustomSection,
  WizardSectionId,
} from "../types";

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

/** `custom:<uuid>` tokens from selections, status, and generated sections. */
export function isCustomSectionType(id: string): id is CustomSectionType {
  return id.startsWith("custom:");
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
  return orderWizardSectionIds(ids).filter((id) => id !== "compliance");
}

function toCustomSectionToken(customId: string): CustomSectionType | null {
  const trimmed = customId.trim();
  if (!trimmed) {
    return null;
  }
  return `custom:${trimmed}` as CustomSectionType;
}

/**
 * Built-in section types plus enabled `custom:<uuid>` tokens.
 * Customs are inserted immediately before `executive` when it is selected;
 * otherwise they are appended. Create order of enabled customs is preserved.
 */
export function buildApiSectionTypes(
  selectedSectionIds: readonly WizardSectionId[],
  customSections: readonly Pick<WizardCustomSection, "customId" | "enabled">[],
): SectionType[] {
  const builtIns = filterApiSectionIds(selectedSectionIds);
  const customTokens = customSections.flatMap((section) => {
    if (!section.enabled) {
      return [];
    }
    const token = toCustomSectionToken(section.customId);
    return token ? [token] : [];
  });

  const executiveIndex = builtIns.indexOf("executive");
  if (executiveIndex === -1) {
    return [...builtIns, ...customTokens];
  }

  return [
    ...builtIns.slice(0, executiveIndex),
    ...customTokens,
    ...builtIns.slice(executiveIndex),
  ];
}

/**
 * Viewer outline: selected IDs (built-ins and any already-merged `custom:<id>`
 * tokens) plus `custom:<uuid>` rows from GET /status that are not already listed.
 * Customs are inserted immediately before `executive` when it is present.
 */
export function mergeViewerSectionIds(
  selectedSectionIds: readonly string[],
  statusSections: readonly Pick<
    ReportStatusSection,
    "section_type" | "sort_order"
  >[],
): string[] {
  const selected: string[] = [];
  const seen = new Set<string>();
  for (const id of selectedSectionIds) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    selected.push(id);
  }

  const customFromStatus = statusSections
    .filter((section) => {
      return (
        isCustomSectionType(section.section_type) &&
        !seen.has(section.section_type)
      );
    })
    .sort((a, b) => {
      const orderA = a.sort_order ?? Number.POSITIVE_INFINITY;
      const orderB = b.sort_order ?? Number.POSITIVE_INFINITY;
      return orderA - orderB;
    })
    .map((section) => section.section_type);

  if (customFromStatus.length === 0) {
    return selected;
  }

  const executiveIndex = selected.indexOf("executive");
  if (executiveIndex === -1) {
    return [...selected, ...customFromStatus];
  }

  return [
    ...selected.slice(0, executiveIndex),
    ...customFromStatus,
    ...selected.slice(executiveIndex),
  ];
}

export type SectionSelectionInputs = {
  selectedClinicalArticleIds: readonly string[];
  selectedEconomicArticleIds: readonly string[];
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
  if (id === "compliance") {
    return false;
  }
  if (id === "clinical") {
    return inputs.selectedClinicalArticleIds.length > 0;
  }
  if (id === "economic") {
    return inputs.selectedEconomicArticleIds.length > 0;
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

/** Default Step 5 selections: all except environmental, compliance, and input-dependent gaps. */
export function getDefaultSelectedSectionIds(
  inputs: SectionSelectionInputs,
): WizardSectionId[] {
  const base = ALL_WIZARD_SECTION_IDS.filter(
    (id) => id !== "environmental" && id !== "compliance",
  );
  return syncSelectedSectionIdsOnInputChange(base, inputs);
}

/** Remove clinical/economic/comparator when their inputs are cleared. */
export function syncSelectedSectionIdsOnInputChange(
  selectedSectionIds: readonly WizardSectionId[],
  inputs: SectionSelectionInputs,
): WizardSectionId[] {
  const next = new Set(selectedSectionIds);
  next.delete("compliance");

  if (inputs.selectedClinicalArticleIds.length === 0) {
    next.delete("clinical");
  }
  if (inputs.selectedEconomicArticleIds.length === 0) {
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
  next.delete("compliance");

  if (inputs.selectedClinicalArticleIds.length === 0) {
    next.delete("clinical");
  } else {
    next.add("clinical");
  }

  if (inputs.selectedEconomicArticleIds.length === 0) {
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
