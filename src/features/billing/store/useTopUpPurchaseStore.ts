"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { z } from "zod";
import { topUpCheckoutSchema, topUpQuantitySchema } from "../schemas/topUpSchemas";
import { getTopUpCheckoutUrl } from "../utils/topUpPolicy";
import { emitTopUpEvent } from "../utils/topUpTelemetry";
import { useAuthStore } from "@/store/useAuthStore";

export const pendingTopUpIntentSchema = z.object({
  userId: z.string().min(1), contextKey: z.string().min(1),
  quantity: topUpQuantitySchema, idempotencyKey: z.string().min(1).max(200),
  order: topUpCheckoutSchema.nullable(), redirected: z.boolean(),
  quotedUnitAmount: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  quotedCurrency: z.string().regex(/^[a-zA-Z]{3}$/),
});
export type PendingTopUpIntent = z.infer<typeof pendingTopUpIntentSchema>;
const persistedSchema = z.object({ intents: z.record(z.string(), pendingTopUpIntentSchema) });
const returnMarkerSchema = z.object({ kind: z.enum(["subscription", "top-up"]), userId: z.string(), contextKey: z.string().optional() });
const RETURN_MARKER_KEY = "formulary-hta-payment-return";
type TopUpPurchaseState = {
  intents: Record<string, PendingTopUpIntent>;
  hydrated: boolean;
  returnMarker: z.infer<typeof returnMarkerSchema> | null;
  put: (key: string, intent: PendingTopUpIntent) => void;
  remove: (key: string, expectedIdempotencyKey?: string) => void;
};
export const useTopUpPurchaseStore = create<TopUpPurchaseState>()(persist((set, get) => ({
  intents: {}, hydrated: false, returnMarker: null,
  put: (key, intent) => set((state) => ({ intents: { ...state.intents, [key]: pendingTopUpIntentSchema.parse(intent) } })),
  remove: (key, expectedIdempotencyKey) => {
    const intent = get().intents[key];
    // Even a no-op set writes through persist and can erase unhydrated recovery data.
    if (!intent || (expectedIdempotencyKey && intent.idempotencyKey !== expectedIdempotencyKey)) return;
    set((state) => {
      const intents = { ...state.intents };
      delete intents[key];
      return { intents };
    });
  },
}), {
  name: "formulary-hta-report-top-ups-v1",
  storage: createJSONStorage(() => ({
    getItem: (name) => { try { return sessionStorage.getItem(name); } catch { return null; } },
    setItem: (name, value) => { try { sessionStorage.setItem(name, value); } catch { /* Navigation verifies persistence explicitly. */ } },
    removeItem: (name) => { try { sessionStorage.removeItem(name); } catch { /* In-memory state can still be cleared. */ } },
  })),
  skipHydration: true,
  partialize: (state) => ({ intents: state.intents }),
  merge: (persisted, current) => {
    const parsed = persistedSchema.safeParse(persisted);
    return { ...current, intents: parsed.success ? parsed.data.intents : {} };
  },
}));
let hydration: Promise<void> | undefined;
export function hydrateTopUpPurchases() {
  hydration ??= Promise.resolve(useTopUpPurchaseStore.persist.rehydrate()).catch(() => undefined).then(() => {
    let returnMarker: z.infer<typeof returnMarkerSchema> | null = null;
    try {
      const parsed = returnMarkerSchema.safeParse(JSON.parse(sessionStorage.getItem(RETURN_MARKER_KEY) ?? "null"));
      if (parsed.success) returnMarker = parsed.data;
    } catch { /* A missing marker falls back to ordinary subscription reconciliation. */ }
    useTopUpPurchaseStore.setState({ hydrated: true, returnMarker });
  });
  return hydration;
}
export function clearTopUpPurchaseState() {
  useTopUpPurchaseStore.setState({ intents: {}, returnMarker: null });
  try { sessionStorage.removeItem(RETURN_MARKER_KEY); } catch { /* Storage may be unavailable. */ }
  useTopUpPurchaseStore.persist.clearStorage();
}
export function clearTopUpReturnMarker() {
  const state = useTopUpPurchaseStore.getState();
  useTopUpPurchaseStore.setState({ intents: Object.fromEntries(Object.entries(state.intents).map(([key, intent]) => [key, { ...intent, redirected: false }])) });
  const marker = { kind: "subscription" as const, userId: useAuthStore.getState().confirmedUserId ?? "" };
  sessionStorage.setItem(RETURN_MARKER_KEY, JSON.stringify(marker));
  useTopUpPurchaseStore.setState({ returnMarker: marker });
}
export function navigateToTopUpCheckout(intent: PendingTopUpIntent) {
  const url = intent.order && getTopUpCheckoutUrl(intent.order);
  if (!url) throw new Error("This checkout is unavailable or expired. Check payment status before continuing.");
  clearTopUpReturnMarker();
  useTopUpPurchaseStore.getState().put(intent.contextKey, { ...intent, redirected: true });
  const marker = { kind: "top-up" as const, userId: intent.userId, contextKey: intent.contextKey };
  sessionStorage.setItem(RETURN_MARKER_KEY, JSON.stringify(marker));
  useTopUpPurchaseStore.setState({ returnMarker: marker });
  assertTopUpIntentSaved(intent);
  emitTopUpEvent({ name: "top_up_checkout_redirected", orderId: intent.order!.order_id, quantity: intent.quantity });
  window.location.assign(url);
}
export function assertTopUpIntentSaved(intent: PendingTopUpIntent) {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem("formulary-hta-report-top-ups-v1") ?? "null");
    const parsed = z.object({ state: persistedSchema }).safeParse(saved);
    const stored = parsed.success ? parsed.data.state.intents[intent.contextKey] : null;
    if (stored?.idempotencyKey === intent.idempotencyKey && stored.quantity === intent.quantity && stored.order?.order_id === intent.order?.order_id) return;
  } catch { /* The caller gets an actionable storage message, without creating another order. */ }
  throw new Error("Your browser could not save payment recovery details. Allow session storage before continuing to payment.");
}
