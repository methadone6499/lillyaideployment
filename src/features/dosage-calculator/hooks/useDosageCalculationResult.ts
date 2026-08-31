"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchDosageCalculationResult } from "../api/dosageCalculatorApi";
import { dosageCalculatorQueryKeys } from "../api/dosageCalculatorQueryKeys";
import {
  isDosageCalculatorResultReady,
  type DosageCalculatorJobStatus,
} from "../schemas/dosageCalculatorSchemas";
import { shouldRetryDosageCalculatorResultQuery } from "../utils/shouldRetryDosageCalculatorQuery";
import { useDosageCalculatorQueriesEnabled } from "./useDosageCalculatorQueriesEnabled";

export function useDosageCalculationResult(
  jobId: string | null,
  jobStatus?: DosageCalculatorJobStatus,
) {
  const queriesEnabled = useDosageCalculatorQueriesEnabled(
    Boolean(jobId) && isDosageCalculatorResultReady(jobStatus),
  );

  return useQuery({
    queryKey: dosageCalculatorQueryKeys.result(jobId ?? ""),
    queryFn: ({ signal }) => fetchDosageCalculationResult(jobId!, signal),
    enabled: queriesEnabled,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    retry: shouldRetryDosageCalculatorResultQuery,
  });
}
