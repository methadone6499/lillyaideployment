"use client";

import { useMutation } from "@tanstack/react-query";

import { enqueueDosageCalculation } from "../api/dosageCalculatorApi";
import { dosageCalculatorQueryKeys } from "../api/dosageCalculatorQueryKeys";
import type { DosageCalculatorRequest } from "../schemas/dosageCalculatorSchemas";
import { shouldRetryDosageCalculatorEnqueue } from "../utils/shouldRetryDosageCalculatorQuery";

export type EnqueueDosageCalculationVariables = {
  request: DosageCalculatorRequest;
  signal?: AbortSignal;
};

export function useEnqueueDosageCalculationMutation() {
  return useMutation({
    mutationKey: dosageCalculatorQueryKeys.enqueueMutation(),
    mutationFn: ({ request, signal }: EnqueueDosageCalculationVariables) =>
      enqueueDosageCalculation(request, signal),
    retry: shouldRetryDosageCalculatorEnqueue,
  });
}
