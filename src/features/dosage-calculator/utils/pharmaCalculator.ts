import type {
  BudgetImpactRequest,
  BudgetImpactResponse,
  CostAnalysisRequest,
  CostAnalysisResponse,
  DailyMedSuggestionRequest,
  DailyMedSuggestionResponse,
  DosingRequest,
  DosingResponse,
} from "../schemas/pharmaCalculatorSchemas";

export const PHARMA_CURRENCIES = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  SAR: "﷼",
  AED: "د.إ ",
  EGP: "E£",
  JPY: "¥",
  INR: "₹",
  BRL: "R$",
  CAD: "C$",
} as const;

export type PharmaCurrency = keyof typeof PHARMA_CURRENCIES;

export type DosingInputs = {
  unitCost: number;
  unitSize: number;
  doseAmount: number;
  dosesPerDay: number;
  daysPerYear: number;
  doseType: "fixed" | "weight_based";
  patientWeight: number;
  wastagePercent: number;
};

export type DosingResult = {
  dosePerAdministration: number;
  actualDosePerDay: number;
  unitsPerAdministration: number;
  annualUnitsBeforeWastage: number;
  annualUnits: number;
  annualDrugCost: number;
};

export type LabelSuggestionInputs = {
  category: string;
  patientWeight: number;
  frequency: string;
  duration: string;
};

export type CostAnalysisInputs = {
  drugName: string;
  indication: string;
  dosageForm: string;
  drugClass: string;
  annualDrugCost: number;
  administration: number;
  monitoring: number;
  labDiagnostics: number;
  outpatientVisits: number;
  adverseEventManagement: number;
  adverseEventRatePercent: number;
  hospitalizations: number;
  otherDirectCosts: number;
  hospitalizationAvoidance: number;
  otherOffsets: number;
  comparatorName: string;
  comparatorAnnualCost: number;
  comparatorExtraCost: number;
  comparatorOffsets: number;
  estimatedPatients: number;
  comparatorPatients: number;
};

export type CostComponent = {
  label: string;
  value: number;
  color: string;
};

export type CostAnalysisResult = {
  inputs: CostAnalysisInputs;
  components: CostComponent[];
  offsetComponents: CostComponent[];
  grossCost: number;
  totalOffsets: number;
  netCost: number;
  expectedAdverseEventCost: number;
  comparatorNetCost: number;
  perPatientDifference: number;
  totalGrossCost: number;
  totalNetCost: number;
  totalComparatorCost: number;
  totalDifference: number;
  hasComparator: boolean;
  componentTable: CostAnalysisResponse["component_table"];
  comparisonTable: NonNullable<CostAnalysisResponse["comparison_table"]>;
};

export type CurrentTreatmentInputs = {
  name: string;
  drugPrice: number;
  extraCareCost: number;
  savings: number;
};

export type BudgetImpactInputs = {
  perspective: string;
  horizon: 3 | 5;
  drugName: string;
  indication: string;
  annualDrugCost: number;
  administrationAndMonitoring: number;
  adverseEventCost: number;
  offsets: number;
  wastagePercent: number;
  currentTreatment: CurrentTreatmentInputs;
  hospitalBeds: number;
  bedOccupancyPercent: number;
  prevalencePercent: number;
  diagnosisRatePercent: number;
  eligiblePercent: number;
  averageLengthOfStay: number;
  populationGrowthPercent: number;
  inflationPercent: number;
  uptakePercent: number[];
  conservativeUptakeFactor: number;
  optimisticUptakeFactor: number;
  conservativeCostIncreasePercent: number;
  optimisticCostDecreasePercent: number;
  notes: string;
};

export type BudgetImpactYear = {
  year: number;
  population: number;
  newDrugPatients: number;
  currentTreatmentPatients: number;
  uptakePercent: number;
  totalSpend: number;
  baselineSpend: number;
  incrementalImpact: number;
  cumulativeImpact: number;
  newDrugCostPerPatient: number;
  currentTreatmentCostPerPatient: number;
  perPatientDifference: number;
};

