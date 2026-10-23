import type { QueryClient } from "@tanstack/react-query";
import { billingQueryKeys } from "../api/billingQueryKeys";
import { topUpQueryKeys } from "../api/topUpQueryKeys";
import type { TopUpCheckout } from "../schemas/topUpSchemas";
import { useTopUpPurchaseStore, type PendingTopUpIntent } from "../store/useTopUpPurchaseStore";
import { isTopUpOrderPending } from "./topUpPolicy";

export async function refreshTopUpBalances(client: QueryClient, userId: string) {
  await Promise.all([
    client.invalidateQueries({ queryKey: [...topUpQueryKeys.user(userId), "overview"] }),
    client.invalidateQueries({ queryKey: billingQueryKeys.overview(userId) }),
    client.invalidateQueries({ queryKey: ["company-quota"] }),
  ]);
}

/** Apply only server-confirmed order state; never infer a credit from navigation. */
export async function reconcileTopUpOrder(
  client: QueryClient,
  intent: PendingTopUpIntent,
  order: TopUpCheckout,
  cacheOrder = true,
) {
  // Recovery can finish after automatic polling stops. Update that same order's
  // query immediately so cached `creating` data cannot hide the recovered checkout.
  if (cacheOrder) {
    client.setQueryData(topUpQueryKeys.order(intent.userId, intent.contextKey, order.order_id), order);
  }
  const saved = useTopUpPurchaseStore.getState().intents[intent.contextKey];
  if (saved?.idempotencyKey === intent.idempotencyKey) {
    if (order.status === "completed") {
      useTopUpPurchaseStore.getState().remove(intent.contextKey, intent.idempotencyKey);
    } else {
      useTopUpPurchaseStore.getState().put(intent.contextKey, { ...saved, order });
    }
  }
  if (!isTopUpOrderPending(order.status)) await refreshTopUpBalances(client, intent.userId);
}
