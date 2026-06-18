import type { QueryClient } from "@tanstack/react-query";
import { getAuthUserId } from "@/lib/authToken";
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
  reportId: string,
) {
  queryClient.removeQueries({ queryKey: reportQueryKeys.byReport(reportId) });
}

export function clearAllReportQueries(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: reportQueryKeys.root });
}

export function syncWizardWithAuthSession(queryClient: QueryClient) {
  const authUserId = getAuthUserId();
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
