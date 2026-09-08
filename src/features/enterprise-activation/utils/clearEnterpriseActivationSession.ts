import type { QueryClient } from "@tanstack/react-query";

import { enterpriseActivationQueryKeys } from "../api/enterpriseActivationQueryKeys";

function isEnterpriseActivationQueryKey(
  queryKey: readonly unknown[],
): boolean {
  return queryKey[0] === enterpriseActivationQueryKeys.root[0];
}

export async function clearEnterpriseActivationSession(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries({
    predicate: (query) => isEnterpriseActivationQueryKey(query.queryKey),
  });

  queryClient.removeQueries({
    predicate: (query) => isEnterpriseActivationQueryKey(query.queryKey),
  });
}
