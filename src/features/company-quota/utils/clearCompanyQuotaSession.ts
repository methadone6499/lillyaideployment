import type { QueryClient } from "@tanstack/react-query";

import { companyQuotaQueryKeys } from "../api/companyQuotaQueryKeys";

function isCompanyQuotaQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === companyQuotaQueryKeys.root[0];
}

export async function clearCompanyQuotaSession(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries({
    predicate: (query) => isCompanyQuotaQueryKey(query.queryKey),
  });

  queryClient.removeQueries({
    predicate: (query) => isCompanyQuotaQueryKey(query.queryKey),
  });
}
