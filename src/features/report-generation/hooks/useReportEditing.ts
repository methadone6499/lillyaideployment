"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isEditingErrorCode } from "../api/reportApiError";
import {
  createRewritePreview,
  fetchEditableDocument,
  fetchRewritePresets,
  fetchSectionRevision,
  fetchSectionRevisions,
  restoreSectionRevision,
  saveEditableDocument,
} from "../api/reportEditingApi";
import { reportQueryKeys } from "../api/reportQueryKeys";
import type {
  CreateRewritePreviewInput,
  RestoreRevisionInput,
  SaveEditableDocumentInput,
} from "../schemas/editingSchemas";
import type { ReportSectionResponse } from "../types";
import { toReportSectionContent } from "../utils/reportBlockEditing";
import { toRewritePresetSectionType } from "../utils/reportEditing";
import { shouldRetrySaveEditableDocument } from "../utils/saveEditableDocument";
import { shouldRetryReportEditingQuery } from "../utils/shouldRetryReportEditingQuery";
import { useReportQueriesEnabled } from "./useReportQueriesEnabled";

export function useRewritePresets(
  sectionType: string | null,
  enabled = true,
) {
  const presetSectionType = sectionType
    ? toRewritePresetSectionType(sectionType)
    : "";
  const queriesEnabled = useReportQueriesEnabled(
    Boolean(presetSectionType) && enabled,
  );

  return useQuery({
    queryKey: reportQueryKeys.rewritePresets(presetSectionType),
    queryFn: ({ signal }) => fetchRewritePresets(presetSectionType, signal),
    enabled: queriesEnabled,
    staleTime: 5 * 60_000,
    retry: shouldRetryReportEditingQuery,
  });
}

export function useEditableDocument(
  reportServiceId: string | null,
  sectionId: string | null,
  enabled = true,
) {
  const queriesEnabled = useReportQueriesEnabled(
    Boolean(reportServiceId && sectionId) && enabled,
  );

  return useQuery({
    queryKey: reportQueryKeys.editableDocument(
      reportServiceId ?? "",
      sectionId ?? "",
    ),
    queryFn: ({ signal }) =>
      fetchEditableDocument(reportServiceId!, sectionId!, signal),
    enabled: queriesEnabled,
    staleTime: 0,
    retry: shouldRetryReportEditingQuery,
  });
}

export function useSectionRevisions(
  reportServiceId: string | null,
  sectionId: string | null,
  enabled = true,
) {
  const queriesEnabled = useReportQueriesEnabled(
    Boolean(reportServiceId && sectionId) && enabled,
  );

  return useQuery({
    queryKey: reportQueryKeys.sectionRevisions(
      reportServiceId ?? "",
      sectionId ?? "",
    ),
    queryFn: ({ signal }) =>
      fetchSectionRevisions(reportServiceId!, sectionId!, signal),
    enabled: queriesEnabled,
    staleTime: 0,
    retry: shouldRetryReportEditingQuery,
  });
}

export function useSectionRevision(
  reportServiceId: string | null,
  sectionId: string | null,
  revision: number | null,
  enabled = true,
) {
  const queriesEnabled = useReportQueriesEnabled(
    Boolean(reportServiceId && sectionId) &&
      typeof revision === "number" &&
      enabled,
  );

  return useQuery({
    queryKey: reportQueryKeys.sectionRevision(
      reportServiceId ?? "",
      sectionId ?? "",
      revision ?? -1,
    ),
    queryFn: ({ signal }) =>
      fetchSectionRevision(reportServiceId!, sectionId!, revision!, signal),
    enabled: queriesEnabled,
    staleTime: 0,
    retry: shouldRetryReportEditingQuery,
  });
}

export function useCreateRewritePreviewMutation() {
  return useMutation({
    mutationKey: reportQueryKeys.rewritePreviewMutation,
    mutationFn: ({
      reportServiceId,
      sectionId,
      input,
      signal,
    }: {
      reportServiceId: string;
      sectionId: string;
      input: CreateRewritePreviewInput;
      signal?: AbortSignal;
    }) => createRewritePreview(reportServiceId, sectionId, input, signal),
    retry: false,
  });
}

export function useSaveEditableDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: reportQueryKeys.saveEditableDocumentMutation,
    mutationFn: ({
      reportServiceId,
      sectionId,
      input,
      signal,
    }: {
      reportServiceId: string;
      sectionId: string;
      input: SaveEditableDocumentInput;
      signal?: AbortSignal;
    }) => saveEditableDocument(reportServiceId, sectionId, input, signal),
    retry: shouldRetrySaveEditableDocument,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        reportQueryKeys.editableDocument(
          variables.reportServiceId,
          variables.sectionId,
        ),
        data,
      );
      queryClient.setQueriesData<ReportSectionResponse>(
        {
          queryKey: [
            ...reportQueryKeys.byReport(variables.reportServiceId),
            "section",
            variables.sectionId,
          ],
        },
        (current) =>
          current
            ? {
                ...current,
                content: toReportSectionContent(data.blocks),
              }
            : current,
      );
      void queryClient.invalidateQueries({
        queryKey: reportQueryKeys.sectionRevisions(
          variables.reportServiceId,
          variables.sectionId,
        ),
      });
    },
    onError: (error, variables) => {
      if (!isEditingErrorCode(error, "inactive_section")) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: reportQueryKeys.status(variables.reportServiceId),
      });
    },
  });
}

export function useRestoreRevisionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: reportQueryKeys.restoreRevisionMutation,
    mutationFn: ({
      reportServiceId,
      sectionId,
      revision,
      input,
      signal,
    }: {
      reportServiceId: string;
      sectionId: string;
      revision: number;
      input: RestoreRevisionInput;
      signal?: AbortSignal;
    }) =>
      restoreSectionRevision(
        reportServiceId,
        sectionId,
        revision,
        input,
        signal,
      ),
    retry: false,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        reportQueryKeys.editableDocument(
          variables.reportServiceId,
          variables.sectionId,
        ),
        data,
      );
      void queryClient.invalidateQueries({
        queryKey: reportQueryKeys.sectionRevisions(
          variables.reportServiceId,
          variables.sectionId,
        ),
      });
    },
  });
}
