"use client";

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  useConfirmedUserId,
  useIsAuthenticated,
} from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import {
  getAdminReviewDashboard,
  getReportReviewHistory,
  getReviewerAssignment,
  getReviewerAssignmentSettings,
  getReviewerDashboard,
  listAdminReviewAssignmentNotes,
  listAdminReportComments,
  listCompletedReportReviewNotes,
  listReviewerAssignmentNotes,
  listReviewerAssignments,
  listReviewerInvitations,
  listReviewers,
  previewReviewerInvitation,
} from "../api/reviewerApi";
import { reviewerQueryKeys } from "../api/reviewerQueryKeys";
import type {
  AdminReviewDashboardFilters,
  ReviewerDashboardFilters,
  ReviewerFilters,
  ReviewerInvitationFilters,
} from "../schemas/reviewerSchemas";
import { shouldRetryReviewerQuery } from "../utils/shouldRetryReviewerQuery";
import { getReviewerInvitationToken } from "../utils/reviewerInvitationToken";

function isInvalidCursorError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.code === "invalid_cursor"
  );
}

function useReviewerQueryIdentity(enabled = true) {
  const authenticated = useIsAuthenticated();
  const userId = useConfirmedUserId();
  return {
    userId,
    enabled: authenticated && Boolean(userId) && enabled,
  };
}

