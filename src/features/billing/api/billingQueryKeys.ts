export const billingQueryKeys = {
  root: ["billing"] as const,
  overview: (userId: string) =>
    [...billingQueryKeys.root, "overview", userId] as const,
  authReconciliation: (userId: string, generation: number) =>
    [
      ...billingQueryKeys.root,
      "auth-reconciliation",
      userId,
      generation,
    ] as const,
  mutations: () => [...billingQueryKeys.root, "mutation"] as const,
  checkout: () => [...billingQueryKeys.mutations(), "checkout"] as const,
  portal: () => [...billingQueryKeys.mutations(), "portal"] as const,
  upgrade: () => [...billingQueryKeys.mutations(), "upgrade"] as const,
  downgrade: () => [...billingQueryKeys.mutations(), "downgrade"] as const,
  cancelDowngrade: () =>
    [...billingQueryKeys.mutations(), "cancel-downgrade"] as const,
};
