import type { AdvancedFilters, FilterState, ReportInputs } from "../types";

type CostAnalysis = NonNullable<AdvancedFilters["cost_analysis"]>;

/** Default PubMed result limits sent on report creation. */
export const DEFAULT_PUBMED_TOP_K_CLINICAL = 10;
export const DEFAULT_PUBMED_TOP_K_ECONOMIC = 10;

/**
 * Optional filter fields added in store/schema v5 — read when present so mapping
 * stays compatible before and after the wizard state migration lands.
 */
type ExtendedFilterFields = {
  customDateFrom?: string;
  customDateTo?: string;
  costPatientVolume?: number | string;
  costTreatmentDurationDays?: number | string;
  costUnitPrice?: number | string;
  costDosageFrequency?: string;
  costRegion?: string;
  populationType?: string | string[];
  geographyRegulatoryRegion?: string | string[];
  outcomeEvidenceFocus?: string | string[];
  comparatorType?: string | string[];
  evidenceQuality?: string | string[];
};

/** Frontend `filters.timeRange` → backend `advanced_filters.time_range`. */
const TIME_RANGE_MAP: Record<string, string> = {
  "last-1-year": "Last 1 Year",
  "last-2-years": "Last 3 Years",
  "last-3-years": "Last 3 Years",
  "last-5-years": "Last 5 Years",
  "last-10-years": "Last 10 Years",
  "custom-date-range": "Custom Date Range",
};

/**
 * Frontend clinical study chip IDs (`filters.clinicalStudyTypes`) →
 * backend `advanced_filters.clinical_types`.
 */
const CLINICAL_STUDY_TYPE_MAP: Record<string, string> = {
  rcts: "Randomized Controlled Trials (RCTs)",
  controlledtrials: "Controlled Trials",
  "clinical-trials": "Clinical Trials",
  earlyphaseclinicaltrials: "Early Phase",
  "phase-i": "Phase I",
  "phase-ii": "Phase II",
  "phase-iii": "Phase III",
  "phase-iv": "Phase IV",
  postmarketingclinicaltrials: "Post-Marketing",
  ongoingclinicaltrials: "Ongoing Trials",
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
  "cost-burden-analysis": "Cost Burden Analysis",
  "reimbursement-evidence": "Reimbursement Evidence",
};

/** Frontend population values → backend `advanced_filters.population`. */
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

/** Frontend geography values → backend `advanced_filters.geography`. */
const GEOGRAPHY_MAP: Record<string, string> = {
  global: "Global",
  "gcc-middle-east": "GCC / Middle East",
  europe: "Europe",
  usa: "USA",
};

/** Frontend outcome focus values → backend `advanced_filters.outcomes`. */
const OUTCOME_MAP: Record<string, string> = {
  efficacy: "Efficacy",
  safety: "Safety",
  "survival-outcomes": "Survival Outcomes",
  "quality-of-life": "Quality of Life",
  "economic-outcomes": "Economic Outcomes",
  "adherence-outcomes": "Adherence Outcomes",
  "hospitalization-impact": "Hospitalization Impact",
};

/** Frontend comparator type values → backend `advanced_filters.comparators`. */
const COMPARATOR_MAP: Record<string, string> = {
  placebo: "Placebo",
  "standard-of-care": "Standard of Care",
  "active-comparator": "Active Comparator",
  "competitor-drug": "Competitor Drug",
  "combination-therapy": "Combination Therapy",
  "historical-control": "Historical Control",
  "no-comparator": "No Comparator",
};

/** Frontend evidence quality values → backend `advanced_filters.quality_filters`. */
const QUALITY_FILTER_MAP: Record<string, string> = {
  "peer-reviewed-only": "Peer Reviewed Only",
  "most-cited-studies": "Most Cited Studies",
  "recent-evidence-only": "Recent Evidence Only",
};

/** Frontend study duration values → backend `advanced_filters.study_duration`. */
const STUDY_DURATION_MAP: Record<string, string> = {
  "short-term": "Short-Term (<6 months)",
  "mid-term": "Mid-Term (6–12 months)",
  "long-term": "Long-Term (1+ years)",
  "very-long-term": "Very Long-Term (5+ years)",
};

/** Legacy patient range select → numeric volume for cost analysis fallback. */
const PATIENT_RANGE_VOLUME_MAP: Record<string, number> = {
  "single-patient": 1,
  "about-50-patients": 50,
  "about-100-patients": 100,
};

/** Legacy dosage frequency → backend cost analysis label. */
const DOSAGE_FREQUENCY_MAP: Record<string, string> = {
  "once-daily": "Once Daily",
  "twice-daily": "Twice Daily",
  "three-times-daily": "Three Times Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  "as-needed": "As Needed (PRN)",
};

/** Legacy region / pricing market → backend cost analysis region label. */
const REGION_MAP: Record<string, string> = {
  gcc: "GCC",
  "saudi-arabia": "Saudi Arabia",
  uae: "United Arab Emirates",
  qatar: "Qatar",
  kuwait: "Kuwait",
  oman: "Oman",
  bahrain: "Bahrain",
  "middle-east": "Middle East",
  europe: "Europe",
  "north-america": "North America",
  global: "Global",
};

const DEFAULT_SPECIES_FILTER = "human";

function asExtendedFilters(
  filters: FilterState,
): FilterState & ExtendedFilterFields {
  return filters;
}

