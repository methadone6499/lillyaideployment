import assert from "node:assert/strict";
import { QueryClient } from "@tanstack/react-query";
import { ApiRequestError } from "@/services/ApiRequestError";
import { billingQueryKeys } from "../api/billingQueryKeys";
import { topUpQueryKeys } from "../api/topUpQueryKeys";
import type { TopUpCheckout } from "../schemas/topUpSchemas";
import { hydrateTopUpPurchases, useTopUpPurchaseStore, type PendingTopUpIntent } from "../store/useTopUpPurchaseStore";
import { reconcileTopUpOrder } from "../utils/reconcileTopUpOrder";
import { isTopUpOrderNotFound } from "../utils/topUpErrors";

const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
const memory = new Map<string, string>();
let writes = 0;
const storage: Storage = {
  get length() { return memory.size; },
  clear: () => memory.clear(),
  getItem: (key) => memory.get(key) ?? null,
  key: (index) => [...memory.keys()][index] ?? null,
  removeItem: (key) => { memory.delete(key); },
  setItem: (key, value) => { writes += 1; memory.set(key, value); },
};
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: storage });

try {
  const contextKey = JSON.stringify(["purchaser", "personal", null, null]);
  const order: TopUpCheckout = {
    order_id: "existing-order", status: "creating", scope_type: "user", quantity: 2,
    unit_amount_minor: 9500, total_amount_minor: 19000, currency: "usd",
    stripe_checkout_session_id: null, checkout_url: null, expires_at: null,
  };
  const intent: PendingTopUpIntent = {
    userId: "purchaser", contextKey, quantity: 2, idempotencyKey: "original-purchase-key",
    order, redirected: true, quotedUnitAmount: 9500, quotedCurrency: "usd",
  };
  const storageKey = "formulary-hta-report-top-ups-v1";
  useTopUpPurchaseStore.setState({ intents: {}, hydrated: false, returnMarker: null });
  const saved = JSON.stringify({ state: { intents: { [contextKey]: intent } }, version: 0 });
  memory.set(storageKey, saved);
  writes = 0;

  // Initial authentication has no previous in-memory intent to discard.
  // Removing an absent context must leave the unhydrated payment untouched.
  useTopUpPurchaseStore.getState().remove(JSON.stringify([null, null, null, null]));
  assert.equal(writes, 0);
  assert.equal(memory.get(storageKey), saved);
  await hydrateTopUpPurchases();
  assert.equal(useTopUpPurchaseStore.getState().intents[contextKey]?.order?.order_id, order.order_id);
  assert.equal(useTopUpPurchaseStore.getState().intents[contextKey]?.idempotencyKey, intent.idempotencyKey);

  const orderKey = topUpQueryKeys.order(intent.userId, contextKey, order.order_id);
  client.setQueryData(orderKey, order);
  const recovered: TopUpCheckout = { ...order, status: "open", checkout_url: "https://checkout.stripe.com/recovered", expires_at: "2099-01-01T00:00:00Z" };
  await reconcileTopUpOrder(client, intent, recovered);
  assert.equal(client.getQueryData<TopUpCheckout>(orderKey)?.status, "open");
  assert.equal(client.getQueryData<TopUpCheckout>(orderKey)?.checkout_url, recovered.checkout_url);
  assert.equal(useTopUpPurchaseStore.getState().intents[contextKey]?.idempotencyKey, intent.idempotencyKey);

  // An old order's response must not remove a newer purchase for the same user/context.
  const newer = { ...intent, idempotencyKey: "newer-purchase-key" };
  useTopUpPurchaseStore.getState().put(contextKey, newer);
  const beforeStaleRemoval = writes;
  useTopUpPurchaseStore.getState().remove(contextKey, intent.idempotencyKey);
  assert.equal(writes, beforeStaleRemoval);
  assert.equal(useTopUpPurchaseStore.getState().intents[contextKey]?.idempotencyKey, newer.idempotencyKey);

  assert.equal(isTopUpOrderNotFound(new ApiRequestError({ status: 404, code: "not_found", message: "Unavailable" })), true);
  assert.equal(isTopUpOrderNotFound(new ApiRequestError({ status: 503, code: "billing_provider_unavailable", message: "Retry later" })), false);
  assert.equal(isTopUpOrderNotFound(new Error("Network error")), false);
  useTopUpPurchaseStore.getState().remove(contextKey, newer.idempotencyKey);
  assert.equal(useTopUpPurchaseStore.getState().intents[contextKey], undefined);

  // A terminal recovery response refreshes balances even when polling has stopped.
  useTopUpPurchaseStore.getState().put(contextKey, intent);
  const overviewKey = topUpQueryKeys.overview(intent.userId, "personal", null, null);
  const subscriptionKey = billingQueryKeys.overview(intent.userId);
  client.setQueryData(overviewKey, { usable_balance: 0 });
  client.setQueryData(subscriptionKey, { can_use_paid_features: true });
  await reconcileTopUpOrder(client, intent, { ...recovered, status: "completed" });
  assert.equal(client.getQueryData<TopUpCheckout>(orderKey)?.status, "completed");
  assert.equal(useTopUpPurchaseStore.getState().intents[contextKey], undefined);
  assert.equal(client.getQueryState(overviewKey)?.isInvalidated, true);
  assert.equal(client.getQueryState(subscriptionKey)?.isInvalidated, true);
} finally {
  client.clear();
  useTopUpPurchaseStore.setState({ intents: {}, returnMarker: null });
  if (storageDescriptor) Object.defineProperty(globalThis, "sessionStorage", storageDescriptor);
  else Reflect.deleteProperty(globalThis, "sessionStorage");
}
