import type { QueryClient } from "@tanstack/react-query";
import { getActiveContext, getCachedAuthMe } from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";
import { useAuthStore } from "@/store/useAuthStore";
import { getTopUpOverview } from "../api/topUpApi";
import { confirmTopUpForfeiture } from "../store/useTopUpForfeitureStore";

export async function withTopUpForfeitureConfirmation<T>(client: QueryClient, userId: string | null, action: (acknowledged: boolean) => Promise<T>): Promise<T> {
  const generation = useAuthStore.getState().sessionGeneration;
  try { return await action(false); } catch (error) {
    if (!(error instanceof ApiRequestError) || error.code !== "top_up_forfeiture_acknowledgement_required") throw error;
    const assertPersonal = () => {
      if (!userId || useAuthStore.getState().confirmedUserId !== userId || !useAuthStore.getState().isGenerationCurrent(generation) ||
        getActiveContext(getCachedAuthMe(client))?.type !== "personal") throw new Error("Your workspace changed. Review the plan change again.");
    };
    assertPersonal();
    let overview = await getTopUpOverview();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      assertPersonal();
      if (overview.scope_type !== "user") throw error;
      if (overview.pool_balance === 0) return action(false);
      const confirmed = await confirmTopUpForfeiture(userId!, overview.pool_balance);
      assertPersonal();
      if (!confirmed) throw new Error("Plan change cancelled. Your personal additional reports have been kept.");
      const fresh = await getTopUpOverview();
      assertPersonal();
      if (fresh.scope_type === "user" && fresh.pool_balance === overview.pool_balance) return action(true);
      overview = fresh;
    }
    throw new Error("Your additional report balance kept changing. Review Billing and try the plan change again.");
  }
}