function normalizeToStringArray(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

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

function parseNumericFilterValue(
  value: number | string | undefined,
): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

function buildPopulation(filters: FilterState): string[] {
  const extendedFilters = asExtendedFilters(filters);
  const populationIds = [
    ...normalizeToStringArray(extendedFilters.populationType),
    ...normalizeToStringArray(filters.costPopulationType),
  ];

  return [...new Set(mapIdList(populationIds, POPULATION_MAP))];
}

function buildGeography(filters: FilterState): string[] {
  const extendedFilters = asExtendedFilters(filters);
  return [
    ...new Set(
      mapIdList(
        normalizeToStringArray(extendedFilters.geographyRegulatoryRegion),
        GEOGRAPHY_MAP,
      ),
    ),
  ];
}

function buildOutcomes(filters: FilterState): string[] {
  const extendedFilters = asExtendedFilters(filters);
  return [
    ...new Set(
      mapIdList(
        normalizeToStringArray(extendedFilters.outcomeEvidenceFocus),
        OUTCOME_MAP,
      ),
    ),
  ];
}

function buildComparators(filters: FilterState): string[] {
  const extendedFilters = asExtendedFilters(filters);
  return [
    ...new Set(
      mapIdList(
        normalizeToStringArray(extendedFilters.comparatorType),
        COMPARATOR_MAP,
      ),
    ),
  ];
}

function buildQualityFilters(filters: FilterState): string[] {
  const extendedFilters = asExtendedFilters(filters);
  return [
    ...new Set(
      mapIdList(
        normalizeToStringArray(extendedFilters.evidenceQuality),
        QUALITY_FILTER_MAP,
      ),
    ),
  ];
}

function buildStudyDuration(filters: FilterState): string | undefined {
  return mapSelectValue(filters.studyDuration, STUDY_DURATION_MAP);
}

function buildCostAnalysis(filters: FilterState): CostAnalysis | undefined {
  const extendedFilters = asExtendedFilters(filters);
  const costAnalysis: CostAnalysis = {};

  const patientVolume =
    parseNumericFilterValue(extendedFilters.costPatientVolume) ??
    (filters.patientRange
      ? PATIENT_RANGE_VOLUME_MAP[filters.patientRange]
      : undefined);
  if (patientVolume !== undefined) {
    costAnalysis.patient_volume = patientVolume;
  }

  const treatmentDurationDays = parseNumericFilterValue(
    extendedFilters.costTreatmentDurationDays,
  );
  if (treatmentDurationDays !== undefined) {
    costAnalysis.treatment_duration_days = treatmentDurationDays;
  }

  const unitPrice = parseNumericFilterValue(extendedFilters.costUnitPrice);
  if (unitPrice !== undefined) {
    costAnalysis.unit_price = unitPrice;
  }

  const dosageFrequency =
    mapSelectValue(
      extendedFilters.costDosageFrequency ?? filters.dosageFrequency,
      DOSAGE_FREQUENCY_MAP,
    ) ?? undefined;
  if (dosageFrequency) {
    costAnalysis.dosage_frequency = dosageFrequency;
  }

  const region =
    mapSelectValue(
      extendedFilters.costRegion ?? filters.regionPricingMarket,
      REGION_MAP,
    ) ?? undefined;
  if (region) {
    costAnalysis.region = region;
  }

  return Object.keys(costAnalysis).length > 0 ? costAnalysis : undefined;
}

function buildTimeRange(filters: FilterState): Pick<
  AdvancedFilters,
  "time_range" | "custom_date_range"
> {
  if (filters.timeRange === "custom-date-range") {
    const extendedFilters = asExtendedFilters(filters);
    const timeRange: Pick<AdvancedFilters, "time_range" | "custom_date_range"> =
      {
        time_range: "Custom Date Range",
      };

    if (extendedFilters.customDateFrom && extendedFilters.customDateTo) {
      timeRange.custom_date_range = {
        from: extendedFilters.customDateFrom,
        to: extendedFilters.customDateTo,
      };
    }

    return timeRange;
  }

  const timeRange = TIME_RANGE_MAP[filters.timeRange];
  return timeRange ? { time_range: timeRange } : {};
}

function buildAdvancedFilters(filters: FilterState): AdvancedFilters {
  const clinicalTypes = buildClinicalTypes(filters);
  const economicTypes = [
    ...new Set(mapIdList(filters.economicStudyTypes, ECONOMIC_STUDY_TYPE_MAP)),
  ];
  const population = buildPopulation(filters);
  const geography = buildGeography(filters);
  const outcomes = buildOutcomes(filters);
  const comparators = buildComparators(filters);
  const qualityFilters = buildQualityFilters(filters);
  const studyDuration = buildStudyDuration(filters);
  const costAnalysis = buildCostAnalysis(filters);

  const advancedFilters: AdvancedFilters = {
    ...buildTimeRange(filters),
    species_filter: DEFAULT_SPECIES_FILTER,
  };

  if (clinicalTypes.length > 0) {
    advancedFilters.clinical_types = clinicalTypes;
  }

  if (economicTypes.length > 0) {
    advancedFilters.economic_types = economicTypes;
  }

  if (population.length > 0) {
    advancedFilters.population = population;
  }

  if (geography.length > 0) {
    advancedFilters.geography = geography;
  }

  if (outcomes.length > 0) {
    advancedFilters.outcomes = outcomes;
  }

  if (comparators.length > 0) {
    advancedFilters.comparators = comparators;
  }

  if (qualityFilters.length > 0) {
    advancedFilters.quality_filters = qualityFilters;
  }

  if (studyDuration) {
    advancedFilters.study_duration = studyDuration;
  }

  if (costAnalysis) {
    advancedFilters.cost_analysis = costAnalysis;
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
