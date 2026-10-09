import {
  standaloneStructuredCostAnalysisSchema,
  structuredCostAnalysisFormFieldsSchema,
  type StandaloneStructuredCostAnalysis,
  type StructuredCostAnalysisFormFields,
} from "../schemas/dosageCalculatorSchemas";

export const EMPTY_STRUCTURED_COST_ANALYSIS_FORM: StructuredCostAnalysisFormValues = {
  costAdministration: "0",
  costMonitoring: "0",
  costLabDiagnostics: "0",
  costOutpatientVisits: "0",
  costAeManagement: "0",
  costAeRatePercent: "0",
  costHospitalizations: "0",
  costOtherDirectCosts: "0",
  costHospitalizationAvoidance: "0",
  costOtherOffsets: "0",
  costComparatorName: "",
  costComparatorAnnualDrugCost: "0",
  costComparatorAdministrationAndMonitoring: "0",
  costComparatorOffsets: "0",
  costEligiblePatients: "",
  costUptakeYear1Percent: "",
  costUptakeYear2Percent: "",
  costUptakeYear3Percent: "",
};

export type StructuredCostAnalysisFormValues = {
  [Key in keyof StructuredCostAnalysisFormFields]: string;
};

export type StructuredCostAnalysisFormField =
  keyof StructuredCostAnalysisFormValues;

export function pickStructuredCostAnalysisFormValues(
  value: Record<string, unknown>,
): StructuredCostAnalysisFormValues {
  return Object.fromEntries(
    Object.keys(EMPTY_STRUCTURED_COST_ANALYSIS_FORM).map((key) => [
      key,
      typeof value[key] === "string" ? value[key] : "",
    ]),
  ) as StructuredCostAnalysisFormValues;
}

export function mapStructuredCostAnalysisFormToRequest(
  value: unknown,
): StandaloneStructuredCostAnalysis {
  const parsed = structuredCostAnalysisFormFieldsSchema.loose().parse(value);

  return standaloneStructuredCostAnalysisSchema.parse({
    annual_costs: {
      administration: parsed.costAdministration,
      monitoring: parsed.costMonitoring,
      lab_diagnostics: parsed.costLabDiagnostics,
      outpatient_visits: parsed.costOutpatientVisits,
      ae_management: parsed.costAeManagement,
      ae_rate_percent: parsed.costAeRatePercent,
      hospitalizations: parsed.costHospitalizations,
      other_direct_costs: parsed.costOtherDirectCosts,
    },
    offsets: {
      hospitalization_avoidance: parsed.costHospitalizationAvoidance,
      other_offsets: parsed.costOtherOffsets,
    },
    comparator: {
      name: parsed.costComparatorName,
      annual_drug_cost: parsed.costComparatorAnnualDrugCost,
      administration_and_monitoring:
        parsed.costComparatorAdministrationAndMonitoring,
      offsets: parsed.costComparatorOffsets,
    },
    population: {
      eligible_patients: parsed.costEligiblePatients,
      uptake_year_1_percent: parsed.costUptakeYear1Percent,
      uptake_year_2_percent: parsed.costUptakeYear2Percent,
      uptake_year_3_percent: parsed.costUptakeYear3Percent,
    },
  });
}
