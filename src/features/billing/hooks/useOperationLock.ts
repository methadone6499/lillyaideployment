"use client";

import { getActiveContext, useAuthUser } from "@/features/auth";

import type { OperationLockAction } from "../schemas/billingSchemas";
import { OPERATION_LOCK_REFETCH_INTERVAL_MS } from "../utils/billingConstants";
import { selectOperationLock } from "../utils/selectOperationLock";
import { useSubscriptionOverview } from "./useSubscriptionOverview";

export type UseOperationLockParams = {
  enabled?: boolean;
};

export function useOperationLock(params: UseOperationLockParams = {}) {
  const { authMe } = useAuthUser();
  const contextType = getActiveContext(authMe)?.type;
  const canHaveLock = contextType === "personal" || contextType === "company";
  const overviewQuery = useSubscriptionOverview({
    enabled: canHaveLock && (params.enabled ?? true),
    refetchInterval: (query) =>
      selectOperationLock(query.state.data)
        ? OPERATION_LOCK_REFETCH_INTERVAL_MS
        : false,
  });
  const lock = canHaveLock ? selectOperationLock(overviewQuery.data) : null;

  return {
    lock,
    overview: overviewQuery.data,
    isBlocked: (action: OperationLockAction) =>
      lock?.blocked_actions.includes(action) ?? false,
    refetch: overviewQuery.refetch,
  };
}
