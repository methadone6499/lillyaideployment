import type { QueryClient } from "@tanstack/react-query";

import { customSubscriptionQueryKeys } from "../api/customSubscriptionQueryKeys";

function isCustomSubscriptionQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === customSubscriptionQueryKeys.root[0];
}

export async function clearCustomSubscriptionSession(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries({
    predicate: (query) => isCustomSubscriptionQueryKey(query.queryKey),
  });

  queryClient.removeQueries({
    predicate: (query) => isCustomSubscriptionQueryKey(query.queryKey),
  });
}
