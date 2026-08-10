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
      reportServiceId,
      input,
      signal,
    }: {
      reportServiceId: string;
      input: UpdateReportSelectionsInput;
      signal?: AbortSignal;
    }) => updateReportSelections(reportServiceId, input, signal),
  });
}

export function useGenerateReportMutation() {
  return useMutation({
    mutationFn: ({
      reportServiceId,
      input,
      signal,
    }: {
      reportServiceId: string;
      input: GenerateReportInput;
      signal?: AbortSignal;
    }) => generateReport(reportServiceId, input, signal),
  });
}

export function useReportStatus(reportServiceId: string | null) {
  const queriesEnabled = useReportQueriesEnabled(Boolean(reportServiceId));

  return useQuery({
    queryKey: reportQueryKeys.status(reportServiceId ?? ""),
    queryFn: ({ signal }) => fetchReportStatus(reportServiceId!, signal),
    enabled: queriesEnabled,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      if (!queriesEnabled) {
        return false;
      }

      const data = query.state.data;
      const reportStatus = data?.report_status;
      if (
        reportStatus === "completed" ||
        reportStatus === "partially_completed"
      ) {
        return false;
      }

      // Terminal job failure — report_status may still be pending/processing.
      // `cancelled` is not in the live jobStatusSchema contract; do not invent it.
      if (data?.job_status === "failed") {
        return false;
      }

      return STATUS_POLL_INTERVAL_MS;
    },
  });
}

export function useReportSection(
  reportServiceId: string | null,
  sectionId: string | undefined,
  enabled: boolean,
  sectionStatus?: string,
  reportStatus?: string,
) {
  const queriesEnabled = useReportQueriesEnabled(
    Boolean(reportServiceId && sectionId && enabled),
  );

  return useQuery({
    queryKey: reportQueryKeys.section(
      reportServiceId ?? "",
      sectionId ?? "",
      sectionStatus,
      reportStatus,
    ),
    queryFn: ({ signal }) =>
      fetchReportSection(reportServiceId!, sectionId!, signal),
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
  reportServiceId: string | null,
  isReportReady: boolean,
) {
  const queriesEnabled = useReportQueriesEnabled(
    Boolean(reportServiceId) && isReportReady,
  );

  return useQuery({
    queryKey: reportQueryKeys.pdfQueue(reportServiceId ?? ""),
    queryFn: ({ signal }) => queuePdfExport(reportServiceId!, signal),
    enabled: queriesEnabled,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
