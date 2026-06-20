"use client";

import { Chip, Select } from "@/components/ui";
import { FilterGroupCard } from "../FilterGroupCard";
import { useReportWizardStore } from "../../store/useReportWizardStore";

const TIME_RANGE_OPTIONS = [
  { value: "last-1-year", label: "Last 1 Year" },
  { value: "last-2-years", label: "Last 2 Years" },
  { value: "last-5-years", label: "Last 5 Years" },
  { value: "last-10-years", label: "Last 10 Years" },
];

const CLINICAL_STUDY_TYPES = [
  { id: "rcts", label: "Randomized Controlled Trials (RCTs)" },
  { id: "controlledtrials", label: "Controlled Trials" },
  { id: "earlyphaseclinicaltrials", label: "Early Phase Clinical Trials" },
  { id: "phase-i", label: "Phase I Clinical Trials" },
  { id: "phase-ii", label: "Phase II Clinical Trials" },
  { id: "phase-iii", label: "Phase III Clinical Trials" },
  { id: "phase-iv", label: "Phase IV Clinical Trials" },
  { id: "postmarketingclinicaltrials", label: "Post-Marketing Clinical Trials" },
  { id: "ongoingclinicaltrials", label: "Ongoing Clinical Trials" },
  { id: "realworldevidence", label: "Real-World Evidence" },
  { id: "observational", label: "Observational Studies" },
  { id: "cohort", label: "Cohort Studies" },
  { id: "registrystudies", label: "Registry Studies" },
  { id: "pragmatictrials", label: "Pragmatic Trials" },
  { id: "singlearmtrials", label: "Single-Arm Trials" },
];

const ECONOMIC_STUDY_TYPES = [
  { id: "cost-effectiveness", label: "Cost-Effectiveness" },
  { id: "budget-impact", label: "Budget Impact" },
  { id: "cost-utility", label: "Cost-Utility" },
  { id: "pharmacoeconomic-studies", label: "Pharmacoeconomic Studies" },
  { id: "resource-utilization", label: "Resource Utilization" },
  { id: "cost-burden-analysis", label: "Cost-Burden Analysis" },
  { id: "reimbursement-evidence", label: "Reimbursement Evidence" },
];

const EVIDENCE_SYNTHESIS_OPTIONS = [
  { value: "meta-analyses", label: "Meta-Analyses" },
  { value: "network-meta-analyses", label: "Network Meta-Analyses" },
  { value: "systematic-reviews", label: "Systematic Reviews" },
];

const SPECIALIZED_TRIAL_STRUCTURES_OPTIONS = [
  { value: "basket-trials", label: "Basket Trials" },
  { value: "umbrella-trials", label: "Umbrella Trials" },
  { value: "extension-trials", label: "Extension Trials" },
  { value: "long-term-extension-trials", label: "Long-Term Extension Trials" },
];

const POPULATION_TYPE_OPTIONS = [
  { value: "adult", label: "Adult" },
  { value: "pediatric", label: "Pediatric" },
  { value: "elderly", label: "Elderly" },
  { value: "pregnant-population", label: "Pregnant Population" },
  { value: "high-risk-population", label: "High-Risk Population" },
  { value: "renal-impairment", label: "Renal Impairment" },
  { value: "hepatic-impairment", label: "Hepatic Impairment" },
  { value: "biomarker-positive-population", label: "Biomarker-Positive Population" },
  { value: "oncology-line-of-therapy", label: "Oncology Line of Therapy" },
  { value: "general-population", label: "General Population" },
];

const STUDY_DURATION_OPTIONS = [
  { value: "short-term", label: "Short-Term (<6 months)" },
  { value: "mid-term", label: "Mid-Term (6–12 months)" },
  { value: "long-term", label: "Long-Term (1+ years)" },
  { value: "very-long-term", label: "Very Long-Term (5+ years)" },
];

const COST_POPULATION_TYPE_OPTIONS = [
  { value: "adult", label: "Adult" },
  { value: "pediatric", label: "Pediatric" },
  { value: "elderly", label: "Elderly" },
  { value: "high-risk-population", label: "High-Risk Population" },
  { value: "renal-impairment", label: "Renal Impairment" },
  { value: "hepatic-impairment", label: "Hepatic Impairment" },
  { value: "general-population", label: "General Population" },
];

const PATIENT_RANGE_OPTIONS = [
  { value: "single-patient", label: "Single Patient" },
  { value: "about-50-patients", label: "~50 Patients" },
  { value: "about-100-patients", label: "~100 Patients" },
];

const OUTCOME_EVIDENCE_FOCUS_OPTIONS = [
  { value: "efficacy", label: "Efficacy" },
  { value: "safety", label: "Safety" },
  { value: "survival-outcomes", label: "Survival Outcomes" },
  { value: "quality-of-life", label: "Quality of Life" },
  { value: "economic-outcomes", label: "Economic Outcomes" },
  { value: "adherence-outcomes", label: "Adherence Outcomes" },
  { value: "hospitalization-impact", label: "Hospitalization Impact" },
];

const GEOGRAPHY_REGULATORY_REGION_OPTIONS = [
  { value: "global", label: "Global" },
  {
    value: "gcc-middle-east",
    label: "GCC / Middle East (By Default)",
  },
];

