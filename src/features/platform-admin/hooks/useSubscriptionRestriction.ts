"use client";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfirmedUserId } from "@/features/auth";
import { changeSubscriptionRestriction } from "../api/adminSubscriptionApi";
import { adminSubscriptionQueryKeys } from "../api/adminSubscriptionQueryKeys";
import { adminUserQueryKeys } from "../api/adminUserQueryKeys";
import { adminCompanyQueryKeys } from "../api/adminCompanyQueryKeys";
// A synchronous guard also covers two controls clicked before React re-renders.
const activeOwners = new Set<string>();
export function useSubscriptionRestriction(targetId: string) {
  const client = useQueryClient();
  const actor = useConfirmedUserId() ?? "";
  const mutationKey = adminSubscriptionQueryKeys.restriction(actor, targetId);
  const pending = useIsMutating({ mutationKey, exact: true }) > 0;
  const refresh = () => Promise.all([
    client.invalidateQueries({ queryKey: adminSubscriptionQueryKeys.root }),
    client.invalidateQueries({ queryKey: adminUserQueryKeys.lists(actor) }),
    client.invalidateQueries({ queryKey: adminCompanyQueryKeys.root }),
  ]);
  const mutation = useMutation({
    mutationKey, retry: false,
    mutationFn: async (action: "suspend" | "unsuspend") => {
      const lock = `${actor}:${targetId}`;
      if (activeOwners.has(lock))
        throw new Error("A purchase restriction update is already in progress.");
      activeOwners.add(lock);
      try {
        return await changeSubscriptionRestriction(targetId, action);
      }
      finally {
        activeOwners.delete(lock);
      }
    },
    onSuccess: async (user) => {
      client.setQueryData(adminUserQueryKeys.detail(actor, targetId), user);
      await refresh();
    },
    onError: async () => {
      await Promise.all([client.invalidateQueries({ queryKey: adminUserQueryKeys.detail(actor, targetId) }), refresh()]);
    },
  });
  return { ...mutation, isOwnerPending: pending || mutation.isPending };
}
