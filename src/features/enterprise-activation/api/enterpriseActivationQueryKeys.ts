export const enterpriseActivationQueryKeys = {
  root: ["enterprise-activation"] as const,
  activate: () =>
    [...enterpriseActivationQueryKeys.root, "activate"] as const,
  snapshot: (userId: string) =>
    [...enterpriseActivationQueryKeys.root, "snapshot", userId] as const,
};
