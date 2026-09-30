"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useConfirmedUserId } from "@/features/auth";
import { platformReportQueryKeys } from "@/features/reports";
import { ApiRequestError } from "@/services/ApiRequestError";

import {
  activateReviewer,
  completeReviewerAssignment,
  createAdminReportComment,
  createReviewerInvitation,
  reassignReviewAssignment,
  registerReviewerInvitation,
  resendReviewerInvitation,
  retryWaitingReviewReport,
  revokeReviewerInvitation,
  saveReviewerAssignmentNote,
  startReviewerAssignment,
  submitReportForReview,
  suspendReviewer,
  updateReviewerAssignmentSettings,
} from "../api/reviewerApi";
import { reviewerQueryKeys } from "../api/reviewerQueryKeys";
import type {
  ReassignReviewRequest,
  ReviewerRegistrationRequest,
  SaveReviewSectionNoteRequest,
  ReviewSectionNoteList,
  UpdateReviewerAssignmentSettingsRequest,
} from "../schemas/reviewerSchemas";

export function useRegisterReviewerMutation() {
  return useMutation({
    mutationKey: [...reviewerQueryKeys.mutations(), "register"] as const,
    mutationFn: (input: ReviewerRegistrationRequest) =>
      registerReviewerInvitation(input),
  });
}

export function useStartReviewerAssignmentMutation(assignmentId: string) {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId() ?? "";
  return useMutation({
    mutationKey: [...reviewerQueryKeys.mutations(), "start", assignmentId] as const,
    mutationFn: () => startReviewerAssignment(assignmentId),
    onSuccess: async (assignment) => {
      queryClient.setQueryData(
        reviewerQueryKeys.assignment(userId, assignmentId),
        assignment,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewerQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: platformReportQueryKeys.root }),
      ]);
    },
  });
}

export function useCompleteReviewerAssignmentMutation(assignmentId: string) {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId() ?? "";
  return useMutation({
    mutationKey: [
      ...reviewerQueryKeys.mutations(),
      "complete",
      assignmentId,
    ] as const,
    mutationFn: () => completeReviewerAssignment(assignmentId),
    onSuccess: async (assignment) => {
      queryClient.setQueryData(
        reviewerQueryKeys.assignment(userId, assignmentId),
        assignment,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewerQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: platformReportQueryKeys.root }),
      ]);
    },
  });
}

export function useSaveReviewerNoteMutation(assignmentId: string) {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId() ?? "";
  return useMutation({
    mutationKey: [
      ...reviewerQueryKeys.mutations(),
      "save-note",
      assignmentId,
    ] as const,
    mutationFn: (input: SaveReviewSectionNoteRequest) =>
      saveReviewerAssignmentNote(assignmentId, input),
    onSuccess: async (savedNote) => {
      const notesKey = reviewerQueryKeys.assignmentNotes(userId, assignmentId);
      queryClient.setQueryData<ReviewSectionNoteList>(notesKey, (current) => {
        if (!current) return { items: [savedNote] };
        const existingIndex = current.items.findIndex(
          (note) => note.id === savedNote.id,
        );
        if (existingIndex < 0) {
          return { items: [...current.items, savedNote] };
        }
        return {
          items: current.items.map((note, index) =>
            index === existingIndex ? savedNote : note,
          ),
        };
      });
      await queryClient.invalidateQueries({
        queryKey: notesKey,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...reviewerQueryKeys.root, "report-history"] }),
        queryClient.invalidateQueries({ queryKey: [...reviewerQueryKeys.root, "report-notes"] }),
      ]);
    },
    onError: async (error) => {
      if (
        error instanceof ApiRequestError &&
        error.code === "review_note_version_conflict"
      ) {
        await queryClient.invalidateQueries({
          queryKey: reviewerQueryKeys.assignmentNotes(userId, assignmentId),
        });
      }
      if (error instanceof ApiRequestError && error.code === "review_notes_not_editable") {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: reviewerQueryKeys.assignment(userId, assignmentId) }),
          queryClient.invalidateQueries({ queryKey: reviewerQueryKeys.assignmentNotes(userId, assignmentId) }),
        ]);
      }
    },
  });
}

export function useSubmitReportForReviewMutation(reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...reviewerQueryKeys.mutations(), "submit-report", reportId] as const,
    mutationFn: () => submitReportForReview(reportId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformReportQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: reviewerQueryKeys.root }),
      ]);
    },
    onError: async (error) => {
      if (
        error instanceof ApiRequestError &&
        [
          "report_locked_for_review",
          "report_submission_conflict",
          "report_not_ready_for_review",
        ].includes(error.code ?? "")
      ) {
        await queryClient.invalidateQueries({
          queryKey: platformReportQueryKeys.root,
        });
      }
    },
  });
}

export function useCreateAdminReportCommentMutation(reportId: string) {
  const queryClient = useQueryClient();
  const userId = useConfirmedUserId() ?? "";
  return useMutation({
    mutationKey: [...reviewerQueryKeys.mutations(), "admin-comment", reportId] as const,
    mutationFn: (content: string) => createAdminReportComment(reportId, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: reviewerQueryKeys.adminComments(userId, reportId),
      });
    },
  });
}

export function useCreateReviewerInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...reviewerQueryKeys.mutations(), "invite"] as const,
    mutationFn: (email: string) => createReviewerInvitation(email),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...reviewerQueryKeys.root, "admin-invitations"],
      });
    },
  });
}

export function useResendReviewerInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...reviewerQueryKeys.mutations(), "resend-invite"] as const,
    mutationFn: (invitationId: string) =>
      resendReviewerInvitation(invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewerQueryKeys.root });
    },
  });
}

export function useRevokeReviewerInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...reviewerQueryKeys.mutations(), "revoke-invite"] as const,
    mutationFn: (invitationId: string) =>
      revokeReviewerInvitation(invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewerQueryKeys.root });
    },
  });
}

export function useSetReviewerStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...reviewerQueryKeys.mutations(), "reviewer-status"] as const,
    mutationFn: (input: { reviewerId: string; active: boolean }) =>
      input.active
        ? activateReviewer(input.reviewerId)
        : suspendReviewer(input.reviewerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewerQueryKeys.root });
    },
  });
}

export function useUpdateReviewerSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...reviewerQueryKeys.mutations(), "settings"] as const,
    mutationFn: (input: UpdateReviewerAssignmentSettingsRequest) =>
      updateReviewerAssignmentSettings(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewerQueryKeys.root });
    },
  });
}

export function useRetryWaitingReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...reviewerQueryKeys.mutations(), "retry-waiting"] as const,
    mutationFn: (reportId: string) => retryWaitingReviewReport(reportId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewerQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: platformReportQueryKeys.root }),
      ]);
    },
  });
}

export function useReassignReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...reviewerQueryKeys.mutations(), "reassign"] as const,
    mutationFn: (input: {
      assignmentId: string;
      request?: ReassignReviewRequest;
    }) => reassignReviewAssignment(input.assignmentId, input.request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewerQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: platformReportQueryKeys.root }),
      ]);
    },
  });
}
