import type { QueryClient } from "@tanstack/react-query";
import { getCachedAuthMe } from "@/features/auth";
import { reportQueryKeys } from "../api/reportQueryKeys";
import { useReportWizardStore } from "./useReportWizardStore";

export function resetReportWizard() {
  useReportWizardStore.getState().resetWizard();
}

export function setWizardUserId(userId: string) {
  useReportWizardStore.getState().setUserId(userId);
}

export function beginReportWizardSession(userId: string) {
  resetReportWizard();
  setWizardUserId(userId);
}

export function clearReportQueriesForReport(
  queryClient: QueryClient,
  reportServiceId: string,
) {
  queryClient.removeQueries({
    queryKey: reportQueryKeys.byReport(reportServiceId),
  });
}

export function clearAllReportQueries(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: reportQueryKeys.root });
}

export function syncWizardWithAuthSession(queryClient: QueryClient) {
  const authUserId = getCachedAuthMe(queryClient)?.user.id;
  if (!authUserId) {
    return;
  }

  const { userId, resetWizard, setUserId } = useReportWizardStore.getState();

  if (userId && userId !== authUserId) {
    clearAllReportQueries(queryClient);
    resetWizard();
    setUserId(authUserId);
    return;
  }

  if (!userId) {
    setUserId(authUserId);
  }
}

function isReportRelatedQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === reportQueryKeys.root[0];
}

let clearReportGenerationSessionPromise: Promise<void> | null = null;

/**
 * Clears Report Service React Query caches and the wizard persist store.
 * Used on logout / authenticated-user change. Does not touch Platform reports.
 */
export async function clearReportGenerationSession(
  queryClient: QueryClient,
): Promise<void> {
  if (clearReportGenerationSessionPromise) {
    return clearReportGenerationSessionPromise;
  }

  clearReportGenerationSessionPromise = (async () => {
    await queryClient.cancelQueries({
      predicate: (query) => isReportRelatedQueryKey(query.queryKey),
    });

    clearAllReportQueries(queryClient);

    queryClient.removeQueries({
      predicate: (query) => isReportRelatedQueryKey(query.queryKey),
    });

    useReportWizardStore.getState().resetWizard();
    useReportWizardStore.setState({ userId: null });
    await useReportWizardStore.persist.clearStorage();
  })().finally(() => {
    clearReportGenerationSessionPromise = null;
  });

  return clearReportGenerationSessionPromise;
}

/** @deprecated Prefer {@link clearReportGenerationSession}. */
export const clearReportSession = clearReportGenerationSession;
