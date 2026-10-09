import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type {
  BudgetImpactAnalysis,
  BudgetImpactModel,
  CostAnalysisResult,
} from "../utils/pharmaCalculator";
import {
  createBudgetImpactPdfContent,
  createCostAnalysisPdfContent,
} from "../utils/pharmaCalculatorPdf";

const costResult: CostAnalysisResult = {
  inputs: {
    drugName: "Examplexin",
    indication: "Example disease",
    dosageForm: "Injection",
    drugClass: "Targeted therapy",
    annualDrugCost: 56392.5,
    administration: 500,
    monitoring: 800,
    labDiagnostics: 600,
    outpatientVisits: 400,
    adverseEventManagement: 1800,
    adverseEventRatePercent: 10,
    hospitalizations: 2000,
    otherDirectCosts: 300,
    hospitalizationAvoidance: 1000,
    otherOffsets: 250,
    comparatorName: "Standard of care",
    comparatorAnnualCost: 30000,
    comparatorExtraCost: 1500,
    comparatorOffsets: 500,
    estimatedPatients: 100,
    comparatorPatients: 100,
  },
  components: [],
  offsetComponents: [],
  grossCost: 62992.5,
  totalOffsets: 1250,
  netCost: 61742.5,
  expectedAdverseEventCost: 180,
  comparatorNetCost: 31000,
  perPatientDifference: 30742.5,
  totalGrossCost: 6299250,
  totalNetCost: 6174250,
  totalComparatorCost: 3100000,
  totalDifference: 3074250,
  hasComparator: true,
  componentTable: [
    ["Drug acquisition", 56392.5],
    ["Administration", 500],
    ["Monitoring", 800],
    ["Laboratory / diagnostics", 600],
    ["Outpatient visits", 400],
    ["Expected adverse events", 180],
    ["Hospitalizations", 2000],
    ["Other direct costs", 300],
    ["Offsets", -1250],
    ["Net annual cost", 61742.5],
  ].map(([component, perPatient]) => ({
    component: String(component),
    per_patient: Number(perPatient),
    programme: Number(perPatient) * 100,
    percentage_of_net_programme:
      (Number(perPatient) * 100 * 100) / 6174250,
  })),
  comparisonTable: [
    {
      component: "Net annual cost",
      new_treatment_per_patient: 61742.5,
      comparator_per_patient: 31000,
      per_patient_difference: 30742.5,
      new_treatment_programme: 6174250,
      comparator_programme: 3100000,
      programme_difference: 3074250,
    },
  ],
};

const baseModel: BudgetImpactModel = {
  eligiblePopulationYearOne: 320,
  currentTreatmentCost: 31000,
  newDrugNetCost: 61742.5,
  cumulativeImpact: 7300000,
  years: [1, 2, 3].map((year) => ({
    year,
    population: 320 + year * 5,
    newDrugPatients: 50 + year * 20,
    currentTreatmentPatients: 250 - year * 15,
    uptakePercent: 15 + year * 20,
    totalSpend: 38000000 + year * 11000000,
    baselineSpend: 9000000 + year * 300000,
    incrementalImpact: 28000000 + year * 10500000,
    cumulativeImpact: 28000000 + year * 33000000,
    newDrugCostPerPatient: 61742.5 + year * 1800,
    currentTreatmentCostPerPatient: 31000 + year * 900,
    perPatientDifference: 30742.5 + year * 900,
  })),
};

const scenarioModel = (multiplier: number): BudgetImpactModel => ({
  ...baseModel,
  cumulativeImpact: baseModel.cumulativeImpact * multiplier,
  years: baseModel.years.map((year) => ({
    ...year,
    incrementalImpact: year.incrementalImpact * multiplier,
    cumulativeImpact: year.cumulativeImpact * multiplier,
  })),
});

const budgetAnalysis: BudgetImpactAnalysis = {
  inputs: {
    perspective: "Hospital payer",
    horizon: 3,
    drugName: "Examplexin",
    indication: "Example disease",
    annualDrugCost: 56392.5,
    administrationAndMonitoring: 1300,
    adverseEventCost: 180,
    offsets: 1250,
    wastagePercent: 5,
    currentTreatment: {
      name: "Standard of care",
      drugPrice: 30000,
      extraCareCost: 1500,
      savings: 500,
    },
    hospitalBeds: 500,
    bedOccupancyPercent: 85,
    prevalencePercent: 2,
    diagnosisRatePercent: 75,
    eligiblePercent: 60,
    averageLengthOfStay: 4.5,
    populationGrowthPercent: 1.5,
    inflationPercent: 3,
    uptakePercent: [15, 35, 55],
    conservativeUptakeFactor: 0.6,
    optimisticUptakeFactor: 1.4,
    conservativeCostIncreasePercent: 20,
    optimisticCostDecreasePercent: 15,
    notes: "Illustrative local assumptions for PDF layout validation.",
  },
  base: baseModel,
  conservative: scenarioModel(0.72),
  optimistic: scenarioModel(1.18),
  sensitivity: [
    "Drug acquisition cost",
    "Eligible population",
    "Treatment uptake",
    "Current-treatment cost",
    "Administration and monitoring",
    "Annual inflation",
  ].map((label, index) => ({
    label,
    low: 6200000 - index * 100000,
    base: 7300000,
    high: 8400000 + index * 125000,
    range: 2200000 + index * 225000,
  })),
  assumptions: [
    { name: "Currency", value: "USD" },
    { name: "Discounting", value: "Undiscounted" },
    { name: "Population method", value: "Hospital activity and prevalence" },
    { name: "Cost basis", value: "Annual per-patient cost" },
  ],
  chartData: [],
  analysisDate: "Oct 9, 2026",
};

const costPdf = createCostAnalysisPdfContent(costResult, "USD");
const budgetPdf = createBudgetImpactPdfContent(budgetAnalysis, "USD");

assert.equal(costPdf.startsWith("%PDF-1.4"), true);
assert.equal(budgetPdf.startsWith("%PDF-1.4"), true);
assert.match(costPdf, /Cost Analysis/);
assert.match(budgetPdf, /Budget Impact Analysis/);
assert.match(costPdf, /Page 1 of/);
assert.match(budgetPdf, /Year-by-year results/);

const outputDirectory = process.env.PDF_SMOKE_OUTPUT_DIR;
if (outputDirectory) {
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(join(outputDirectory, "cost-analysis-sample.pdf"), costPdf, "ascii");
  writeFileSync(
    join(outputDirectory, "budget-impact-analysis-sample.pdf"),
    budgetPdf,
    "ascii",
  );
}
