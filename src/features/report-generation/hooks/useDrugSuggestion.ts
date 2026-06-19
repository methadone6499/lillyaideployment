"use client";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useQuery } from "@tanstack/react-query";
import { validateDrug } from "../api/reportApi";
import { reportQueryKeys } from "../api/reportQueryKeys";

export function useDrugSuggestion(drugName: string, disease = "") {
  const debouncedDrug = useDebouncedValue(drugName.trim(), 400);
  const debouncedDisease = useDebouncedValue(disease.trim(), 400);

  return useQuery({
    queryKey: reportQueryKeys.drugValidation(debouncedDrug, debouncedDisease),
    queryFn: () =>
      validateDrug({
        drug: debouncedDrug,
        ...(debouncedDisease ? { disease: debouncedDisease } : {}),
      }),
    enabled: debouncedDrug.length >= 3,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}
