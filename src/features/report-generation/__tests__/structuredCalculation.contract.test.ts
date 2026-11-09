import assert from "node:assert/strict";

import {
  updateReportSelectionsInputSchema,
  updateReportSelectionsResponseSchema,
} from "../schemas/reportSchemas";
import { frequencyFromPreset } from "../utils/dosingFrequency";
import {
  cloneReportCalculatorDraft,
  EMPTY_REPORT_CALCULATOR_DRAFT,
  formatReportCalculatorValidationError,
  mapReportCalculatorDraft,
} from "../utils/reportCalculator";
import {
  getReportCurrencySelectValue,
  REPORT_OTHER_CURRENCY_VALUE,
} from "../utils/reportCurrency";
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
completeDraft.dosing.frequency = frequencyFromPreset("every-3-months");
completeDraft.costAnalysis.newDrugPatientCount = "30";
completeDraft.costAnalysis.comparatorName = "Standard of care";
completeDraft.costAnalysis.comparatorAnnualDrugCost = "5000";
completeDraft.costAnalysis.comparatorPatientCount = "30";
completeDraft.budgetImpact.currentTreatmentName = "Standard of care";
completeDraft.budgetImpact.currentTreatmentDrugPrice = "5000";

const mapped = mapReportCalculatorDraft(completeDraft);

assert.equal(mapped.dosing?.dose_type, "fixed");
assert.equal(mapped.dosing?.times_per_day, 4 / 365);
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

const customCurrencies = cloneReportCalculatorDraft(completeDraft);
customCurrencies.costAnalysis.currency = "SAR";
customCurrencies.budgetImpact.currency = "JPY";
const customCurrencyMapped = mapReportCalculatorDraft(customCurrencies);
assert.equal(customCurrencyMapped.cost_analysis?.currency, "SAR");
assert.equal(customCurrencyMapped.budget_impact?.currency, "JPY");
assert.equal(getReportCurrencySelectValue("SAR"), "SAR");
assert.equal(getReportCurrencySelectValue("JPY"), REPORT_OTHER_CURRENCY_VALUE);
assert.equal(getReportCurrencySelectValue(""), REPORT_OTHER_CURRENCY_VALUE);
assert.notEqual(customCurrencyMapped.cost_analysis?.currency, REPORT_OTHER_CURRENCY_VALUE);
assert.notEqual(customCurrencyMapped.budget_impact?.currency, REPORT_OTHER_CURRENCY_VALUE);

for (const code of ["S", "SA"]) {
  const shortCurrency = cloneReportCalculatorDraft(completeDraft);
  shortCurrency.costAnalysis.currency = code;
  let thrown: unknown;
  try {
    mapReportCalculatorDraft(shortCurrency);
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown, `expected ${code} to fail validation`);
  assert.equal(
    formatReportCalculatorValidationError(thrown),
    "Enter a three-letter currency code, such as USD.",
  );
}

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
