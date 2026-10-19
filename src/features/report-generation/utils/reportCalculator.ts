import { z } from "zod";
import { getCalculatorValidationMessage } from "@/features/dosage-calculator";
import {
  reportBudgetImpactSelectionSchema,
  reportCostAnalysisSelectionSchema,
  reportDosingSelectionSchema,
} from "../schemas/reportSchemas";
import type { UpdateReportSelectionsInput } from "../types";

export type ReportCalculatorTab = "cost" | "budget";

export type ReportCalculatorDraft = {
  dosingEnabled: boolean;
  costAnalysisEnabled: boolean;
  budgetImpactEnabled: boolean;
  dosing: {
    unitCost: string;
    unitSize: string;
    dose: string;
    timesPerDay: string;
    daysPerYear: string;
    doseType: "fixed" | "weight_based";
    patientWeight: string;
    wastagePercent: string;
  };
  costAnalysis: {
    currency: string;
    drugAcquisition: string;
    administration: string;
    monitoring: string;
    laboratoryDiagnostics: string;
    outpatientVisits: string;
    adverseEventManagement: string;
    adverseEventRatePercent: string;
    hospitalizations: string;
    otherDirectCosts: string;
    hospitalizationAvoidance: string;
    otherOffsets: string;
    newDrugPatientCount: string;
    comparatorName: string;
    comparatorAnnualDrugCost: string;
    comparatorAdministrationAndMonitoring: string;
    comparatorOffsets: string;
    comparatorPatientCount: string;
  };
  budgetImpact: {
    perspective: string;
    timeHorizon: 3 | 5;
    currency: string;
    annualDrugCostPerPatient: string;
    administrationAndMonitoring: string;
    expectedAeCost: string;
    offsets: string;
    wastagePercent: string;
    currentTreatmentName: string;
    currentTreatmentDrugPrice: string;
    currentTreatmentExtraCareCost: string;
    currentTreatmentSavings: string;
    hospitalBeds: string;
    bedOccupancyPercent: string;
    prevalencePercent: string;
    diagnosisRatePercent: string;
    eligibilityPercent: string;
    averageLengthOfStayDays: string;
    annualPopulationGrowthPercent: string;
    annualInflationPercent: string;
    uptakePercent: [string, string, string, string, string];
    conservativeUptakeMultiplier: string;
    optimisticUptakeMultiplier: string;
    conservativeCostIncreasePercent: string;
    optimisticCostDecreasePercent: string;
    notes: string;
  };
};

export type ReportCalculatorSelections = Pick<
  UpdateReportSelectionsInput,
  "dosing" | "cost_analysis" | "budget_impact"
>;

export const EMPTY_REPORT_CALCULATOR_DRAFT: ReportCalculatorDraft = {
  dosingEnabled: false,
  costAnalysisEnabled: false,
  budgetImpactEnabled: false,
  dosing: {
    unitCost: "",
    unitSize: "",
    dose: "",
    timesPerDay: "1",
    daysPerYear: "365",
    doseType: "fixed",
    patientWeight: "70",
    wastagePercent: "0",
  },
  costAnalysis: {
    currency: "USD",
    drugAcquisition: "",
    administration: "0",
    monitoring: "0",
    laboratoryDiagnostics: "0",
    outpatientVisits: "0",
    adverseEventManagement: "0",
    adverseEventRatePercent: "0",
    hospitalizations: "0",
    otherDirectCosts: "0",
    hospitalizationAvoidance: "0",
    otherOffsets: "0",
    newDrugPatientCount: "1",
    comparatorName: "",
    comparatorAnnualDrugCost: "0",
    comparatorAdministrationAndMonitoring: "0",
    comparatorOffsets: "0",
    comparatorPatientCount: "1",
  },
  budgetImpact: {
    perspective: "Hospital payer",
    timeHorizon: 3,
    currency: "USD",
    annualDrugCostPerPatient: "",
    administrationAndMonitoring: "",
    expectedAeCost: "",
    offsets: "",
    wastagePercent: "0",
    currentTreatmentName: "",
    currentTreatmentDrugPrice: "0",
    currentTreatmentExtraCareCost: "0",
    currentTreatmentSavings: "0",
    hospitalBeds: "500",
    bedOccupancyPercent: "80",
    prevalencePercent: "10",
    diagnosisRatePercent: "80",
    eligibilityPercent: "50",
    averageLengthOfStayDays: "5",
    annualPopulationGrowthPercent: "2",
    annualInflationPercent: "3",
    uptakePercent: ["10", "25", "40", "50", "60"],
    conservativeUptakeMultiplier: "0.6",
    optimisticUptakeMultiplier: "1.4",
    conservativeCostIncreasePercent: "20",
    optimisticCostDecreasePercent: "15",
    notes: "",
  },
};

