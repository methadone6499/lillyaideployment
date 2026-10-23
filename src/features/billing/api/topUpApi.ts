import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";
import { z } from "zod";
import { nonEmptyIdSchema } from "../schemas/billingSchemas";
import { topUpOverviewSchema, topUpCheckoutRequestSchema, topUpCheckoutSchema, setMemberTopUpRequestSchema, setMemberTopUpResponseSchema } from "../schemas/topUpSchemas";

export function getTopUpOverview(signal?: AbortSignal) {
  return authenticatedAuthRequest((token, requestSignal) => apiRequest("/api/v1/top-ups/me", {
    headers: { Authorization: `Bearer ${token}` }, schema: topUpOverviewSchema, signal: requestSignal,
  }), signal);
}
export function createTopUpCheckout(quantity: number, idempotencyKey: string, signal?: AbortSignal) {
  const body = topUpCheckoutRequestSchema.parse({ quantity });
  const key = z.string().min(1).max(200).parse(idempotencyKey);
  return authenticatedAuthRequest((token, requestSignal) => apiRequest("/api/v1/top-ups/checkout", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Idempotency-Key": key },
    body, schema: topUpCheckoutSchema, signal: requestSignal,
  }), signal);
}
export function getTopUpOrder(orderId: string, signal?: AbortSignal) {
  const id = nonEmptyIdSchema.parse(orderId);
  return authenticatedAuthRequest((token, requestSignal) => apiRequest(`/api/v1/top-ups/orders/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` }, schema: topUpCheckoutSchema, signal: requestSignal,
  }), signal);
}
export function setMemberTopUpBalance(membershipId: string, balance: number, signal?: AbortSignal) {
  const id = nonEmptyIdSchema.parse(membershipId);
  const body = setMemberTopUpRequestSchema.parse({ balance });
  return authenticatedAuthRequest((token, requestSignal) => apiRequest(`/api/v1/top-ups/companies/me/seats/${encodeURIComponent(id)}`, {
    method: "PUT", headers: { Authorization: `Bearer ${token}` }, body,
    schema: setMemberTopUpResponseSchema, signal: requestSignal,
  }), signal);
}
