import type { QueryClient } from "@tanstack/react-query";

import { refetchAuthMe } from "@/features/auth";
import { companyQuotaQueryKeys } from "@/features/company-quota";

import { billingQueryKeys } from "../api/billingQueryKeys";
import { topUpQueryKeys } from "../api/topUpQueryKeys";
import {
  classifyBillingError,
  type ClassifiedBillingError,
} from "./classifyBillingError";

export async function invalidateBillingOverview(
  queryClient: QueryClient,
  userId: string | null,
): Promise<void> {
  if (!userId) {
    return;
  }

  void queryClient.invalidateQueries({ queryKey: companyQuotaQueryKeys.company(userId) });
  void queryClient.invalidateQueries({ queryKey: topUpQueryKeys.user(userId) });
  void queryClient.invalidateQueries({ queryKey: companyQuotaQueryKeys.own(userId) });
  await queryClient.invalidateQueries({ queryKey: billingQueryKeys.overview(userId) });
}

export async function recoverBillingMutationFailure(
  queryClient: QueryClient,
  userId: string | null,
  error: unknown,
): Promise<ClassifiedBillingError> {
  const classified = classifyBillingError(error);

  if (classified.reloadOverview) {
    await invalidateBillingOverview(queryClient, userId);
  }

  if (classified.refetchAuth) {
    try {
      await refetchAuthMe();
    } catch {
      // Auth refresh is best-effort; the original billing error remains authoritative.
    }
  }

  return classified;
}
