"use client";

import type { QueryClient } from "@tanstack/react-query";

import { getCachedAuthMe } from "@/features/auth";

import { platformReportQueryKeys } from "../api/platformReportQueryKeys";
import { usePendingPlatformSavesStore } from "../store/usePendingPlatformSavesStore";

function isPlatformReportQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === platformReportQueryKeys.root[0];
}

async function cancelAndRemovePlatformReportQueries(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries({
    predicate: (query) => isPlatformReportQueryKey(query.queryKey),
  });

  queryClient.removeQueries({
    predicate: (query) => isPlatformReportQueryKey(query.queryKey),
  });
}

/**
 * Clears Platform report React Query caches and the owner-scoped pending-save
 * queue (in-memory + persisted). Used on logout / authenticated-user change.
 */
export async function clearPlatformReportSession(
  queryClient: QueryClient,
): Promise<void> {
  await cancelAndRemovePlatformReportQueries(queryClient);
  usePendingPlatformSavesStore.getState().clearPendingSaves();
  usePendingPlatformSavesStore.getState().setOwnerUserId(null);
  await usePendingPlatformSavesStore.persist.clearStorage();
}

/**
 * On authenticated-user mismatch: cancel Platform queries, clear the queue and
 * its persisted storage, then bind the queue to the current user.
 * When unbound and non-empty (legacy unowned entries), clear before binding.
 * When unbound and empty, only set ownerUserId.
 */
export async function syncPendingPlatformSavesWithAuthSession(
  queryClient: QueryClient,
): Promise<void> {
  const authUserId = getCachedAuthMe(queryClient)?.user.id;
  if (!authUserId) {
    return;
  }

  const { ownerUserId, items } = usePendingPlatformSavesStore.getState();

  if (ownerUserId && ownerUserId !== authUserId) {
    await cancelAndRemovePlatformReportQueries(queryClient);
    usePendingPlatformSavesStore.getState().clearPendingSaves();
    await usePendingPlatformSavesStore.persist.clearStorage();
    usePendingPlatformSavesStore.getState().setOwnerUserId(authUserId);
    return;
  }

  if (!ownerUserId) {
    if (Object.keys(items).length > 0) {
      await cancelAndRemovePlatformReportQueries(queryClient);
      usePendingPlatformSavesStore.getState().clearPendingSaves();
      await usePendingPlatformSavesStore.persist.clearStorage();
    }

    usePendingPlatformSavesStore.getState().setOwnerUserId(authUserId);
  }
}
