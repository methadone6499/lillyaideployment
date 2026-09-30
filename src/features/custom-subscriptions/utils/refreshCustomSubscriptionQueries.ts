import type { QueryClient } from "@tanstack/react-query";

import { invalidateBillingOverview } from "@/features/billing";
import { companyQuotaQueryKeys } from "@/features/company-quota";
import { companySeatQueryKeys } from "@/features/seat-management";

import { customSubscriptionQueryKeys } from "../api/customSubscriptionQueryKeys";

export async function invalidateCustomOfferState(
  queryClient: QueryClient,
  userId: string | null,
): Promise<void> {
  if (!userId) {
    return;
  }

  await queryClient.invalidateQueries({
    queryKey: customSubscriptionQueryKeys.offerState(userId),
  });
}

/** Payment attempts open or release the operation lock on `/subscriptions/me`. */
export async function invalidateAfterCustomPaymentChange(
  queryClient: QueryClient,
  userId: string | null,
): Promise<void> {
  await Promise.all([
    invalidateCustomOfferState(queryClient, userId),
    invalidateBillingOverview(queryClient, userId),
  ]);
}

/** Activation changes the plan, the quota period and possibly seat limits. */
export async function invalidateAfterCustomActivation(
  queryClient: QueryClient,
  userId: string | null,
): Promise<void> {
  await Promise.all([
    invalidateAfterCustomPaymentChange(queryClient, userId),
    queryClient.invalidateQueries({ queryKey: companyQuotaQueryKeys.root }),
    queryClient.invalidateQueries({ queryKey: companySeatQueryKeys.root }),
  ]);
}

export async function invalidateAdminCustomRequest(
  queryClient: QueryClient,
  userId: string | null,
  requestId: string,
): Promise<void> {
  if (!userId) {
    return;
  }

  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: customSubscriptionQueryKeys.adminDetail(userId, requestId),
    }),
    queryClient.invalidateQueries({
      queryKey: customSubscriptionQueryKeys.adminLists(userId),
    }),
  ]);
}
