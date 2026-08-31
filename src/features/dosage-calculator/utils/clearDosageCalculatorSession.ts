import type { QueryClient } from "@tanstack/react-query";

import { dosageCalculatorQueryKeys } from "../api/dosageCalculatorQueryKeys";

export function isDosageCalculatorQueryKey(
  queryKey: readonly unknown[],
): boolean {
  return queryKey[0] === dosageCalculatorQueryKeys.root[0];
}

export async function cancelDosageCalculatorJobQueries(
  queryClient: QueryClient,
  jobId: string,
): Promise<void> {
  await queryClient.cancelQueries({
    queryKey: dosageCalculatorQueryKeys.job(jobId),
  });
}

export async function clearDosageCalculatorJobQueries(
  queryClient: QueryClient,
  jobId: string,
): Promise<void> {
  await cancelDosageCalculatorJobQueries(queryClient, jobId);
  queryClient.removeQueries({
    queryKey: dosageCalculatorQueryKeys.job(jobId),
  });
}

export async function clearDosageCalculatorSession(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries({
    predicate: (query) => isDosageCalculatorQueryKey(query.queryKey),
  });

  queryClient.removeQueries({
    predicate: (query) => isDosageCalculatorQueryKey(query.queryKey),
  });
}
