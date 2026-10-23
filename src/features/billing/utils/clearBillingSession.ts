import type { QueryClient } from "@tanstack/react-query";

import { billingQueryKeys } from "../api/billingQueryKeys";
import { topUpQueryKeys } from "../api/topUpQueryKeys";
import { clearTopUpPurchaseState } from "../store/useTopUpPurchaseStore";
import { closeTopUpForfeiturePrompt } from "../store/useTopUpForfeitureStore";

function isBillingQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === billingQueryKeys.root[0] || queryKey[0] === topUpQueryKeys.root[0];
}

export async function clearBillingSession(
  queryClient: QueryClient,
): Promise<void> {
  closeTopUpForfeiturePrompt();
  try { clearTopUpPurchaseState(); } catch { /* In-memory state is cleared even when storage is unavailable. */ }
  await queryClient.cancelQueries({
    predicate: (query) => isBillingQueryKey(query.queryKey),
  });

  queryClient.removeQueries({
    predicate: (query) => isBillingQueryKey(query.queryKey),
  });
}
