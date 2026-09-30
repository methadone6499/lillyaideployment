import type { QueryClient } from "@tanstack/react-query";

import { billingQueryKeys } from "../api/billingQueryKeys";

function isBillingQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === billingQueryKeys.root[0];
}

export async function clearBillingSession(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries({
    predicate: (query) => isBillingQueryKey(query.queryKey),
  });

  queryClient.removeQueries({
    predicate: (query) => isBillingQueryKey(query.queryKey),
  });
}
