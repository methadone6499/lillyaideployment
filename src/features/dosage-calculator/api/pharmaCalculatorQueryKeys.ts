export const pharmaCalculatorQueryKeys = {
  root: ["pharma-calculator"] as const,
  dosingMutation: ["pharma-calculator", "dosing"] as const,
  costAnalysisMutation: ["pharma-calculator", "cost-analysis"] as const,
  budgetImpactMutation: ["pharma-calculator", "budget-impact"] as const,
  dailyMedSuggestionsMutation: [
    "pharma-calculator",
    "dailymed-suggestions",
  ] as const,
};
