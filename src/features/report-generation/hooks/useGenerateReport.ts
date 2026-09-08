"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrReplaceCustomSection,
  deleteCustomSection,
  downloadPptxWhenReady,
  fetchPptxExportStatus,
  fetchReportSection,
  fetchReportStatus,
  generateReport,
  listCustomSections,
  patchCustomSection,
  queuePdfExport,
  queuePptxExport,
  updateReportSelections,
  type DownloadPptxWhenReadyOptions,
} from "../api/reportApi";
import { ReportApiError } from "../api/reportFetch";
import { reportQueryKeys } from "../api/reportQueryKeys";
import type {
  CreateCustomSectionInput,
  GenerateReportInput,
  PatchCustomSectionInput,
  QueuePptxExportInput,
  UpdateReportSelectionsInput,
} from "../types";
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
        reportStatus === "partially_completed" ||
        reportStatus === "failed"
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

export function useQueuePptxExportMutation() {
  return useMutation({
    mutationKey: reportQueryKeys.pptxExportMutation,
    mutationFn: ({
      reportServiceId,
      input = { force_regenerate: false },
      signal,
    }: {
      reportServiceId: string;
      input?: QueuePptxExportInput;
      signal?: AbortSignal;
    }) => queuePptxExport(reportServiceId, input, signal),
  });
}

export function usePptxExportStatus(
  reportServiceId: string | null,
  enabled = false,
) {
  const queriesEnabled = useReportQueriesEnabled(
    Boolean(reportServiceId) && enabled,
  );

  return useQuery({
    queryKey: reportQueryKeys.pptxStatus(reportServiceId ?? ""),
    queryFn: ({ signal }) => fetchPptxExportStatus(reportServiceId!, signal),
    enabled: queriesEnabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useDownloadPptxWhenReadyMutation() {
  return useMutation({
    mutationKey: reportQueryKeys.pptxDownloadMutation,
    mutationFn: ({
      reportServiceId,
      signal,
      onProgress,
    }: {
      reportServiceId: string;
      signal?: AbortSignal;
      onProgress?: DownloadPptxWhenReadyOptions["onProgress"];
    }) => downloadPptxWhenReady(reportServiceId, { signal, onProgress }),
  });
}

export function useListCustomSections(reportServiceId: string | null) {
  const queriesEnabled = useReportQueriesEnabled(Boolean(reportServiceId));

  return useQuery({
    queryKey: reportQueryKeys.customSections(reportServiceId ?? ""),
    queryFn: ({ signal }) => listCustomSections(reportServiceId!, signal),
    enabled: queriesEnabled,
    staleTime: 0,
  });
}

export function useCreateCustomSectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: reportQueryKeys.customSectionMutation,
    mutationFn: ({
      reportServiceId,
      input,
      signal,
    }: {
      reportServiceId: string;
      input: CreateCustomSectionInput;
      signal?: AbortSignal;
    }) => createOrReplaceCustomSection(reportServiceId, input, signal),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: reportQueryKeys.customSections(variables.reportServiceId),
      });
    },
  });
}

export function usePatchCustomSectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: reportQueryKeys.customSectionMutation,
    mutationFn: ({
      reportServiceId,
      customId,
      input,
      signal,
    }: {
      reportServiceId: string;
      customId: string;
      input: PatchCustomSectionInput;
      signal?: AbortSignal;
    }) => patchCustomSection(reportServiceId, customId, input, signal),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: reportQueryKeys.customSections(variables.reportServiceId),
      });
    },
  });
}

export function useDeleteCustomSectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: reportQueryKeys.customSectionMutation,
    mutationFn: ({
      reportServiceId,
      customId,
      signal,
    }: {
      reportServiceId: string;
      customId: string;
      signal?: AbortSignal;
    }) => deleteCustomSection(reportServiceId, customId, signal),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: reportQueryKeys.customSections(variables.reportServiceId),
      });
    },
  });
}