export function useReviewerInvitationPreview(enabled: boolean) {
  return useQuery({
    queryKey: reviewerQueryKeys.invitationPreview(),
    queryFn: ({ signal }) =>
      previewReviewerInvitation(getReviewerInvitationToken() ?? "", signal),
    enabled,
    retry: shouldRetryReviewerQuery,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useReviewerDashboard(
  params: Omit<ReviewerDashboardFilters, "cursor"> = {},
) {
  const queryClient = useQueryClient();
  const identity = useReviewerQueryIdentity();
  const queryKey = reviewerQueryKeys.dashboard(identity.userId ?? "", params);
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      getReviewerDashboard({ ...params, cursor: pageParam }, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: identity.enabled,
    staleTime: 15_000,
    retry: shouldRetryReviewerQuery,
  });

  const fetchNextPage = async () => {
    const result = await query.fetchNextPage();
    if (result.isError && isInvalidCursorError(result.error)) {
      await queryClient.resetQueries({ queryKey });
    }
    return result;
  };

  return { ...query, fetchNextPage };
}

export function useReviewerAssignments(
  params: Pick<ReviewerDashboardFilters, "status" | "overdue" | "limit"> = {},
  enabled = true,
) {
  const queryClient = useQueryClient();
  const identity = useReviewerQueryIdentity(enabled);
  const queryKey = reviewerQueryKeys.assignmentHistory(identity.userId ?? "", params);
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => listReviewerAssignments({ ...params, cursor: pageParam }, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: identity.enabled,
    staleTime: 15_000,
    retry: shouldRetryReviewerQuery,
  });
  const fetchNextPage = async () => {
    const result = await query.fetchNextPage();
    if (result.isError && isInvalidCursorError(result.error)) {
      await queryClient.resetQueries({ queryKey });
    }
    return result;
  };
  return { ...query, fetchNextPage };
}

export function useReviewerAssignment(assignmentId: string | null | undefined) {
  const identity = useReviewerQueryIdentity(Boolean(assignmentId));
  return useQuery({
    queryKey: reviewerQueryKeys.assignment(
      identity.userId ?? "",
      assignmentId ?? "",
    ),
    queryFn: ({ signal }) => getReviewerAssignment(assignmentId ?? "", signal),
    enabled: identity.enabled,
    staleTime: 10_000,
    retry: shouldRetryReviewerQuery,
  });
}

export function useReviewerAssignmentNotes(
  assignmentId: string | null | undefined,
) {
  const identity = useReviewerQueryIdentity(Boolean(assignmentId));
  return useQuery({
    queryKey: reviewerQueryKeys.assignmentNotes(
      identity.userId ?? "",
      assignmentId ?? "",
    ),
    queryFn: ({ signal }) =>
      listReviewerAssignmentNotes(assignmentId ?? "", signal),
    enabled: identity.enabled,
    staleTime: 10_000,
    retry: shouldRetryReviewerQuery,
  });
}

export function useAdminReviewerInvitations(
  params: Omit<ReviewerInvitationFilters, "cursor"> = {},
  enabled = true,
) {
  const identity = useReviewerQueryIdentity(enabled);
  return useInfiniteQuery({
    queryKey: reviewerQueryKeys.adminInvitations(identity.userId ?? "", params),
    queryFn: ({ pageParam, signal }) =>
      listReviewerInvitations({ ...params, cursor: pageParam }, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: identity.enabled,
    staleTime: 15_000,
    retry: shouldRetryReviewerQuery,
  });
}

export function useAdminReviewers(
  params: Omit<ReviewerFilters, "cursor"> = {},
  enabled = true,
) {
  const identity = useReviewerQueryIdentity(enabled);
  return useInfiniteQuery({
    queryKey: reviewerQueryKeys.adminReviewers(identity.userId ?? "", params),
    queryFn: ({ pageParam, signal }) =>
      listReviewers({ ...params, cursor: pageParam }, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: identity.enabled,
    staleTime: 15_000,
    retry: shouldRetryReviewerQuery,
  });
}

export function useReviewerAssignmentSettings(enabled = true) {
  const identity = useReviewerQueryIdentity(enabled);
  return useQuery({
    queryKey: reviewerQueryKeys.adminSettings(identity.userId ?? ""),
    queryFn: ({ signal }) => getReviewerAssignmentSettings(signal),
    enabled: identity.enabled,
    staleTime: 30_000,
    retry: shouldRetryReviewerQuery,
  });
}

export function useAdminReviewDashboard(
  params: Omit<AdminReviewDashboardFilters, "cursor"> = {},
  enabled = true,
) {
  const queryClient = useQueryClient();
  const identity = useReviewerQueryIdentity(enabled);
  const queryKey = reviewerQueryKeys.adminDashboard(
    identity.userId ?? "",
    params,
  );
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      getAdminReviewDashboard(
        {
          ...params,
          cursor: pageParam,
          includeStats: pageParam ? false : params.includeStats,
        },
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: identity.enabled,
    staleTime: 15_000,
    retry: shouldRetryReviewerQuery,
  });

  const fetchNextPage = async () => {
    const result = await query.fetchNextPage();
    if (result.isError && isInvalidCursorError(result.error)) {
      await queryClient.resetQueries({ queryKey });
    }
    return result;
  };

  return { ...query, fetchNextPage };
}

export function useAdminReviewAssignmentNotes(
  assignmentId: string | null | undefined,
  enabled = true,
) {
  const identity = useReviewerQueryIdentity(Boolean(assignmentId) && enabled);
  return useQuery({
    queryKey: reviewerQueryKeys.assignmentNotes(
      identity.userId ?? "",
      `admin:${assignmentId ?? ""}`,
    ),
    queryFn: ({ signal }) =>
      listAdminReviewAssignmentNotes(assignmentId ?? "", signal),
    enabled: identity.enabled,
    staleTime: 10_000,
    retry: shouldRetryReviewerQuery,
  });
}

export function useCompletedReportReviewNotes(
  reportId: string | null | undefined,
  enabled = true,
) {
  const identity = useReviewerQueryIdentity(Boolean(reportId) && enabled);
  return useQuery({
    queryKey: reviewerQueryKeys.reportNotes(
      identity.userId ?? "",
      reportId ?? "",
    ),
    queryFn: ({ signal }) =>
      listCompletedReportReviewNotes(reportId ?? "", signal),
    enabled: identity.enabled,
    staleTime: 30_000,
    retry: shouldRetryReviewerQuery,
  });
}

export function useReportReviewHistory(
  reportId: string | null | undefined,
  admin = false,
  enabled = true,
) {
  const identity = useReviewerQueryIdentity(Boolean(reportId) && enabled);
  return useQuery({
    queryKey: reviewerQueryKeys.reportHistory(identity.userId ?? "", reportId ?? "", admin),
    queryFn: ({ signal }) => getReportReviewHistory(reportId ?? "", admin, signal),
    enabled: identity.enabled,
    staleTime: 30_000,
    retry: shouldRetryReviewerQuery,
  });
}

export function useAdminReportComments(
  reportId: string | null | undefined,
  enabled = true,
) {
  const identity = useReviewerQueryIdentity(Boolean(reportId) && enabled);
  return useQuery({
    queryKey: reviewerQueryKeys.adminComments(identity.userId ?? "", reportId ?? ""),
    queryFn: ({ signal }) => listAdminReportComments(reportId ?? "", signal),
    enabled: identity.enabled,
    staleTime: 10_000,
    retry: shouldRetryReviewerQuery,
  });
}
