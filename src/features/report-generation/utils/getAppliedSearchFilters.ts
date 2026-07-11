import type { FilterState } from "../types";
import {
  AVERAGE_WEIGHT_OPTIONS,
  CLINICAL_STUDY_TYPES,
  COMPARATOR_TYPE_OPTIONS,
  DOSAGE_FREQUENCY_OPTIONS,
  ECONOMIC_STUDY_TYPES,
  EVIDENCE_QUALITY_OPTIONS,
  EVIDENCE_SYNTHESIS_OPTIONS,
  GENDER_DISTRIBUTION_OPTIONS,
  GEOGRAPHY_REGULATORY_REGION_OPTIONS,
  OUTCOME_EVIDENCE_FOCUS_OPTIONS,
  POPULATION_TYPE_OPTIONS,
  REGION_PRICING_MARKET_OPTIONS,
  SPECIALIZED_TRIAL_STRUCTURES_OPTIONS,
  STUDY_DURATION_OPTIONS,
  TIME_RANGE_OPTIONS,
  TREATMENT_DURATION_OPTIONS,
} from "./filterOptions";

export type AppliedSearchFilterGroup = {
  title: string;
  labels: string[];
};

type Option = { value?: string; id?: string; label: string };

function labelForValue(options: Option[], value: string): string | undefined {
  if (!value) return undefined;
  const match = options.find(
    (option) => option.value === value || option.id === value,
  );
  return match?.label;
}

function labelsForIds(options: Option[], ids: string[]): string[] {
  return ids
    .map((id) => labelForValue(options, id))
    .filter((label): label is string => Boolean(label));
}

function labelsForSelect(options: Option[], value: string): string[] {
  const label = labelForValue(options, value);
  return label ? [label] : [];
}

function pushGroup(
  groups: AppliedSearchFilterGroup[],
  title: string,
  labels: string[],
): void {
  if (labels.length === 0) return;
  groups.push({ title, labels });
}

function buildTimeRangeLabels(filters: FilterState): string[] {
  const labels: string[] = [];
  const timeRangeLabel = labelForValue(TIME_RANGE_OPTIONS, filters.timeRange);
  if (timeRangeLabel) {
    labels.push(timeRangeLabel);
  }

  if (filters.timeRange === "custom-date-range") {
    if (filters.customDateFrom) {
      labels.push(`From: ${filters.customDateFrom}`);
    }
    if (filters.customDateTo) {
      labels.push(`To: ${filters.customDateTo}`);
    }
  }

  return labels;
}

function buildCostAnalysisLabels(filters: FilterState): string[] {
  const labels: string[] = [];

  if (filters.costPatientVolume.trim()) {
    labels.push(`Patient Volume: ${filters.costPatientVolume.trim()}`);
  }
  if (filters.costTreatmentDurationDays.trim()) {
    labels.push(
      `Treatment Duration (days): ${filters.costTreatmentDurationDays.trim()}`,
    );
  }
  if (filters.costUnitPrice.trim()) {
    labels.push(`Unit Price: ${filters.costUnitPrice.trim()}`);
  }

  const dosageLabel = labelForValue(
    DOSAGE_FREQUENCY_OPTIONS,
    filters.costDosageFrequency,
  );
  if (dosageLabel) {
    labels.push(`Dosage Frequency: ${dosageLabel}`);
  }

  const regionLabel = labelForValue(
    REGION_PRICING_MARKET_OPTIONS,
    filters.costRegion,
  );
  if (regionLabel) {
    labels.push(`Region: ${regionLabel}`);
  }

  return labels;
}

/**
 * Builds read-only applied filter groups for the Search Filters modal.
 * Groups follow Step 2 order; empty / unset groups are omitted.
 */
export function getAppliedSearchFilters(
  filters: FilterState,
): AppliedSearchFilterGroup[] {
  const groups: AppliedSearchFilterGroup[] = [];

  pushGroup(groups, "Time Range", buildTimeRangeLabels(filters));
  pushGroup(
    groups,
    "Clinical study types",
    labelsForIds(CLINICAL_STUDY_TYPES, filters.clinicalStudyTypes),
  );
  pushGroup(
    groups,
    "Evidence Synthesis",
    labelsForSelect(EVIDENCE_SYNTHESIS_OPTIONS, filters.evidenceSynthesis),
  );
  pushGroup(
    groups,
    "Specialized Trial Structures",
    labelsForSelect(
      SPECIALIZED_TRIAL_STRUCTURES_OPTIONS,
      filters.specializedTrialStructures,
    ),
  );
  pushGroup(
    groups,
    "Study Duration",
    labelsForSelect(STUDY_DURATION_OPTIONS, filters.studyDuration),
  );
  pushGroup(
    groups,
    "Population Type",
    labelsForIds(POPULATION_TYPE_OPTIONS, filters.populationType),
  );
  pushGroup(
    groups,
    "Economic study types",
    labelsForIds(ECONOMIC_STUDY_TYPES, filters.economicStudyTypes),
  );
  pushGroup(groups, "Cost Analysis", buildCostAnalysisLabels(filters));
  pushGroup(
    groups,
    "Average Weight",
    labelsForSelect(AVERAGE_WEIGHT_OPTIONS, filters.averageWeight),
  );
  pushGroup(
    groups,
    "Gender Distribution",
    labelsForSelect(GENDER_DISTRIBUTION_OPTIONS, filters.genderDistribution),
  );
  pushGroup(
    groups,
    "Treatment Duration",
    labelsForSelect(TREATMENT_DURATION_OPTIONS, filters.treatmentDuration),
  );
  pushGroup(
    groups,
    "Dosage Frequency",
    labelsForSelect(DOSAGE_FREQUENCY_OPTIONS, filters.dosageFrequency),
  );
  pushGroup(
    groups,
    "Region / Pricing Market",
    labelsForSelect(REGION_PRICING_MARKET_OPTIONS, filters.regionPricingMarket),
  );
  pushGroup(
    groups,
    "Outcome / Evidence Focus",
    labelsForIds(OUTCOME_EVIDENCE_FOCUS_OPTIONS, filters.outcomeEvidenceFocus),
  );
  pushGroup(
    groups,
    "Geography / Regulatory Region",
    labelsForIds(
      GEOGRAPHY_REGULATORY_REGION_OPTIONS,
      filters.geographyRegulatoryRegion,
    ),
  );
  pushGroup(
    groups,
    "Evidence Quality",
    labelsForIds(EVIDENCE_QUALITY_OPTIONS, filters.evidenceQuality),
  );
  pushGroup(
    groups,
    "Comparator Type",
    labelsForIds(COMPARATOR_TYPE_OPTIONS, filters.comparatorType),
  );

  return groups;
}
