"use client";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useQuery } from "@tanstack/react-query";
import { validateDrug } from "../api/reportApi";
import { reportQueryKeys } from "../api/reportQueryKeys";
import { useReportQueriesEnabled } from "./useReportQueriesEnabled";

export function useDrugSuggestion(drugName: string, disease = "") {
  const debouncedDrug = useDebouncedValue(drugName.trim(), 400);
  const debouncedDisease = useDebouncedValue(disease.trim(), 400);
  const queriesEnabled = useReportQueriesEnabled(debouncedDrug.length >= 3);

  return useQuery({
    queryKey: reportQueryKeys.drugValidation(debouncedDrug, debouncedDisease),
    queryFn: ({ signal }) =>
      validateDrug(
        {
          drug: debouncedDrug,
          ...(debouncedDisease ? { disease: debouncedDisease } : {}),
        },
        signal,
      ),
    enabled: queriesEnabled,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}
