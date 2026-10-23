export function selectReportQuotaAvailability(input: {
  unlimited: boolean; entitled: boolean; blocked: boolean;
  monthlyRemaining: number | undefined; purchasedRemaining: number | undefined; pending: boolean;
}) {
  const hasQuota = (input.monthlyRemaining ?? 0) > 0 || (input.purchasedRemaining ?? 0) > 0;
  const checking = !input.unlimited && !hasQuota && input.pending;
  const unavailable = !input.unlimited && !hasQuota && !checking && (input.monthlyRemaining === undefined || input.purchasedRemaining === undefined);
  return {
    canGenerate: input.unlimited || (input.entitled && !input.blocked && hasQuota),
    checking, unavailable, exhausted: !input.unlimited && !hasQuota && !checking && !unavailable,
  };
}
