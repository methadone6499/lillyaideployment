"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDrugSuggestion } from "../api/reportApi";

export function useDrugSuggestion(drugName: string) {
  return useQuery({
    queryKey: ["drug-suggestion", drugName],
    queryFn: () => fetchDrugSuggestion(drugName),
    enabled: drugName.trim().length >= 3,
    staleTime: 30_000,
  });
}
