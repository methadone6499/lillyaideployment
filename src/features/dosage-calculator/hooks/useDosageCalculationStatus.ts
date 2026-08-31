"use client";

import { useQuery } from "@tanstack/react-query";

import {
  DOSAGE_CALCULATOR_STATUS_POLL_INTERVAL_MS,
  fetchDosageCalculationStatus,
} from "../api/dosageCalculatorApi";
import { dosageCalculatorQueryKeys } from "../api/dosageCalculatorQueryKeys";
import { isDosageCalculatorTerminalJobStatus } from "../schemas/dosageCalculatorSchemas";
import { shouldRetryDosageCalculatorStatusQuery } from "../utils/shouldRetryDosageCalculatorQuery";
import { useDosageCalculatorQueriesEnabled } from "./useDosageCalculatorQueriesEnabled";

export function useDosageCalculationStatus(jobId: string | null) {
  const queriesEnabled = useDosageCalculatorQueriesEnabled(Boolean(jobId));

  return useQuery({
    queryKey: dosageCalculatorQueryKeys.status(jobId ?? ""),
    queryFn: ({ signal }) => fetchDosageCalculationStatus(jobId!, signal),
    enabled: queriesEnabled,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchIntervalInBackground: false,
    retry: shouldRetryDosageCalculatorStatusQuery,
    refetchInterval: (query) => {
      if (!queriesEnabled) {
        return false;
      }

      const jobStatus = query.state.data?.job_status;
      if (jobStatus && isDosageCalculatorTerminalJobStatus(jobStatus)) {
        return false;
      }

      return DOSAGE_CALCULATOR_STATUS_POLL_INTERVAL_MS;
    },
  });
}
