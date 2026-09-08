export const dosageCalculatorQueryKeys = {
  root: ["dosage-calculator"] as const,
  enqueueMutation: () =>
    [...dosageCalculatorQueryKeys.root, "enqueue"] as const,
  job: (jobId: string) =>
    [...dosageCalculatorQueryKeys.root, "job", jobId] as const,
  status: (jobId: string) =>
    [...dosageCalculatorQueryKeys.job(jobId), "status"] as const,
  result: (jobId: string) =>
    [...dosageCalculatorQueryKeys.job(jobId), "result"] as const,
};
