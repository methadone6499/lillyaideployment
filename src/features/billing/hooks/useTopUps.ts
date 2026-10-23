"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { authQueryKeys, getActiveContext, useAuthUser, type AuthMeResponse } from "@/features/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiRequestError } from "@/services/ApiRequestError";
import { createTopUpCheckout, getTopUpOrder, getTopUpOverview, setMemberTopUpBalance } from "../api/topUpApi";
import { topUpQueryKeys } from "../api/topUpQueryKeys";
import { billingQueryKeys } from "../api/billingQueryKeys";
import { assertTopUpIntentSaved, hydrateTopUpPurchases, useTopUpPurchaseStore, type PendingTopUpIntent } from "../store/useTopUpPurchaseStore";
import { isTopUpOrderPending } from "../utils/topUpPolicy";
import { emitTopUpEvent } from "../utils/topUpTelemetry";
import type { TopUpCheckout } from "../schemas/topUpSchemas";
import { reconcileTopUpOrder, refreshTopUpBalances } from "../utils/reconcileTopUpOrder";
import { isTopUpOrderNotFound } from "../utils/topUpErrors";

function contextIdentity(userId: string | null, me: AuthMeResponse | undefined) {
  const context = getActiveContext(me);
  return JSON.stringify([userId, context?.type, context?.company_id ?? null, context?.membership_id ?? null]);
}
export function useTopUpContext() {
  const { userId, authMe, isAuthenticated } = useAuthUser();
  const context = getActiveContext(authMe);
  const access = useAuthStore((state) => state.companyAccess);
  const status = useAuthStore((state) => state.status);
  const supported = status === "authenticated" && isAuthenticated && Boolean(userId) &&
    (context?.type === "personal" || context?.type === "company") && access === "available";
  return { userId, context, supported, contextKey: contextIdentity(userId, authMe) };
}
export function usePendingTopUpIntent() {
  const context = useTopUpContext();
  const hydrated = useTopUpPurchaseStore((state) => state.hydrated);
  const intent = useTopUpPurchaseStore((state) => state.intents[context.contextKey]);
  const marker = useTopUpPurchaseStore((state) => state.returnMarker);
  useEffect(() => { void hydrateTopUpPurchases(); }, []);
  return { ...context, hydrated, returnKind: marker?.userId === context.userId && (!marker.contextKey || marker.contextKey === context.contextKey) ? marker.kind : null,
    intent: context.supported && intent?.userId === context.userId ? intent : undefined };
}
export function useTopUpOverview(enabled = true, refreshOnMount = false) {
  const { userId, context, supported, contextKey } = useTopUpContext();
  const client = useQueryClient();
  return useQuery({
    queryKey: topUpQueryKeys.overview(userId ?? "", context?.type ?? "unknown", context?.company_id ?? null, context?.membership_id ?? null),
    queryFn: async ({ signal }) => {
      const generation = useAuthStore.getState().sessionGeneration;
      const overview = await getTopUpOverview(signal);
      assertCurrentContext(client, contextKey, generation);
      if (overview.scope_type !== (context?.type === "company" ? "company" : "user")) throw new Error("Report balances were returned for a different workspace. Refresh your account context.");
      return overview;
    },
    enabled: supported && enabled, staleTime: refreshOnMount ? 0 : 15_000, gcTime: 5 * 60_000,
    refetchOnMount: refreshOnMount ? "always" : true,
    refetchOnWindowFocus: true, refetchOnReconnect: true,
    retry: (count, error) => count < 1 && !(error instanceof ApiRequestError && error.status < 500),
  });
}
export async function invalidateTopUps(client: QueryClient, userId: string | null) {
  if (userId) await client.invalidateQueries({ queryKey: topUpQueryKeys.user(userId) });
}
function assertCurrentContext(client: QueryClient, key: string, generation: number) {
  const state = useAuthStore.getState();
  const me = client.getQueryData<AuthMeResponse>(authQueryKeys.me);
  if (state.status !== "authenticated" || state.sessionGeneration !== generation || state.companyAccess !== "available" ||
    contextIdentity(state.confirmedUserId, me) !== key) throw new Error("Your account context changed. Reopen this action in your current workspace.");
}
export function useTopUpCheckoutMutation() {
  const client = useQueryClient();
  const context = useTopUpContext();
  return useMutation({
    mutationKey: [...billingQueryKeys.mutations(), "top-up-checkout"], retry: false,
    mutationFn: async ({ intent }: { intent: PendingTopUpIntent }) => {
      const generation = useAuthStore.getState().sessionGeneration;
      assertCurrentContext(client, intent.contextKey, generation);
      if (intent.contextKey !== context.contextKey) throw new Error("This purchase belongs to a different workspace.");
      useTopUpPurchaseStore.getState().put(intent.contextKey, intent);
      assertTopUpIntentSaved(intent);
      const order = await createTopUpCheckout(intent.quantity, intent.idempotencyKey);
      assertCurrentContext(client, intent.contextKey, generation);
      if (order.scope_type !== (context.context?.type === "company" ? "company" : "user")) throw new Error("The payment scope changed. Refresh Billing before continuing.");
      // An older status GET must not overwrite the recovered POST response.
      await client.cancelQueries({ queryKey: topUpQueryKeys.order(intent.userId, intent.contextKey, order.order_id), exact: true });
      assertCurrentContext(client, intent.contextKey, generation);
      await reconcileTopUpOrder(client, intent, order);
      return order;
    },
    onError: () => invalidateTopUps(client, context.userId),
  });
}
export function useTopUpOrder(intent: PendingTopUpIntent, pollUntil: number) {
  const client = useQueryClient();
  const context = useTopUpContext();
  const orderId = intent.order?.order_id;
  return useQuery({
    queryKey: topUpQueryKeys.order(intent.userId, intent.contextKey, orderId ?? ""),
    enabled: context.supported && context.contextKey === intent.contextKey && Boolean(orderId),
    queryFn: async ({ signal }) => {
      const generation = useAuthStore.getState().sessionGeneration;
      let order: TopUpCheckout;
      try {
        order = await getTopUpOrder(orderId!, signal);
      } catch (error) {
        if (isTopUpOrderNotFound(error)) {
          assertCurrentContext(client, intent.contextKey, generation);
          useTopUpPurchaseStore.getState().remove(intent.contextKey, intent.idempotencyKey);
          await refreshTopUpBalances(client, intent.userId);
        }
        throw error;
      }
      assertCurrentContext(client, intent.contextKey, generation);
      const previous = client.getQueryData<TopUpCheckout>(topUpQueryKeys.order(intent.userId, intent.contextKey, orderId!));
      if (previous?.status !== order.status) emitTopUpEvent({ name: "top_up_order_status_seen", orderId: order.order_id, status: order.status });
      await reconcileTopUpOrder(client, intent, order, false);
      return order;
    },
    staleTime: 0, retry: false, refetchOnWindowFocus: true, refetchOnReconnect: true,
    refetchInterval: (query) => {
      if (query.state.error || Date.now() >= pollUntil || (query.state.data && !isTopUpOrderPending(query.state.data.status))) return false;
      return pollUntil - Date.now() > 40_000 ? 2_000 : 5_000;
    },
  });
}
export function useSetMemberTopUpMutation() {
  const client = useQueryClient();
  const context = useTopUpContext();
  return useMutation({
    mutationKey: [...billingQueryKeys.mutations(), "top-up-allocation"], retry: false,
    mutationFn: async ({ membershipId, balance }: { membershipId: string; balance: number }) => {
      const generation = useAuthStore.getState().sessionGeneration;
      assertCurrentContext(client, context.contextKey, generation);
      const result = await setMemberTopUpBalance(membershipId, balance);
      assertCurrentContext(client, context.contextKey, generation);
      return result;
    },
    onSettled: () => invalidateTopUps(client, context.userId),
  });
}
