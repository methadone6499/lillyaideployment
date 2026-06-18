"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  fetchReportSection,
  fetchReportStatus,
  generateReport,
  updateReportSelections,
} from "../api/reportApi";
import { ReportApiError } from "../api/reportFetch";
import { reportQueryKeys } from "../api/reportQueryKeys";
import type { GenerateReportInput, UpdateReportSelectionsInput } from "../types";

const STATUS_POLL_INTERVAL_MS = 60_000;

export function useUpdateReportSelectionsMutation() {
  return useMutation({
    mutationFn: ({
      reportId,
      input,
    }: {
      reportId: string;
      input: UpdateReportSelectionsInput;
    }) => updateReportSelections(reportId, input),
  });
}

export function useGenerateReportMutation() {
  return useMutation({
    mutationFn: ({
      reportId,
      input,
    }: {
      reportId: string;
      input: GenerateReportInput;
    }) => generateReport(reportId, input),
  });
}

export function useReportStatus(reportId: string | null) {
  return useQuery({
    queryKey: reportQueryKeys.status(reportId ?? ""),
    queryFn: () => fetchReportStatus(reportId!),
    enabled: Boolean(reportId),
    refetchInterval: (query) => {
      const reportStatus = query.state.data?.report_status;
      if (reportStatus === "completed" || reportStatus === "failed") {
        return false;
      }
      return STATUS_POLL_INTERVAL_MS;
    },
  });
}

export function useReportSection(
  reportId: string | null,
  sectionId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: reportQueryKeys.section(reportId ?? "", sectionId ?? ""),
    queryFn: () => fetchReportSection(reportId!, sectionId!),
    enabled: Boolean(reportId && sectionId && enabled),
    retry: (failureCount, error) => {
      if (error instanceof ReportApiError && error.status === 409) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
