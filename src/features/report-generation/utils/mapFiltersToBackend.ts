import type { AdvancedFilters, FilterState, ReportInputs } from "../types";

/** Default PubMed result limits sent on report creation. */
export const DEFAULT_PUBMED_TOP_K_CLINICAL = 10;
export const DEFAULT_PUBMED_TOP_K_ECONOMIC = 10;

/** Frontend `filters.timeRange` → backend `advanced_filters.time_range`. */
const TIME_RANGE_MAP: Record<string, string> = {
  "last-1-year": "Last 1 Year",
  "last-2-years": "Last 2 Years",
  "last-5-years": "Last 5 Years",
  "last-10-years": "Last 10 Years",
};

/**
 * Frontend clinical study chip IDs (`filters.clinicalStudyTypes`) →
 * backend `advanced_filters.clinical_types`.
 */
const CLINICAL_STUDY_TYPE_MAP: Record<string, string> = {
  rcts: "Randomized Controlled Trials (RCTs)",
  controlledtrials: "Controlled Trials",
  earlyphaseclinicaltrials: "Early Phase Clinical Trials",
  "phase-i": "Phase I Clinical Trials",
  "phase-ii": "Phase II Clinical Trials",
  "phase-iii": "Phase III Clinical Trials",
  "phase-iv": "Phase IV Clinical Trials",
  postmarketingclinicaltrials: "Post-Marketing Clinical Trials",
  ongoingclinicaltrials: "Ongoing Clinical Trials",
  realworldevidence: "Real-World Evidence",
  observational: "Observational Studies",
  cohort: "Cohort Studies",
  registrystudies: "Registry Studies",
  pragmatictrials: "Pragmatic Trials",
  singlearmtrials: "Single-Arm Trials",
};

/** Frontend `filters.evidenceSynthesis` → backend clinical type label. */
const EVIDENCE_SYNTHESIS_MAP: Record<string, string> = {
  "meta-analyses": "Meta-Analyses",
  "network-meta-analyses": "Network Meta-Analyses",
  "systematic-reviews": "Systematic Reviews",
};

/** Frontend `filters.specializedTrialStructures` → backend clinical type label. */
const SPECIALIZED_TRIAL_STRUCTURES_MAP: Record<string, string> = {
  "basket-trials": "Basket Trials",
  "umbrella-trials": "Umbrella Trials",
  "extension-trials": "Extension Trials",
  "long-term-extension-trials": "Long-Term Extension Trials",
};

/**
 * Frontend economic study chip IDs (`filters.economicStudyTypes`) →
 * backend `advanced_filters.economic_types`.
 */
const ECONOMIC_STUDY_TYPE_MAP: Record<string, string> = {
  "cost-effectiveness": "Cost-Effectiveness",
  "budget-impact": "Budget Impact",
  "cost-utility": "Cost-Utility",
  "pharmacoeconomic-studies": "Pharmacoeconomic Studies",
  "resource-utilization": "Resource Utilization",
  "cost-burden-analysis": "Cost-Burden Analysis",
  "reimbursement-evidence": "Reimbursement Evidence",
};

/** Frontend population select values → backend `advanced_filters.population`. */
const POPULATION_MAP: Record<string, string> = {
  adult: "Adult",
  pediatric: "Pediatric",
  elderly: "Elderly",
  "pregnant-population": "Pregnant Population",
  "high-risk-population": "High-Risk Population",
  "renal-impairment": "Renal Impairment",
  "hepatic-impairment": "Hepatic Impairment",
  "biomarker-positive-population": "Biomarker-Positive Population",
  "oncology-line-of-therapy": "Oncology Line of Therapy",
  "general-population": "General Population",
};

/** Frontend `filters.geographyRegulatoryRegion` → backend `advanced_filters.geography`. */
const GEOGRAPHY_MAP: Record<string, string> = {
  global: "Global",
  "gcc-middle-east": "GCC / Middle East (By Default)",
};

const DEFAULT_SPECIES_FILTER = "human";

function mapSelectValue(
  value: string,
  map: Record<string, string>,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return map[value];
}

function mapIdList(ids: string[], map: Record<string, string>): string[] {
  return ids
    .map((id) => map[id])
    .filter((label): label is string => label !== undefined);
}

function buildClinicalTypes(filters: FilterState): string[] {
  const clinicalTypes = mapIdList(
    filters.clinicalStudyTypes,
    CLINICAL_STUDY_TYPE_MAP,
  );

  const evidenceSynthesis = mapSelectValue(
    filters.evidenceSynthesis,
    EVIDENCE_SYNTHESIS_MAP,
  );
  if (evidenceSynthesis) {
    clinicalTypes.push(evidenceSynthesis);
  }

  const specializedStructure = mapSelectValue(
    filters.specializedTrialStructures,
    SPECIALIZED_TRIAL_STRUCTURES_MAP,
  );
  if (specializedStructure) {
    clinicalTypes.push(specializedStructure);
  }

  return [...new Set(clinicalTypes)];
}

function buildAdvancedFilters(filters: FilterState): AdvancedFilters {
  const clinicalTypes = buildClinicalTypes(filters);
  const economicTypes = [
    ...new Set(mapIdList(filters.economicStudyTypes, ECONOMIC_STUDY_TYPE_MAP)),
  ];

  const population =
    mapSelectValue(filters.populationType, POPULATION_MAP) ??
    mapSelectValue(filters.costPopulationType, POPULATION_MAP);

  const geography = mapSelectValue(
    filters.geographyRegulatoryRegion,
    GEOGRAPHY_MAP,
  );

  const advancedFilters: AdvancedFilters = {
    time_range: TIME_RANGE_MAP[filters.timeRange],
    species_filter: DEFAULT_SPECIES_FILTER,
  };

  if (clinicalTypes.length > 0) {
    advancedFilters.clinical_types = clinicalTypes;
  }

  if (economicTypes.length > 0) {
    advancedFilters.economic_types = economicTypes;
  }

  if (population) {
    advancedFilters.population = population;
  }

  if (geography) {
    advancedFilters.geography = geography;
  }

  return advancedFilters;
}

/** Maps wizard filter state to the backend `inputs` payload for `POST /reports`. */
export function mapFiltersToBackend(filters: FilterState): ReportInputs {
  return {
    pubmed_top_k_clinical: DEFAULT_PUBMED_TOP_K_CLINICAL,
    pubmed_top_k_economic: DEFAULT_PUBMED_TOP_K_ECONOMIC,
    advanced_filters: buildAdvancedFilters(filters),
  };
}
