"use client";

import { useIsAuthenticated } from "@/features/auth";

export function useReportQueriesEnabled(additionalEnabled = true): boolean {
  const isAuthenticated = useIsAuthenticated();
  return isAuthenticated && additionalEnabled;
}
