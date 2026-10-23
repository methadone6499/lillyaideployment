export const topUpQueryKeys = {
  root: ["top-ups"] as const,
  user: (userId: string) => ["top-ups", userId] as const,
  overview: (userId: string, type: string, companyId: string | null, membershipId: string | null) =>
    ["top-ups", userId, "overview", type, companyId, membershipId] as const,
  order: (userId: string, contextKey: string, orderId: string) =>
    ["top-ups", userId, "order", contextKey, orderId] as const,
};
