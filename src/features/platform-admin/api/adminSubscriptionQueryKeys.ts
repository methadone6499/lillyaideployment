import type { AdminSubscriptionFilters } from "../schemas/adminSubscriptionSchemas";
export const adminSubscriptionQueryKeys = {
  root: ["admin-subscriptions"] as const,
  lists: (actor: string) => ["admin-subscriptions", actor, "list"] as const,
  list: (actor: string, filters: AdminSubscriptionFilters) => ["admin-subscriptions", actor, "list", filters] as const,
  detail: (actor: string, id: string) => ["admin-subscriptions", actor, "detail", id] as const,
  summary: (actor: string) => ["admin-subscriptions", actor, "summary"] as const,
  restriction: (actor: string, user: string) => ["admin-subscriptions", actor, "restriction", user] as const,
};
