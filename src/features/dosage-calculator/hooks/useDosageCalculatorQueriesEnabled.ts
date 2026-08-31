"use client";

import { useIsAuthenticated } from "@/features/auth";

export function useDosageCalculatorQueriesEnabled(
  additionalEnabled = true,
): boolean {
  const isAuthenticated = useIsAuthenticated();
  return isAuthenticated && additionalEnabled;
}