export type BudgetImpactModel = {
  years: BudgetImpactYear[];
  cumulativeImpact: number;
  eligiblePopulationYearOne: number;
  currentTreatmentCost: number;
  newDrugNetCost: number;
};

export type SensitivityResult = {
  label: string;
  low: number;
  base: number;
  high: number;
  range: number;
};

export type BudgetImpactAnalysis = {
  inputs: BudgetImpactInputs;
  base: BudgetImpactModel;
  conservative: BudgetImpactModel;
  optimistic: BudgetImpactModel;
  sensitivity: SensitivityResult[];
  assumptions: BudgetImpactResponse["assumptions"];
  chartData: BudgetImpactResponse["chart_data"];
  analysisDate: string;
};

const COMPONENT_COLORS = [
  "#10b981",
  "#34d399",
  "#6ee7b7",
  "#a7f3d0",
  "#60a5fa",
  "#fbbf24",
  "#f97316",
  "#a78bfa",
] as const;

export const DEFAULT_UPTAKE = [15, 35, 55, 65, 70] as const;

export function formatPharmaCurrency(
  value: number,
  currency: PharmaCurrency,
): string {
  const symbol = PHARMA_CURRENCIES[currency];
  const absolute = Math.abs(Number.isFinite(value) ? value : 0);
  const sign = value < 0 ? "−" : "";

  if (absolute >= 1_000_000_000) {
    return `${sign}${symbol}${(absolute / 1_000_000_000).toFixed(2)}B`;
  }
  if (absolute >= 1_000_000) {
    return `${sign}${symbol}${(absolute / 1_000_000).toFixed(2)}M`;
  }
  if (absolute >= 1_000) {
    return `${sign}${symbol}${(absolute / 1_000).toFixed(1)}K`;
  }

  return `${sign}${symbol}${absolute.toFixed(0)}`;
}

export function formatWholeNumber(value: number): string {
  return Math.round(Number.isFinite(value) ? value : 0).toLocaleString();
}

export function toDosingRequest(inputs: DosingInputs): DosingRequest {
  return {
    unit_cost: inputs.unitCost,
    unit_size: inputs.unitSize,
    dose: inputs.doseAmount,
    times_per_day: inputs.dosesPerDay,
    days_per_year: inputs.daysPerYear,
    dose_type: inputs.doseType,
    patient_weight: inputs.patientWeight,
    wastage_percent: inputs.wastagePercent,
  };
}

export function toDosingResult(response: DosingResponse): DosingResult {
  return {
    dosePerAdministration: response.dose_per_administration,
    actualDosePerDay: response.actual_dose_per_day,
    unitsPerAdministration: response.units_per_administration,
    annualUnitsBeforeWastage: response.annual_units_before_wastage,
    annualUnits: response.annual_units,
    annualDrugCost: response.annual_drug_cost,
  };
}

export function toDailyMedSuggestionRequest(
  drugName: string,
  indication: string,
  inputs: LabelSuggestionInputs,
): DailyMedSuggestionRequest {
  return {
    drug: drugName,
    indication,
    category: inputs.category,
    patient_weight: inputs.patientWeight,
    frequency: inputs.frequency,
    duration: inputs.duration,
  };
}

export function applyDailyMedSuggestion(
  inputs: DosingInputs,
  response: DailyMedSuggestionResponse,
): DosingInputs {
  const suggestion = response.suggestions;
  if (!suggestion) return inputs;

  return {
    ...inputs,
    unitSize: suggestion.unit_size ?? inputs.unitSize,
    doseAmount: suggestion.dose,
    dosesPerDay: suggestion.times_per_day ?? inputs.dosesPerDay,
    daysPerYear: suggestion.days_per_year ?? inputs.daysPerYear,
    doseType: suggestion.dose_type,
    patientWeight:
      suggestion.dose_type === "weight_based"
        ? (suggestion.patient_weight ?? inputs.patientWeight)
        : inputs.patientWeight,
  };
}

