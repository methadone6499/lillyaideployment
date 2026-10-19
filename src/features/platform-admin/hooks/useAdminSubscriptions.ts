"use client";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { hasPermission, useAuthUser, useIsAuthenticated } from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";
import { getAdminSubscription, getAdminSubscriptionSummary, listAdminSubscriptions } from "../api/adminSubscriptionApi";
import { adminSubscriptionQueryKeys as keys } from "../api/adminSubscriptionQueryKeys";
import type { AdminSubscriptionFilters } from "../schemas/adminSubscriptionSchemas";
const retry = (count: number, error: unknown) => count < 1 && !(error instanceof ApiRequestError && error.status < 500);
function useSubscriptionActor() {
  const { authMe, userId } = useAuthUser();
  const authenticated = useIsAuthenticated();
  return { actor: userId ?? "", enabled: authenticated && Boolean(userId) && hasPermission(authMe, "admin:subscriptions_read") };
}
export function useAdminSubscriptionSummary() {
  const { actor, enabled } = useSubscriptionActor();
  return useQuery({ queryKey: keys.summary(actor), queryFn: ({ signal }) => getAdminSubscriptionSummary(signal), enabled, retry, staleTime: 30000 });
}
export function useAdminSubscription(id: string, active = true) {
  const { actor, enabled } = useSubscriptionActor();
  return useQuery({ queryKey: keys.detail(actor, id), queryFn: ({ signal }) => getAdminSubscription(id, signal), enabled: enabled && Boolean(id) && active, retry, staleTime: 30000 });
}
export function useAdminSubscriptions(filters: AdminSubscriptionFilters) {
  const { actor, enabled } = useSubscriptionActor();
  const client = useQueryClient();
  const queryKey = keys.list(actor, filters);
  const query = useInfiniteQuery({
    queryKey, queryFn: ({ pageParam, signal }) => listAdminSubscriptions(filters, pageParam, signal),
    initialPageParam: null as string | null, getNextPageParam: (page) => page.next_cursor ?? undefined,
    enabled, retry, staleTime: 30000,
  });
  return {
    ...query, fetchNextPage: async () => {
      const result = await query.fetchNextPage();
      if (result.error instanceof ApiRequestError && result.error.code === "invalid_cursor") {
        await client.resetQueries({ queryKey, exact: true });
      }
      return result;
    }
  };
}
