import assert from "node:assert/strict";

import {
  dosageCalculatorResultSchema,
  dosageCalculatorUiRequestSchema,
} from "../schemas/dosageCalculatorSchemas";
import { mapDosageFormToRequest } from "../utils/mapDosageCalculatorRequest";

const structuredCostForm = {
  drug: "Spinraza",
  indication: "Spinal muscular atrophy",
  population: "infant",
  frequency: "once every 4 months",
  treatmentDuration: "12",
  durationUnit: "months",
  currency: "USD",
  customCurrency: "",
  unitPrice: "75000",
  patientVolume: "30",
  includeCostAnalysis: true,
  costAdministration: "100",
  costMonitoring: "50",
  costLabDiagnostics: "25",
  costOutpatientVisits: "75",
  costAeManagement: "200",
  costAeRatePercent: "10",
  costHospitalizations: "300",
  costOtherDirectCosts: "40",
  costHospitalizationAvoidance: "20",
  costOtherOffsets: "5",
  costComparatorName: "Standard of care",
  costComparatorAnnualDrugCost: "5000",
  costComparatorAdministrationAndMonitoring: "200",
  costComparatorOffsets: "100",
  costEligiblePatients: "1000",
  costUptakeYear1Percent: "10",
  costUptakeYear2Percent: "30",
  costUptakeYear3Percent: "50",
};

const request = mapDosageFormToRequest(structuredCostForm, {
  idempotencyKey: "structured-cost-test",
});
assert.equal(request.cost_analysis?.comparator.name, "Standard of care");
assert.equal(request.cost_analysis?.annual_costs.ae_rate_percent, 10);
assert.equal(request.cost_analysis?.population.eligible_patients, 1000);
assert.equal(dosageCalculatorUiRequestSchema.safeParse(request).success, true);

assert.equal(
  dosageCalculatorUiRequestSchema.safeParse({
    ...request,
    cost_analysis: {
      ...request.cost_analysis,
      population: undefined,
    },
  }).success,
  false,
);

assert.equal(
  dosageCalculatorResultSchema.parse({
    job_id: "job-1",
    price_source: "user_provided",
    indication_match: "exact",
    table: [],
    extraction: {},
    markdown: "",
    artifacts: {
      label_html_path: "label.html",
      label_markdown_path: "label.md",
      extraction_path: "extraction.json",
      markdown_path: "result.md",
    },
    warnings: [],
    budget_impact: {
      years: [{ year: 1, budget_impact: 531000 }],
      future_backend_field: { preserved: true },
    },
  }).budget_impact?.future_backend_field instanceof Object,
  true,
);

assert.equal(
  dosageCalculatorResultSchema.parse({
    job_id: "job-2",
    price_source: "user_provided",
    indication_match: "exact",
    table: [],
    extraction: {},
    markdown: "",
    artifacts: {
      label_html_path: "label.html",
      label_markdown_path: "label.md",
      extraction_path: "extraction.json",
      markdown_path: "result.md",
    },
    warnings: [],
    budget_impact: null,
  }).budget_impact,
  null,
);

const expandedResult = dosageCalculatorResultSchema.parse({
  job_id: "job-3",
  price_source: "user_provided",
  indication_match: "fallback",
  table: [
    {
      drug_name: "Spinraza",
      unit_price: "USD 75,000.00",
      dose: "12 mg",
      estimated_usage: "6 vials",
      cost_per_patient: "USD 450,000.00",
      cost_cohort: "USD 13,500,000.00",
      period: "Year 1",
      presentation: "Single-dose vial",
      units: 6,
      unit_price_amount: 75000,
      cost_per_patient_amount: 450000,
      cost_cohort_amount: 13500000,
    },
  ],
  extraction: {},
  markdown: "",
  artifacts: {
    label_html_path: "label.html",
    label_markdown_path: "label.md",
    extraction_path: "extraction.json",
    markdown_path: "result.md",
    budget_impact_path: "budget-impact.json",
  },
  warnings: [],
  budget_impact: null,
});
assert.equal(expandedResult.indication_match, "fallback");
assert.equal(expandedResult.table[0].cost_cohort_amount, 13500000);
assert.equal(
  expandedResult.artifacts.budget_impact_path,
  "budget-impact.json",
);