export function toCostAnalysisRequest(
  inputs: CostAnalysisInputs,
  currency: PharmaCurrency,
): CostAnalysisRequest {
  const comparatorName = inputs.comparatorName.trim();

  return {
    drug_name: inputs.drugName,
    indication: inputs.indication,
    dosage_form: inputs.dosageForm,
    drug_class: inputs.drugClass,
    currency,
    annual_costs: {
      drug_acquisition: inputs.annualDrugCost,
      administration: inputs.administration,
      monitoring: inputs.monitoring,
      laboratory_diagnostics: inputs.labDiagnostics,
      outpatient_visits: inputs.outpatientVisits,
      adverse_event_management: inputs.adverseEventManagement,
      adverse_event_rate_percent: inputs.adverseEventRatePercent,
      hospitalizations: inputs.hospitalizations,
      other_direct_costs: inputs.otherDirectCosts,
    },
    offsets: {
      hospitalization_avoidance: inputs.hospitalizationAvoidance,
      other_offsets: inputs.otherOffsets,
    },
    new_drug_patient_count: inputs.estimatedPatients,
    comparator: comparatorName
      ? {
          name: comparatorName,
          annual_drug_cost: inputs.comparatorAnnualCost,
          administration_and_monitoring: inputs.comparatorExtraCost,
          offsets: inputs.comparatorOffsets,
          patient_count: inputs.comparatorPatients,
        }
      : undefined,
  };
}

export function toCostAnalysisResult(
  inputs: CostAnalysisInputs,
  response: CostAnalysisResponse,
): CostAnalysisResult {
  const chartValues = response.component_chart.series[0]?.values ?? [];
  const components = response.component_chart.categories.map((label, index) => ({
    label,
    value: chartValues[index] ?? 0,
    color: COMPONENT_COLORS[index % COMPONENT_COLORS.length],
  }));
  const offsetComponents = response.component_table
    .filter((row) => row.per_patient < 0)
    .map((row, index) => ({
      label: row.component,
      value: Math.abs(row.per_patient),
      color: COMPONENT_COLORS[index],
    }));

  return {
    inputs: {
      ...inputs,
      estimatedPatients: response.programme.new_drug_patients,
      comparatorPatients:
        response.programme.comparator_patients ?? inputs.comparatorPatients,
    },
    components,
    offsetComponents,
    grossCost: response.per_patient.gross_annual_cost,
    totalOffsets: response.per_patient.total_offsets,
    netCost: response.per_patient.net_annual_cost,
    expectedAdverseEventCost: response.per_patient.expected_ae_cost,
    comparatorNetCost: response.per_patient.comparator_net_annual_cost ?? 0,
    perPatientDifference: response.per_patient.per_patient_difference ?? 0,
    totalGrossCost: response.programme.gross_programme_cost,
    totalNetCost: response.programme.net_programme_cost,
    totalComparatorCost: response.programme.comparator_programme_cost ?? 0,
    totalDifference: response.programme.programme_difference ?? 0,
    hasComparator: response.per_patient.comparator_net_annual_cost !== null,
    componentTable: response.component_table,
    comparisonTable: response.comparison_table ?? [],
  };
}

