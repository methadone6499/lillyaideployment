"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  fetchReportSection,
  fetchReportStatus,
  generateReport,
  queuePdfExport,
  updateReportSelections,
} from "../api/reportApi";
import { ReportApiError } from "../api/reportFetch";
import { reportQueryKeys } from "../api/reportQueryKeys";
import type { GenerateReportInput, UpdateReportSelectionsInput } from "../types";
import { useReportQueriesEnabled } from "./useReportQueriesEnabled";

const STATUS_POLL_INTERVAL_MS = 5_000;

export function useUpdateReportSelectionsMutation() {
  return useMutation({
    mutationFn: ({
      reportId,
      input,
      signal,
    }: {
      reportId: string;
      input: UpdateReportSelectionsInput;
      signal?: AbortSignal;
    }) => updateReportSelections(reportId, input, signal),
  });
}

export function useGenerateReportMutation() {
  return useMutation({
    mutationFn: ({
      reportId,
      input,
      signal,
    }: {
      reportId: string;
      input: GenerateReportInput;
      signal?: AbortSignal;
    }) => generateReport(reportId, input, signal),
  });
}

export function useReportStatus(reportId: string | null) {
  const queriesEnabled = useReportQueriesEnabled(Boolean(reportId));

  return useQuery({
    queryKey: reportQueryKeys.status(reportId ?? ""),
    queryFn: ({ signal }) => fetchReportStatus(reportId!, signal),
    enabled: queriesEnabled,
    refetchInterval: (query) => {
      if (!queriesEnabled) {
        return false;
      }

      const reportStatus = query.state.data?.report_status;
      if (
        reportStatus === "completed" ||
        reportStatus === "partially_completed"
      ) {
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
  const queriesEnabled = useReportQueriesEnabled(
    Boolean(reportId && sectionId && enabled),
  );

  return useQuery({
    queryKey: reportQueryKeys.section(reportId ?? "", sectionId ?? ""),
    queryFn: ({ signal }) => fetchReportSection(reportId!, sectionId!, signal),
    enabled: queriesEnabled,
    staleTime: 0,
    retry: (failureCount, error) => {
      if (error instanceof ReportApiError && error.status === 409) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useQueuePdfExport(
  reportId: string | null,
  isReportReady: boolean,
) {
  const queriesEnabled = useReportQueriesEnabled(
    Boolean(reportId) && isReportReady,
  );

  return useQuery({
    queryKey: reportQueryKeys.pdfQueue(reportId ?? ""),
    queryFn: ({ signal }) => queuePdfExport(reportId!, signal),
    enabled: queriesEnabled,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
