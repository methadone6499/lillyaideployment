"use client";

import { Chip, Select } from "@/components/ui";
import { FilterGroupCard } from "../FilterGroupCard";
import { useReportWizardStore } from "../../store/useReportWizardStore";

const TIME_RANGE_OPTIONS = [
  { value: "last-1-year", label: "Last 1 Year" },
  { value: "last-2-years", label: "Last 2 Years" },
  { value: "last-5-years", label: "Last 5 Years" },
  { value: "all-time", label: "All Time" },
];

const CLINICAL_STUDY_TYPES = [
  { id: "rcts", label: "Randomized Controlled Trials (RCTs)" },
  { id: "phase-ii", label: "Phase II Clinical Trials" },
  { id: "observational", label: "Observational Studies" },
  { id: "cohort", label: "Cohort Studies" },
  { id: "case-control", label: "Case-Control Studies" },
  { id: "cross-sectional", label: "Cross-Sectional Studies" },
];

const ECONOMIC_STUDY_TYPES = [
  { id: "cost-effectiveness", label: "Cost-Effectiveness" },
  { id: "resource-utilization", label: "Resource Utilization" },
  { id: "budget-impact", label: "Budget Impact" },
  { id: "cost-utility", label: "Cost-Utility" },
];

const SELECT_OPTIONS = [
  { value: "option-1", label: "Option 1" },
  { value: "option-2", label: "Option 2" },
  { value: "option-3", label: "Option 3" },
];

export function Step2Filters() {
  const filters = useReportWizardStore((s) => s.filters);
  const setFilters = useReportWizardStore((s) => s.setFilters);
  const toggleClinicalStudyType = useReportWizardStore(
    (s) => s.toggleClinicalStudyType,
  );
  const toggleEconomicStudyType = useReportWizardStore(
    (s) => s.toggleEconomicStudyType,
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
          value={filters.timeRange}
          onChange={(e) => setFilters({ timeRange: e.target.value })}
          containerClassName="max-w-[360px]"
        />
      </FilterGroupCard>

      <FilterGroupCard
        title="Clinical study types"
        description="Applied to clinical evidence retrieval"
      >
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Evidence Synthesis"
            options={SELECT_OPTIONS}
            value={filters.evidenceSynthesis}
            onChange={(e) =>
              setFilters({ evidenceSynthesis: e.target.value })
            }
          />
          <Select
            label="Specialized Trial Structures"
            options={SELECT_OPTIONS}
            value={filters.specializedTrialStructures}
            onChange={(e) =>
              setFilters({ specializedTrialStructures: e.target.value })
            }
          />
          <Select
            label="Population Type"
            options={SELECT_OPTIONS}
            value={filters.populationType}
            onChange={(e) =>
              setFilters({ populationType: e.target.value })
            }
          />
          <Select
            label="Study Duration"
            options={SELECT_OPTIONS}
            value={filters.studyDuration}
            onChange={(e) =>
              setFilters({ studyDuration: e.target.value })
            }
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
        description="Analyze the cost of the overall evidence advancement"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Population Type"
            options={SELECT_OPTIONS}
            value={filters.costPopulationType}
            onChange={(e) =>
              setFilters({ costPopulationType: e.target.value })
            }
          />
          <Select
            label="Patient Range / Volume"
            options={SELECT_OPTIONS}
            value={filters.patientRange}
            onChange={(e) => setFilters({ patientRange: e.target.value })}
          />
          <Select
            label="Population Type"
            options={SELECT_OPTIONS}
            value={filters.costPopulationTypeSecondary}
            onChange={(e) =>
              setFilters({ costPopulationTypeSecondary: e.target.value })
            }
          />
          <Select
            label="Study Duration"
            options={SELECT_OPTIONS}
            value={filters.costStudyDuration}
            onChange={(e) =>
              setFilters({ costStudyDuration: e.target.value })
            }
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
            options={SELECT_OPTIONS}
            value={filters.averageWeight}
            onChange={(e) => setFilters({ averageWeight: e.target.value })}
          />
          <Select
            label="Gender Distribution"
            options={SELECT_OPTIONS}
            value={filters.genderDistribution}
            onChange={(e) =>
              setFilters({ genderDistribution: e.target.value })
            }
          />
          <Select
            label="Treatment Duration"
            options={SELECT_OPTIONS}
            value={filters.treatmentDuration}
            onChange={(e) =>
              setFilters({ treatmentDuration: e.target.value })
            }
          />
          <Select
            label="Dosage Frequency"
            options={SELECT_OPTIONS}
            value={filters.dosageFrequency}
            onChange={(e) =>
              setFilters({ dosageFrequency: e.target.value })
            }
          />
          <Select
            label="Region / Pricing Market"
            options={SELECT_OPTIONS}
            value={filters.regionPricingMarket}
            onChange={(e) =>
              setFilters({ regionPricingMarket: e.target.value })
            }
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Outcome / Evidence Focus"
            options={SELECT_OPTIONS}
            value={filters.outcomeEvidenceFocus}
            onChange={(e) =>
              setFilters({ outcomeEvidenceFocus: e.target.value })
            }
          />
          <Select
            label="Geography / Regulatory Region"
            options={SELECT_OPTIONS}
            value={filters.geographyRegulatoryRegion}
            onChange={(e) =>
              setFilters({ geographyRegulatoryRegion: e.target.value })
            }
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Evidence Quality"
            options={SELECT_OPTIONS}
            value={filters.evidenceQuality}
            onChange={(e) =>
              setFilters({ evidenceQuality: e.target.value })
            }
          />
          <Select
            label="Comparator Type"
            options={SELECT_OPTIONS}
            value={filters.comparatorType}
            onChange={(e) =>
              setFilters({ comparatorType: e.target.value })
            }
          />
        </div>
      </FilterGroupCard>
    </div>
  );
}