export function toBudgetImpactRequest(
  inputs: BudgetImpactInputs,
  currency: PharmaCurrency,
): BudgetImpactRequest {
  return {
    perspective: inputs.perspective,
    time_horizon: inputs.horizon,
    drug_name: inputs.drugName,
    indication: inputs.indication,
    currency,
    annual_drug_cost_per_patient: inputs.annualDrugCost,
    administration_and_monitoring: inputs.administrationAndMonitoring,
    expected_ae_cost: inputs.adverseEventCost,
    offsets: inputs.offsets,
    wastage_percent: inputs.wastagePercent,
    current_treatment: {
      name: inputs.currentTreatment.name,
      drug_price: inputs.currentTreatment.drugPrice,
      extra_care_cost: inputs.currentTreatment.extraCareCost,
      savings: inputs.currentTreatment.savings,
    },
    hospital_beds: inputs.hospitalBeds,
    bed_occupancy_percent: inputs.bedOccupancyPercent,
    prevalence_percent: inputs.prevalencePercent,
    diagnosis_rate_percent: inputs.diagnosisRatePercent,
    eligibility_percent: inputs.eligiblePercent,
    average_length_of_stay_days: inputs.averageLengthOfStay,
    annual_population_growth_percent: inputs.populationGrowthPercent,
    annual_inflation_percent: inputs.inflationPercent,
    uptake_percent: inputs.uptakePercent.slice(0, inputs.horizon),
    conservative_uptake_multiplier: inputs.conservativeUptakeFactor,
    optimistic_uptake_multiplier: inputs.optimisticUptakeFactor,
    conservative_cost_increase_percent:
      inputs.conservativeCostIncreasePercent,
    optimistic_cost_decrease_percent: inputs.optimisticCostDecreasePercent,
    notes: inputs.notes,
  };
}

function toBudgetImpactYear(
  year: BudgetImpactResponse["years"][number],
): BudgetImpactYear {
  return {
    year: year.year,
    population: year.eligible_population,
    newDrugPatients: year.new_treatment_patients,
    currentTreatmentPatients: year.current_treatment_patients,
    uptakePercent: year.uptake_percent,
    totalSpend: year.scenario_spend,
    baselineSpend: year.baseline_spend,
    incrementalImpact: year.annual_budget_impact,
    cumulativeImpact: year.cumulative_budget_impact,
    newDrugCostPerPatient: year.new_treatment_cost_per_patient,
    currentTreatmentCostPerPatient: year.current_treatment_cost_per_patient,
    perPatientDifference: year.per_patient_delta,
  };
}

function createScenarioModel(
  base: BudgetImpactModel,
  scenario: BudgetImpactResponse["scenarios"][number],
): BudgetImpactModel {
  let cumulativeImpact = 0;
  const years = base.years.map((year, index) => {
    const incrementalImpact =
      scenario.annual_budget_impact[index] ?? year.incrementalImpact;
    cumulativeImpact += incrementalImpact;

    return {
      ...year,
      totalSpend: year.baselineSpend + incrementalImpact,
      incrementalImpact,
      cumulativeImpact,
    };
  });

  return {
    ...base,
    years,
    cumulativeImpact: scenario.cumulative_budget_impact,
  };
}

export function toBudgetImpactAnalysis(
  inputs: BudgetImpactInputs,
  response: BudgetImpactResponse,
): BudgetImpactAnalysis {
  const base: BudgetImpactModel = {
    years: response.years.map(toBudgetImpactYear),
    cumulativeImpact: response.cumulative_budget_impact,
    eligiblePopulationYearOne: response.year_1_eligible_population,
    currentTreatmentCost: response.base_per_patient_costs.current_treatment,
    newDrugNetCost: response.base_per_patient_costs.new_treatment,
  };
  const conservativeScenario = response.scenarios.find(
    (scenario) => scenario.name === "conservative",
  );
  const optimisticScenario = response.scenarios.find(
    (scenario) => scenario.name === "optimistic",
  );

  return {
    inputs,
    base,
    conservative: conservativeScenario
      ? createScenarioModel(base, conservativeScenario)
      : base,
    optimistic: optimisticScenario
      ? createScenarioModel(base, optimisticScenario)
      : base,
    sensitivity: response.sensitivity.map((item) => ({
      label: item.parameter,
      low: item.low,
      base: item.base,
      high: item.high,
      range: item.impact_range,
    })),
    assumptions: response.assumptions,
    chartData: response.chart_data,
    analysisDate: new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
    }).format(new Date()),
  };
}

export function getPharmaCalculatorErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "The calculator could not complete this request. Check the inputs and try again.";
}
