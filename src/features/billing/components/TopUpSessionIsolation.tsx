"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authQueryKeys, getActiveContext, getCachedAuthMe } from "@/features/auth";
import { hydrateTopUpPurchases, useTopUpPurchaseStore } from "../store/useTopUpPurchaseStore";
import { closeTopUpForfeiturePrompt } from "../store/useTopUpForfeitureStore";

export function TopUpSessionIsolation() {
  const client = useQueryClient();
  useEffect(() => {
    const identity = () => {
      const me = getCachedAuthMe(client);
      const context = getActiveContext(me);
      return { userId: me?.user.id, type: context?.type, companyId: context?.company_id ?? null, membershipId: context?.membership_id ?? null,
        key: JSON.stringify([me?.user.id ?? null, context?.type, context?.company_id ?? null, context?.membership_id ?? null]) };
    };
    let previous = identity();
    return client.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] !== authQueryKeys.me[0] || event.query.queryKey[1] !== authQueryKeys.me[1]) return;
      const next = identity();
      if (previous.key === next.key) return;
      const old = previous;
      previous = next;
      // Discovering the authenticated user on reload is not a workspace departure.
      if (!old.userId) return;
      // Only remove old context entries; an arriving response cannot populate the new context's key.
      const predicate = (query: { queryKey: readonly unknown[] }) => {
        const key = query.queryKey;
        if (key[0] !== "top-ups" || key[1] !== old.userId) return false;
        return key[2] === "overview" ? key[3] === old.type && key[4] === old.companyId && key[5] === old.membershipId : key[3] === old.key;
      };
      void client.cancelQueries({ predicate });
      client.removeQueries({ predicate });
      // Restore persisted intents before removing an actual previous context.
      void hydrateTopUpPurchases().then(() => {
        useTopUpPurchaseStore.getState().remove(old.key);
      });
      closeTopUpForfeiturePrompt();
    });
  }, [client]);
  return null;
}
