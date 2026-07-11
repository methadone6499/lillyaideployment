"use client";

import { Chip, Select, TextField } from "@/components/ui";
import { FilterGroupCard } from "../FilterGroupCard";
import { useReportWizardStore } from "../../store/useReportWizardStore";
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
} from "../../utils/filterOptions";

function toDateInputValue(backendDate: string): string {
  if (!backendDate) {
    return "";
  }

  return backendDate.replace(/\//g, "-");
}

function toBackendDateFormat(inputDate: string): string {
  if (!inputDate) {
    return "";
  }

  return inputDate.replace(/-/g, "/");
}

function resolveTimeRangeValue(timeRange: string): string {
  if (timeRange === "last-2-years") {
    return "last-3-years";
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
  const toggleGeographyRegulatoryRegion = useReportWizardStore(
    (s) => s.toggleGeographyRegulatoryRegion,
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

  const isCustomDateRange = filters.timeRange === "custom-date-range";

  return (
    <div className="flex flex-col gap-6">
      <FilterGroupCard
        title="Time Range"
        description="Choose the timestamp for your required articles"
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Articles From"
            options={TIME_RANGE_OPTIONS}
            value={resolveTimeRangeValue(filters.timeRange)}
            onChange={(e) => setFilters({ timeRange: e.target.value })}
            containerClassName="max-w-[360px]"
          />
          {isCustomDateRange && (
            <div className="grid max-w-[480px] grid-cols-1 gap-4 md:grid-cols-2">
              <TextField
                label="From"
                type="date"
                value={toDateInputValue(filters.customDateFrom)}
                onChange={(e) =>
                  setFilters({
                    customDateFrom: toBackendDateFormat(e.target.value),
                  })
                }
              />
              <TextField
                label="To"
                type="date"
                value={toDateInputValue(filters.customDateTo)}
                onChange={(e) =>
                  setFilters({
                    customDateTo: toBackendDateFormat(e.target.value),
                  })
                }
              />
            </div>
          )}
        </div>
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
        title="Cost Analysis"
        description="Configure cost analysis parameters for economic evidence"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TextField
            label="Patient Volume"
            type="number"
            min={0}
            inputMode="numeric"
            value={filters.costPatientVolume}
            onChange={(e) =>
              setFilters({ costPatientVolume: e.target.value })
            }
            placeholder="e.g. 100"
          />
          <TextField
            label="Treatment Duration (days)"
            type="number"
            min={0}
            inputMode="numeric"
            value={filters.costTreatmentDurationDays}
            onChange={(e) =>
              setFilters({ costTreatmentDurationDays: e.target.value })
            }
            placeholder="e.g. 365"
          />
          <TextField
            label="Unit Price"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={filters.costUnitPrice}
            onChange={(e) => setFilters({ costUnitPrice: e.target.value })}
            placeholder="e.g. 250.00"
          />
          <Select
            label="Dosage Frequency"
            options={DOSAGE_FREQUENCY_OPTIONS}
            value={filters.costDosageFrequency}
            clearable
            onChange={(e) =>
              setFilters({ costDosageFrequency: e.target.value })
            }
          />
          <Select
            label="Region"
            options={REGION_PRICING_MARKET_OPTIONS}
            value={filters.costRegion}
            clearable
            onChange={(e) => setFilters({ costRegion: e.target.value })}
          />
        </div>
      </FilterGroupCard>

      <FilterGroupCard
        title="Optional source filters"
        description="Fine-tune per evidence report"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Select
            label="Average Weight"
            options={AVERAGE_WEIGHT_OPTIONS}
            value={filters.averageWeight}
            clearable
            onChange={(e) => setFilters({ averageWeight: e.target.value })}
          />
          <Select
            label="Gender Distribution"
            options={GENDER_DISTRIBUTION_OPTIONS}
            value={filters.genderDistribution}
            clearable
            onChange={(e) =>
              setFilters({ genderDistribution: e.target.value })
            }
          />
          <Select
            label="Treatment Duration"
            options={TREATMENT_DURATION_OPTIONS}
            value={filters.treatmentDuration}
            clearable
            onChange={(e) =>
              setFilters({ treatmentDuration: e.target.value })
            }
          />
          <Select
            label="Dosage Frequency"
            options={DOSAGE_FREQUENCY_OPTIONS}
            value={filters.dosageFrequency}
            clearable
            onChange={(e) =>
              setFilters({ dosageFrequency: e.target.value })
            }
          />
          <Select
            label="Region / Pricing Market"
            options={REGION_PRICING_MARKET_OPTIONS}
            value={filters.regionPricingMarket}
            clearable
            onChange={(e) =>
              setFilters({ regionPricingMarket: e.target.value })
            }
          />
        </div>
      </FilterGroupCard>

      <FilterGroupCard
        title="Evidence refinement"
        description="Narrow outcomes, geography, quality, and comparators"
      >
        <div className="flex flex-col gap-6">
          <ChipFilterSection
            title="Outcome / Evidence Focus"
            options={OUTCOME_EVIDENCE_FOCUS_OPTIONS}
            selected={filters.outcomeEvidenceFocus}
            onToggle={toggleOutcomeEvidenceFocus}
          />
          <ChipFilterSection
            title="Geography / Regulatory Region"
            options={GEOGRAPHY_REGULATORY_REGION_OPTIONS}
            selected={filters.geographyRegulatoryRegion}
            onToggle={toggleGeographyRegulatoryRegion}
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
