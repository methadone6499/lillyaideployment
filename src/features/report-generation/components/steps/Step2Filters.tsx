"use client";

import { Chip, Select } from "@/components/ui";
import { FilterGroupCard } from "../FilterGroupCard";
import { useReportWizardStore } from "../../store/useReportWizardStore";
import {
  CLINICAL_STUDY_TYPES,
  COMPARATOR_TYPE_OPTIONS,
  ECONOMIC_STUDY_TYPES,
  EVIDENCE_QUALITY_OPTIONS,
  EVIDENCE_SYNTHESIS_OPTIONS,
  OUTCOME_EVIDENCE_FOCUS_OPTIONS,
  POPULATION_TYPE_OPTIONS,
  SPECIALIZED_TRIAL_STRUCTURES_OPTIONS,
  STUDY_DURATION_OPTIONS,
  TIME_RANGE_OPTIONS,
} from "../../utils/filterOptions";

function resolveTimeRangeValue(timeRange: string): string {
  if (timeRange === "last-2-years") {
    return "last-3-years";
  }

  if (timeRange === "custom-date-range") {
    return "all-time";
  }

  return timeRange;
}

type ChipFilterSectionProps = {
  title: string;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
};

function ChipFilterSection({
  title,
  options,
  selected,
  onToggle,
}: ChipFilterSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-label font-medium text-white">{title}</p>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <Chip
            key={option.id}
            selected={selected.includes(option.id)}
            onClick={() => onToggle(option.id)}
          >
            {option.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function Step2Filters() {
  const filters = useReportWizardStore((s) => s.filters);
  const setFilters = useReportWizardStore((s) => s.setFilters);
  const toggleClinicalStudyType = useReportWizardStore(
    (s) => s.toggleClinicalStudyType,
  );
  const toggleEconomicStudyType = useReportWizardStore(
    (s) => s.toggleEconomicStudyType,
  );
  const togglePopulationType = useReportWizardStore(
    (s) => s.togglePopulationType,
  );
  const toggleOutcomeEvidenceFocus = useReportWizardStore(
    (s) => s.toggleOutcomeEvidenceFocus,
  );
  const toggleComparatorType = useReportWizardStore(
    (s) => s.toggleComparatorType,
  );
  const toggleEvidenceQuality = useReportWizardStore(
    (s) => s.toggleEvidenceQuality,
  );

  return (
    <div className="flex flex-col gap-6">
      <FilterGroupCard
        title="Time Range"
        description="Choose the timestamp for your required articles"
      >
        <Select
          label="Articles From"
          options={TIME_RANGE_OPTIONS}
          value={resolveTimeRangeValue(filters.timeRange)}
          onChange={(e) => setFilters({ timeRange: e.target.value })}
          containerClassName="max-w-[360px]"
        />
      </FilterGroupCard>

      <FilterGroupCard
        title="Clinical study types"
        description="Applied to clinical evidence retrieval"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-3">
            {CLINICAL_STUDY_TYPES.map((type) => (
              <Chip
                key={type.id}
                selected={filters.clinicalStudyTypes.includes(type.id)}
                onClick={() => toggleClinicalStudyType(type.id)}
              >
                {type.label}
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Evidence Synthesis"
              options={EVIDENCE_SYNTHESIS_OPTIONS}
              value={filters.evidenceSynthesis}
              clearable
              onChange={(e) =>
                setFilters({ evidenceSynthesis: e.target.value })
              }
            />
            <Select
              label="Specialized Trial Structures"
              options={SPECIALIZED_TRIAL_STRUCTURES_OPTIONS}
              value={filters.specializedTrialStructures}
              clearable
              onChange={(e) =>
                setFilters({ specializedTrialStructures: e.target.value })
              }
            />
            <Select
              label="Study Duration"
              options={STUDY_DURATION_OPTIONS}
              value={filters.studyDuration}
              clearable
              onChange={(e) => setFilters({ studyDuration: e.target.value })}
            />
          </div>
          <ChipFilterSection
            title="Population Type"
            options={POPULATION_TYPE_OPTIONS}
            selected={filters.populationType}
            onToggle={togglePopulationType}
          />
        </div>
      </FilterGroupCard>

      <FilterGroupCard
        title="Economic study types"
        description="Applied to economic evidence retrieval"
      >
        <div className="flex flex-wrap gap-3">
          {ECONOMIC_STUDY_TYPES.map((type) => (
            <Chip
              key={type.id}
              selected={filters.economicStudyTypes.includes(type.id)}
              onClick={() => toggleEconomicStudyType(type.id)}
            >
              {type.label}
            </Chip>
          ))}
        </div>
      </FilterGroupCard>

      <FilterGroupCard
        title="Evidence refinement"
        description="Narrow outcomes, quality, and comparators"
      >
        <div className="flex flex-col gap-6">
          <ChipFilterSection
            title="Outcome / Evidence Focus"
            options={OUTCOME_EVIDENCE_FOCUS_OPTIONS}
            selected={filters.outcomeEvidenceFocus}
            onToggle={toggleOutcomeEvidenceFocus}
          />
          <ChipFilterSection
            title="Evidence Quality"
            options={EVIDENCE_QUALITY_OPTIONS}
            selected={filters.evidenceQuality}
            onToggle={toggleEvidenceQuality}
          />
          <ChipFilterSection
            title="Comparator Type"
            options={COMPARATOR_TYPE_OPTIONS}
            selected={filters.comparatorType}
            onToggle={toggleComparatorType}
          />
        </div>
      </FilterGroupCard>
    </div>
  );
}
