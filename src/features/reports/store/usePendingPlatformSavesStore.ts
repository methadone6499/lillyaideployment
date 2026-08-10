"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CreateReportInput } from "../schemas/platformReportSchemas";

export type PendingPlatformSaveState = "saving" | "failed";

export type PendingPlatformSave = {
  /** Validated create payload; null when only a validation-failure record exists. */
  input: CreateReportInput | null;
  state: PendingPlatformSaveState;
  requestId: string | null;
  validationDiagnostic: string | null;
};

export type EnqueuePendingValidationFailureParams = {
  userId: string;
  reportServiceId: string;
  /** Best-effort candidate retained for later recovery when available. */
  candidatePayload: CreateReportInput | null;
  validationDiagnostic: string;
};

type PendingPlatformSavesStore = {
  ownerUserId: string | null;
  items: Record<string, PendingPlatformSave>;
  enqueuePendingSave: (userId: string, input: CreateReportInput) => void;
  enqueuePendingValidationFailure: (
    params: EnqueuePendingValidationFailureParams,
  ) => void;
  markPendingSaveFailed: (
    reportServiceId: string,
    requestId: string | null,
  ) => void;
  removePendingSave: (reportServiceId: string) => void;
  clearPendingSaves: () => void;
  setOwnerUserId: (ownerUserId: string | null) => void;
};

function itemsForOwner(
  state: Pick<PendingPlatformSavesStore, "ownerUserId" | "items">,
  userId: string,
): Record<string, PendingPlatformSave> {
  if (state.ownerUserId !== null && state.ownerUserId !== userId) {
    return {};
  }

  return state.items;
}

export const usePendingPlatformSavesStore = create<PendingPlatformSavesStore>()(
  persist(
    (set) => ({
      ownerUserId: null,
      items: {},
      enqueuePendingSave: (userId, input) =>
        set((state) => ({
          ownerUserId: userId,
          items: {
            ...itemsForOwner(state, userId),
            [input.report_service_id]: {
              input,
              state: "saving",
              requestId: null,
              validationDiagnostic: null,
            },
          },
        })),
      enqueuePendingValidationFailure: ({
        userId,
        reportServiceId,
        candidatePayload,
        validationDiagnostic,
      }) =>
        set((state) => ({
          ownerUserId: userId,
          items: {
            ...itemsForOwner(state, userId),
            [reportServiceId]: {
              input: candidatePayload,
              state: "failed",
              requestId: null,
              validationDiagnostic,
            },
          },
        })),
      markPendingSaveFailed: (reportServiceId, requestId) =>
        set((state) => {
          const existing = state.items[reportServiceId];
          if (!existing) {
            return state;
          }

          return {
            items: {
              ...state.items,
              [reportServiceId]: {
                ...existing,
                state: "failed",
                requestId,
              },
            },
          };
        }),
      removePendingSave: (reportServiceId) =>
        set((state) => {
          if (!(reportServiceId in state.items)) {
            return state;
          }

          const rest = { ...state.items };
          delete rest[reportServiceId];
          return { items: rest };
        }),
      clearPendingSaves: () => set({ items: {} }),
      setOwnerUserId: (ownerUserId) => set({ ownerUserId }),
    }),
    {
      name: "pending-platform-saves-storage",
      partialize: (state) => ({
        ownerUserId: state.ownerUserId,
        items: state.items,
      }),
    },
  ),
);

export function enqueuePendingPlatformSave(
  userId: string,
  input: CreateReportInput,
): void {
  usePendingPlatformSavesStore.getState().enqueuePendingSave(userId, input);
}

export function enqueuePendingPlatformSaveValidationFailure(
  params: EnqueuePendingValidationFailureParams,
): void {
  usePendingPlatformSavesStore
    .getState()
    .enqueuePendingValidationFailure(params);
}

export function removePendingPlatformSave(reportServiceId: string): void {
  usePendingPlatformSavesStore.getState().removePendingSave(reportServiceId);
}

export function markPendingPlatformSaveFailed(
  reportServiceId: string,
  requestId: string | null,
): void {
  usePendingPlatformSavesStore
    .getState()
    .markPendingSaveFailed(reportServiceId, requestId);
}
