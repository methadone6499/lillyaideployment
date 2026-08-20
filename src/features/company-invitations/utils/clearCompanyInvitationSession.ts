import type { QueryClient } from "@tanstack/react-query";

import { companyInvitationQueryKeys } from "../api/companyInvitationQueryKeys";

function isCompanyInvitationQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === companyInvitationQueryKeys.root[0];
}

export async function clearCompanyInvitationSession(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries({
    predicate: (query) => isCompanyInvitationQueryKey(query.queryKey),
  });

  queryClient.removeQueries({
    predicate: (query) => isCompanyInvitationQueryKey(query.queryKey),
  });
}
