import assert from "node:assert/strict";

import {
  updateReportSelectionsInputSchema,
  updateReportSelectionsResponseSchema,
} from "../schemas/reportSchemas";
import {
  cloneReportCalculatorDraft,
  EMPTY_REPORT_CALCULATOR_DRAFT,
  mapReportCalculatorDraft,
} from "../utils/reportCalculator";
import {
  isSectionAvailable,
  reconcileSelectedSectionIdsWithInputs,
} from "../utils/sectionOrdering";

const completeDraft = cloneReportCalculatorDraft(
  EMPTY_REPORT_CALCULATOR_DRAFT,
);
completeDraft.dosingEnabled = true;
completeDraft.costAnalysisEnabled = true;
completeDraft.budgetImpactEnabled = true;
completeDraft.dosing.unitCost = "75000";
completeDraft.dosing.unitSize = "12";
completeDraft.dosing.dose = "12";
completeDraft.dosing.timesPerDay = "0.0082";
completeDraft.costAnalysis.newDrugPatientCount = "30";
completeDraft.costAnalysis.comparatorName = "Standard of care";
completeDraft.costAnalysis.comparatorAnnualDrugCost = "5000";
completeDraft.costAnalysis.comparatorPatientCount = "30";
completeDraft.budgetImpact.currentTreatmentName = "Standard of care";
completeDraft.budgetImpact.currentTreatmentDrugPrice = "5000";

const mapped = mapReportCalculatorDraft(completeDraft);

assert.equal(mapped.dosing?.dose_type, "fixed");
assert.equal(mapped.cost_analysis?.annual_costs.drug_acquisition, null);
assert.equal(mapped.budget_impact?.annual_drug_cost_per_patient, null);
assert.deepEqual(mapped.budget_impact?.uptake_percent, [10, 25, 40]);

assert.equal(
  updateReportSelectionsInputSchema.safeParse({
    comparators: ["Standard of care"],
    custom_comparators: [],
    clinical_pmcids: [],
    economic_pmcids: [],
    article_uploads: [],
    section_types: ["economic"],
    ...mapped,
  }).success,
  true,
);

function stringifyNumbers(value: unknown): unknown {
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(stringifyNumbers);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        stringifyNumbers(nestedValue),
      ]),
    );
  }
  return value;
}

const serializedSelections = stringifyNumbers({
  comparators: ["Standard of care"],
  custom_comparators: [],
  clinical_pmcids: [],
  economic_pmcids: [],
  article_uploads: [],
  section_types: ["economic"],
  ...mapped,
  cost_analysis: {
    ...mapped.cost_analysis,
    dosage_form: "injection",
    drug_class: "other",
  },
  custom_sections: [],
});
assert.equal(
  updateReportSelectionsInputSchema.safeParse(serializedSelections).success,
  false,
);
const parsedSelectionsResponse = updateReportSelectionsResponseSchema.parse({
  report_id: "report-123",
  status: "ready",
  selections: serializedSelections,
  warnings: [],
});

assert.equal(parsedSelectionsResponse.selections.dosing?.unit_cost, 75000);
assert.equal(
  parsedSelectionsResponse.selections.cost_analysis?.annual_costs.administration,
  0,
);
assert.equal(
  parsedSelectionsResponse.selections.budget_impact?.uptake_percent[0],
  10,
);
assert.equal("custom_sections" in parsedSelectionsResponse.selections, false);

const dosingOnly = cloneReportCalculatorDraft(completeDraft);
dosingOnly.costAnalysisEnabled = false;
dosingOnly.budgetImpactEnabled = false;
assert.deepEqual(Object.keys(mapReportCalculatorDraft(dosingOnly)), ["dosing"]);

const independentCost = cloneReportCalculatorDraft(
  EMPTY_REPORT_CALCULATOR_DRAFT,
);
independentCost.costAnalysisEnabled = true;
independentCost.costAnalysis.drugAcquisition = "48000";
assert.equal(
  mapReportCalculatorDraft(independentCost).cost_analysis?.annual_costs
    .drug_acquisition,
  48000,
);

const invalidCost = cloneReportCalculatorDraft(
  EMPTY_REPORT_CALCULATOR_DRAFT,
);
invalidCost.costAnalysisEnabled = true;
assert.throws(
  () => mapReportCalculatorDraft(invalidCost),
  /Enter drug acquisition cost or enable Dosing/,
);

const independentBudget = cloneReportCalculatorDraft(
  EMPTY_REPORT_CALCULATOR_DRAFT,
);
independentBudget.budgetImpactEnabled = true;
independentBudget.budgetImpact.annualDrugCostPerPatient = "50000";
independentBudget.budgetImpact.administrationAndMonitoring = "2500";
independentBudget.budgetImpact.expectedAeCost = "500";
independentBudget.budgetImpact.offsets = "1000";
independentBudget.budgetImpact.currentTreatmentName = "Standard of care";
assert.equal(
  mapReportCalculatorDraft(independentBudget).budget_impact?.time_horizon,
  3,
);

assert.equal(
  isSectionAvailable("economic", {
    selectedClinicalArticleIds: [],
    selectedEconomicArticleIds: [],
    selectedComparators: [],
    hasReportCalculator: true,
  }),
  true,
);

assert.deepEqual(
  reconcileSelectedSectionIdsWithInputs(["disease"], {
    selectedClinicalArticleIds: [],
    selectedEconomicArticleIds: [],
    selectedComparators: [],
    hasReportCalculator: true,
  }).filter((sectionId) => sectionId === "economic"),
  ["economic"],
);
