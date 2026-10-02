import type { QueryClient } from "@tanstack/react-query";

import { companyBrandingQueryKeys } from "../api/companyBrandingQueryKeys";

export async function clearCompanyBrandingSession(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries({
    queryKey: companyBrandingQueryKeys.root,
  });
  queryClient.removeQueries({ queryKey: companyBrandingQueryKeys.root });
}
