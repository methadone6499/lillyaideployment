export const TIME_RANGE_OPTIONS = [
  { value: "last-1-year", label: "Last 1 Year" },
  { value: "last-3-years", label: "Last 3 Years" },
  { value: "last-5-years", label: "Last 5 Years" },
  { value: "last-10-years", label: "Last 10 Years" },
  { value: "custom-date-range", label: "Custom Date Range" },
];

export const CLINICAL_STUDY_TYPES = [
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

export const ECONOMIC_STUDY_TYPES = [
  { id: "cost-effectiveness", label: "Cost-Effectiveness" },
  { id: "budget-impact", label: "Budget Impact" },
  { id: "cost-utility", label: "Cost-Utility" },
  { id: "pharmacoeconomic-studies", label: "Pharmacoeconomic Studies" },
  { id: "resource-utilization", label: "Resource Utilization" },
  { id: "cost-burden-analysis", label: "Cost-Burden Analysis" },
  { id: "reimbursement-evidence", label: "Reimbursement Evidence" },
];

export const EVIDENCE_SYNTHESIS_OPTIONS = [
  { value: "meta-analyses", label: "Meta-Analyses" },
  { value: "network-meta-analyses", label: "Network Meta-Analyses" },
  { value: "systematic-reviews", label: "Systematic Reviews" },
];

export const SPECIALIZED_TRIAL_STRUCTURES_OPTIONS = [
  { value: "basket-trials", label: "Basket Trials" },
  { value: "umbrella-trials", label: "Umbrella Trials" },
  { value: "extension-trials", label: "Extension Trials" },
  { value: "long-term-extension-trials", label: "Long-Term Extension Trials" },
];

export const POPULATION_TYPE_OPTIONS = [
  { id: "adult", label: "Adult" },
  { id: "pediatric", label: "Pediatric" },
  { id: "elderly", label: "Elderly" },
  { id: "pregnant-population", label: "Pregnant Population" },
  { id: "high-risk-population", label: "High-Risk Population" },
  { id: "renal-impairment", label: "Renal Impairment" },
  { id: "hepatic-impairment", label: "Hepatic Impairment" },
  { id: "biomarker-positive-population", label: "Biomarker-Positive Population" },
  { id: "oncology-line-of-therapy", label: "Oncology Line of Therapy" },
  { id: "general-population", label: "General Population" },
];

export const STUDY_DURATION_OPTIONS = [
  { value: "short-term", label: "Short-Term (<6 months)" },
  { value: "mid-term", label: "Mid-Term (6–12 months)" },
  { value: "long-term", label: "Long-Term (1+ years)" },
  { value: "very-long-term", label: "Very Long-Term (5+ years)" },
];

export const OUTCOME_EVIDENCE_FOCUS_OPTIONS = [
  { id: "efficacy", label: "Efficacy" },
  { id: "safety", label: "Safety" },
  { id: "survival-outcomes", label: "Survival Outcomes" },
  { id: "quality-of-life", label: "Quality of Life" },
  { id: "economic-outcomes", label: "Economic Outcomes" },
  { id: "adherence-outcomes", label: "Adherence Outcomes" },
  { id: "hospitalization-impact", label: "Hospitalization Impact" },
];

export const GEOGRAPHY_REGULATORY_REGION_OPTIONS = [
  { id: "global", label: "Global" },
  { id: "gcc-middle-east", label: "GCC / Middle East" },
  { id: "europe", label: "Europe" },
  { id: "usa", label: "USA" },
];

export const EVIDENCE_QUALITY_OPTIONS = [
  { id: "peer-reviewed-only", label: "Peer Reviewed Only" },
  { id: "most-cited-studies", label: "Most Cited Studies" },
  { id: "recent-evidence-only", label: "Recent Evidence Only" },
];

export const COMPARATOR_TYPE_OPTIONS = [
  { id: "placebo", label: "Placebo" },
  { id: "standard-of-care", label: "Standard of Care" },
  { id: "active-comparator", label: "Active Comparator" },
  { id: "competitor-drug", label: "Competitor Drug" },
  { id: "combination-therapy", label: "Combination Therapy" },
  { id: "historical-control", label: "Historical Control" },
  { id: "no-comparator", label: "No Comparator" },
];

export const AVERAGE_WEIGHT_OPTIONS = [
  { value: "under-50kg", label: "< 50 kg" },
  { value: "50-70kg", label: "50–70 kg" },
  { value: "70-90kg", label: "70–90 kg" },
  { value: "90-110kg", label: "90–110 kg" },
  { value: "over-110kg", label: "> 110 kg" },
];

export const GENDER_DISTRIBUTION_OPTIONS = [
  { value: "mostly-male", label: "Mostly Male (>70%)" },
  { value: "male-majority", label: "Male Majority (50–70%)" },
  { value: "balanced", label: "Balanced Distribution" },
  { value: "female-majority", label: "Female Majority (50–70%)" },
  { value: "mostly-female", label: "Mostly Female (>70%)" },
];

export const TREATMENT_DURATION_OPTIONS = [
  { value: "acute", label: "Acute (<30 days)" },
  { value: "short-term", label: "Short-Term (1–6 months)" },
  { value: "medium-term", label: "Medium-Term (6–12 months)" },
  { value: "long-term", label: "Long-Term (1–3 years)" },
  { value: "chronic", label: "Chronic (>3 years)" },
];

export const DOSAGE_FREQUENCY_OPTIONS = [
  { value: "once-daily", label: "Once Daily" },
  { value: "twice-daily", label: "Twice Daily" },
  { value: "three-times-daily", label: "Three Times Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "as-needed", label: "As Needed (PRN)" },
];

export const REGION_PRICING_MARKET_OPTIONS = [
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
