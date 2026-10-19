import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";
import { adminSubscriptionFiltersSchema, adminSubscriptionListSchema, adminSubscriptionSchema, adminSubscriptionSummarySchema, type AdminSubscriptionFilters } from "../schemas/adminSubscriptionSchemas";
import { adminUserResponseSchema } from "../schemas/adminUserSchemas";
const prefix = "/api/v1/admin/subscriptions";
export function listAdminSubscriptions(filters: AdminSubscriptionFilters, cursor: string | null, signal?: AbortSignal) {
  const params = adminSubscriptionFiltersSchema.parse(filters);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== undefined)
      query.set(key, String(value));
  if (cursor !== null)
    query.set("cursor", cursor);
  return authenticatedAuthRequest((token, requestSignal) => apiRequest(`${prefix}?${query}`, {
    headers: { Authorization: `Bearer ${token}` }, schema: adminSubscriptionListSchema, signal: requestSignal,
  }), signal);
}
export function getAdminSubscription(id: string, signal?: AbortSignal) {
  return authenticatedAuthRequest((token, requestSignal) => apiRequest(`${prefix}/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` }, schema: adminSubscriptionSchema, signal: requestSignal,
  }), signal);
}
export function getAdminSubscriptionSummary(signal?: AbortSignal) {
  return authenticatedAuthRequest((token, requestSignal) => apiRequest(`${prefix}/summary`, {
    headers: { Authorization: `Bearer ${token}` }, schema: adminSubscriptionSummarySchema, signal: requestSignal,
  }), signal);
}
export function changeSubscriptionRestriction(userId: string, action: "suspend" | "unsuspend") {
  return authenticatedAuthRequest((token, signal) => apiRequest(`/api/v1/admin/users/${encodeURIComponent(userId)}/subscription-${action}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, schema: adminUserResponseSchema, signal,
  }));
}
