import { authenticatedAuthRequest } from "@/features/auth";
import { apiRequest } from "@/services/apiRequest";

import {
  billingHistoryPageSchema,
  billingHistoryRequestSchema,
  type BillingHistoryPage,
} from "../schemas/billingHistorySchemas";

export function getBillingHistory(
  cursor?: string,
  signal?: AbortSignal,
  limit = 20,
): Promise<BillingHistoryPage> {
  const params = billingHistoryRequestSchema.parse({ cursor, limit });
  const query = new URLSearchParams({ limit: String(params.limit) });

  if (params.cursor !== undefined) {
    query.set("cursor", params.cursor);
  }

  return authenticatedAuthRequest(
    (accessToken, requestSignal) =>
      apiRequest(`/api/v1/billing/history?${query}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        schema: billingHistoryPageSchema,
        signal: requestSignal,
      }),
    signal,
  );
}
