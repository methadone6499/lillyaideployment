"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  fetchReportJobStatus,
  generateReport,
} from "../api/reportApi";

export function useGenerateReportMutation() {
  return useMutation({
    mutationFn: generateReport,
  });
}

export function useReportJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ["report-job", jobId],
    queryFn: () => fetchReportJobStatus(jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const sections = query.state.data?.sections ?? [];
      const allComplete = sections.every((s) => s.status === "complete");
      return allComplete ? false : 2000;
    },
  });
}