export function cloneReportCalculatorDraft(
  draft: ReportCalculatorDraft,
): ReportCalculatorDraft {
  return {
    ...draft,
    dosing: { ...draft.dosing },
    costAnalysis: { ...draft.costAnalysis },
    budgetImpact: {
      ...draft.budgetImpact,
      uptakePercent: [...draft.budgetImpact.uptakePercent],
    },
  };
}

export function hasReportCalculatorModules(
  draft: ReportCalculatorDraft,
): boolean {
  return (
    draft.dosingEnabled ||
    draft.costAnalysisEnabled ||
    draft.budgetImpactEnabled
  );
}

export function getReportCalculatorModuleLabels(
  draft: ReportCalculatorDraft,
): string[] {
  const dosingAndCostLabel =
    draft.dosingEnabled && draft.costAnalysisEnabled
      ? "Dosing & cost analysis"
      : draft.dosingEnabled
        ? "Dosing"
        : draft.costAnalysisEnabled
          ? "Cost analysis"
          : null;

  return [
    dosingAndCostLabel,
    draft.budgetImpactEnabled ? "Budget impact analysis" : null,
  ].filter((label): label is string => label !== null);
}

function numberFromText(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value);
}

function nullableNumberFromText(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

function createDependencyError(path: PropertyKey[], message: string): z.ZodError {
  return new z.ZodError([
    {
      code: "custom",
      path,
      message,
    },
  ]);
}

export function mapReportCalculatorDraft(
  draft: ReportCalculatorDraft,
): ReportCalculatorSelections {
  const selections: ReportCalculatorSelections = {};

  if (draft.dosingEnabled) {
    selections.dosing = reportDosingSelectionSchema.parse({
      unit_cost: numberFromText(draft.dosing.unitCost),
      unit_size: numberFromText(draft.dosing.unitSize),
      dose: numberFromText(draft.dosing.dose),
      times_per_day: numberFromText(draft.dosing.timesPerDay),
      days_per_year: numberFromText(draft.dosing.daysPerYear),
      dose_type: draft.dosing.doseType,
      patient_weight:
        draft.dosing.doseType === "weight_based"
          ? nullableNumberFromText(draft.dosing.patientWeight)
          : null,
      wastage_percent: numberFromText(draft.dosing.wastagePercent),
    });
  }

  if (draft.costAnalysisEnabled) {
    selections.cost_analysis = reportCostAnalysisSelectionSchema.parse({
      currency: draft.costAnalysis.currency,
      annual_costs: {
        drug_acquisition: nullableNumberFromText(
          draft.costAnalysis.drugAcquisition,
        ),
        administration: numberFromText(draft.costAnalysis.administration),
        monitoring: numberFromText(draft.costAnalysis.monitoring),
        laboratory_diagnostics: numberFromText(
          draft.costAnalysis.laboratoryDiagnostics,
        ),
        outpatient_visits: numberFromText(
          draft.costAnalysis.outpatientVisits,
        ),
        adverse_event_management: numberFromText(
          draft.costAnalysis.adverseEventManagement,
        ),
        adverse_event_rate_percent: numberFromText(
          draft.costAnalysis.adverseEventRatePercent,
        ),
        hospitalizations: numberFromText(
          draft.costAnalysis.hospitalizations,
        ),
        other_direct_costs: numberFromText(
          draft.costAnalysis.otherDirectCosts,
        ),
      },
      offsets: {
        hospitalization_avoidance: numberFromText(
          draft.costAnalysis.hospitalizationAvoidance,
        ),
        other_offsets: numberFromText(draft.costAnalysis.otherOffsets),
      },
      new_drug_patient_count: numberFromText(
        draft.costAnalysis.newDrugPatientCount,
      ),
      comparator: draft.costAnalysis.comparatorName.trim()
        ? {
            name: draft.costAnalysis.comparatorName,
            annual_drug_cost: numberFromText(
              draft.costAnalysis.comparatorAnnualDrugCost,
            ),
            administration_and_monitoring: numberFromText(
              draft.costAnalysis.comparatorAdministrationAndMonitoring,
            ),
            offsets: numberFromText(draft.costAnalysis.comparatorOffsets),
            patient_count: numberFromText(
              draft.costAnalysis.comparatorPatientCount,
            ),
          }
        : undefined,
    });

    if (
      selections.cost_analysis.annual_costs.drug_acquisition === null &&
      !draft.dosingEnabled
    ) {
      throw createDependencyError(
        ["costAnalysis", "drugAcquisition"],
        "Enter drug acquisition cost or enable Dosing to calculate it",
      );
    }
  }

  if (draft.budgetImpactEnabled) {
    const budget = draft.budgetImpact;
    selections.budget_impact = reportBudgetImpactSelectionSchema.parse({
      perspective: budget.perspective,
      time_horizon: budget.timeHorizon,
      currency: budget.currency,
      annual_drug_cost_per_patient: nullableNumberFromText(
        budget.annualDrugCostPerPatient,
      ),
      administration_and_monitoring: nullableNumberFromText(
        budget.administrationAndMonitoring,
      ),
      expected_ae_cost: nullableNumberFromText(budget.expectedAeCost),
      offsets: nullableNumberFromText(budget.offsets),
      wastage_percent: numberFromText(budget.wastagePercent),
      current_treatment: {
        name: budget.currentTreatmentName,
        drug_price: numberFromText(budget.currentTreatmentDrugPrice),
        extra_care_cost: numberFromText(
          budget.currentTreatmentExtraCareCost,
        ),
        savings: numberFromText(budget.currentTreatmentSavings),
      },
      hospital_beds: numberFromText(budget.hospitalBeds),
      bed_occupancy_percent: numberFromText(budget.bedOccupancyPercent),
      prevalence_percent: numberFromText(budget.prevalencePercent),
      diagnosis_rate_percent: numberFromText(budget.diagnosisRatePercent),
      eligibility_percent: numberFromText(budget.eligibilityPercent),
      average_length_of_stay_days: numberFromText(
        budget.averageLengthOfStayDays,
      ),
      annual_population_growth_percent: numberFromText(
        budget.annualPopulationGrowthPercent,
      ),
      annual_inflation_percent: numberFromText(
        budget.annualInflationPercent,
      ),
      uptake_percent: budget.uptakePercent
        .slice(0, budget.timeHorizon)
        .map(numberFromText),
      conservative_uptake_multiplier: numberFromText(
        budget.conservativeUptakeMultiplier,
      ),
      optimistic_uptake_multiplier: numberFromText(
        budget.optimisticUptakeMultiplier,
      ),
      conservative_cost_increase_percent: numberFromText(
        budget.conservativeCostIncreasePercent,
      ),
      optimistic_cost_decrease_percent: numberFromText(
        budget.optimisticCostDecreasePercent,
      ),
      notes: budget.notes,
    });

    const downstreamHandoffs = [
      selections.budget_impact.annual_drug_cost_per_patient,
      selections.budget_impact.administration_and_monitoring,
      selections.budget_impact.expected_ae_cost,
      selections.budget_impact.offsets,
    ];
    if (!draft.costAnalysisEnabled && downstreamHandoffs.some((v) => v === null)) {
      throw createDependencyError(
        ["budgetImpact"],
        "Enter all four treatment costs or enable Cost Analysis to supply blank values",
      );
    }
  }

  return selections;
}

export function formatReportCalculatorValidationError(error: unknown): string {
  if (error instanceof z.ZodError) {
    if (error.issues.some((issue) => issue.code === "custom" && issue.path[0] === "costAnalysis" && issue.path[1] === "drugAcquisition")) {
      return "Enter the annual drug acquisition cost, or enable Dosing to calculate it.";
    }
    if (error.issues.some((issue) => issue.code === "custom" && issue.path[0] === "budgetImpact")) {
      return "Enter the four new-treatment costs in Budget Impact Analysis, or enable Cost Analysis to supply them.";
    }
    return getCalculatorValidationMessage(error);
  }

  return "Review the calculation inputs and try again.";
}
