import {
  budgetImpactRequestSchema,
  budgetImpactResponseSchema,
  costAnalysisRequestSchema,
  costAnalysisResponseSchema,
  dailyMedSuggestionRequestSchema,
  dailyMedSuggestionResponseSchema,
  dosingRequestSchema,
  dosingResponseSchema,
  type BudgetImpactRequest,
  type BudgetImpactResponse,
  type CostAnalysisRequest,
  type CostAnalysisResponse,
  type DailyMedSuggestionRequest,
  type DailyMedSuggestionResponse,
  type DosingRequest,
  type DosingResponse,
} from "../schemas/pharmaCalculatorSchemas";
import { dosageCalculatorFetch } from "./dosageCalculatorFetch";

export const PHARMA_CALCULATOR_API_ROOT = "/calculators";

export async function runDosingCalculation(
  input: DosingRequest,
  signal?: AbortSignal,
): Promise<DosingResponse> {
  return dosageCalculatorFetch(`${PHARMA_CALCULATOR_API_ROOT}/dosing`, {
    method: "POST",
    body: dosingRequestSchema.parse(input),
    schema: dosingResponseSchema,
    signal,
  });
}

export async function runCostAnalysis(
  input: CostAnalysisRequest,
  signal?: AbortSignal,
): Promise<CostAnalysisResponse> {
  return dosageCalculatorFetch(`${PHARMA_CALCULATOR_API_ROOT}/cost-analysis`, {
    method: "POST",
    body: costAnalysisRequestSchema.parse(input),
    schema: costAnalysisResponseSchema,
    signal,
  });
}

export async function runBudgetImpact(
  input: BudgetImpactRequest,
  signal?: AbortSignal,
): Promise<BudgetImpactResponse> {
  return dosageCalculatorFetch(`${PHARMA_CALCULATOR_API_ROOT}/budget-impact`, {
    method: "POST",
    body: budgetImpactRequestSchema.parse(input),
    schema: budgetImpactResponseSchema,
    signal,
  });
}

export async function getDailyMedSuggestions(
  input: DailyMedSuggestionRequest,
  signal?: AbortSignal,
): Promise<DailyMedSuggestionResponse> {
  return dosageCalculatorFetch(
    `${PHARMA_CALCULATOR_API_ROOT}/dailymed-suggestions`,
    {
      method: "POST",
      body: dailyMedSuggestionRequestSchema.parse(input),
      schema: dailyMedSuggestionResponseSchema,
      signal,
    },
  );
}