const EVIDENCE_QUALITY_OPTIONS = [
  { value: "peer-reviewed-only", label: "Peer Reviewed Only" },
  { value: "most-cited-studies", label: "Most Cited Studies" },
  { value: "recent-evidence-only", label: "Recent Evidence Only" },
];

const COMPARATOR_TYPE_OPTIONS = [
  { value: "placebo", label: "Placebo" },
  { value: "standard-of-care", label: "Standard of Care" },
  { value: "active-comparator", label: "Active Comparator" },
  { value: "competitor-drug", label: "Competitor Drug" },
  { value: "combination-therapy", label: "Combination Therapy" },
  { value: "historical-control", label: "Historical Control" },
  { value: "no-comparator", label: "No Comparator" },
];

const AVERAGE_WEIGHT_OPTIONS = [
  { value: "under-50kg", label: "< 50 kg" },
  { value: "50-70kg", label: "50–70 kg" },
  { value: "70-90kg", label: "70–90 kg" },
  { value: "90-110kg", label: "90–110 kg" },
  { value: "over-110kg", label: "> 110 kg" },
];

const GENDER_DISTRIBUTION_OPTIONS = [
  { value: "mostly-male", label: "Mostly Male (>70%)" },
  { value: "male-majority", label: "Male Majority (50–70%)" },
  { value: "balanced", label: "Balanced Distribution" },
  { value: "female-majority", label: "Female Majority (50–70%)" },
  { value: "mostly-female", label: "Mostly Female (>70%)" },
];

const TREATMENT_DURATION_OPTIONS = [
  { value: "acute", label: "Acute (<30 days)" },
  { value: "short-term", label: "Short-Term (1–6 months)" },
  { value: "medium-term", label: "Medium-Term (6–12 months)" },
  { value: "long-term", label: "Long-Term (1–3 years)" },
  { value: "chronic", label: "Chronic (>3 years)" },
];

const DOSAGE_FREQUENCY_OPTIONS = [
  { value: "once-daily", label: "Once Daily" },
  { value: "twice-daily", label: "Twice Daily" },
  { value: "three-times-daily", label: "Three Times Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "as-needed", label: "As Needed (PRN)" },
];

const REGION_PRICING_MARKET_OPTIONS = [
  { value: "gcc", label: "GCC" },
  { value: "saudi-arabia", label: "Saudi Arabia" },
  { value: "uae", label: "United Arab Emirates" },
  { value: "qatar", label: "Qatar" },
  { value: "kuwait", label: "Kuwait" },
  { value: "oman", label: "Oman" },
  { value: "bahrain", label: "Bahrain" },
  { value: "middle-east", label: "Middle East" },
  { value: "europe", label: "Europe" },
  { value: "north-america", label: "North America" },
  { value: "global", label: "Global" },
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
            label="Population Type"
            options={POPULATION_TYPE_OPTIONS}
            value={filters.populationType}
            clearable
            onChange={(e) =>
              setFilters({ populationType: e.target.value })
            }
          />
          <Select
            label="Study Duration"
            options={STUDY_DURATION_OPTIONS}
            value={filters.studyDuration}
            clearable
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
            options={COST_POPULATION_TYPE_OPTIONS}
            value={filters.costPopulationType}
            clearable
            onChange={(e) =>
              setFilters({ costPopulationType: e.target.value })
            }
          />
          <Select
            label="Patient Range / Volume"
            options={PATIENT_RANGE_OPTIONS}
            value={filters.patientRange}
            clearable
            onChange={(e) => setFilters({ patientRange: e.target.value })}
          />
          <Select
            label="Study Duration"
            options={STUDY_DURATION_OPTIONS}
            value={filters.costStudyDuration}
            clearable
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
      <FilterGroupCard title={null} description={null}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="w-full md:w-80">
            <Select
              label="Outcome / Evidence Focus"
              options={OUTCOME_EVIDENCE_FOCUS_OPTIONS}
              value={filters.outcomeEvidenceFocus}
              clearable
              onChange={(e) =>
                setFilters({ outcomeEvidenceFocus: e.target.value })
              }
            />
          </div>

          <div className="w-full md:w-80">
            <Select
              label="Geography / Regulatory Region"
              options={GEOGRAPHY_REGULATORY_REGION_OPTIONS}
              value={filters.geographyRegulatoryRegion}
              onChange={(e) =>
                setFilters({ geographyRegulatoryRegion: e.target.value })
              }
            />
          </div>
        </div>
      </FilterGroupCard>
      <FilterGroupCard title={null} description={null}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="w-full md:w-80">
            <Select
              label="Evidence Quality"
              options={EVIDENCE_QUALITY_OPTIONS}
              value={filters.evidenceQuality}
              clearable
              onChange={(e) =>
                setFilters({ evidenceQuality: e.target.value })
              }
            />
          </div>
        </div>
      </FilterGroupCard>
      <FilterGroupCard title={null} description={null}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="w-full md:w-80">
            <Select
              label="Comparator Type"
              options={COMPARATOR_TYPE_OPTIONS}
              value={filters.comparatorType}
              clearable
              menuPlacement="top"
              onChange={(e) =>
                setFilters({ comparatorType: e.target.value })
              }
            />
          </div>
        </div>
      </FilterGroupCard>
    </div>
  );
}
