"use client";

import { useMutation } from "@tanstack/react-query";
import {
  getDailyMedSuggestions,
  runBudgetImpact,
  runCostAnalysis,
  runDosingCalculation,
} from "../api/pharmaCalculatorApi";
import { pharmaCalculatorQueryKeys } from "../api/pharmaCalculatorQueryKeys";
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

export function useDosingCalculationMutation() {
  return useMutation<DosingResponse, Error, DosingRequest>({
    mutationKey: pharmaCalculatorQueryKeys.dosingMutation,
    mutationFn: (input) => runDosingCalculation(input),
  });
}

export function useCostAnalysisMutation() {
  return useMutation<CostAnalysisResponse, Error, CostAnalysisRequest>({
    mutationKey: pharmaCalculatorQueryKeys.costAnalysisMutation,
    mutationFn: (input) => runCostAnalysis(input),
  });
}

export function useBudgetImpactMutation() {
  return useMutation<BudgetImpactResponse, Error, BudgetImpactRequest>({
    mutationKey: pharmaCalculatorQueryKeys.budgetImpactMutation,
    mutationFn: (input) => runBudgetImpact(input),
  });
}

export function useDailyMedSuggestionsMutation() {
  return useMutation<
    DailyMedSuggestionResponse,
    Error,
    DailyMedSuggestionRequest
  >({
    mutationKey: pharmaCalculatorQueryKeys.dailyMedSuggestionsMutation,
    mutationFn: (input) => getDailyMedSuggestions(input),
  });
}
