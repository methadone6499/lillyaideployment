import type { QueryClient } from "@tanstack/react-query";

import { companySeatQueryKeys } from "../api/companySeatQueryKeys";

function isCompanySeatQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === companySeatQueryKeys.root[0];
}

export async function clearCompanySeatSession(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries({
    predicate: (query) => isCompanySeatQueryKey(query.queryKey),
  });

  queryClient.removeQueries({
    predicate: (query) => isCompanySeatQueryKey(query.queryKey),
  });
}
