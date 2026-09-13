"use client";

import { create } from "zustand";
import type { ReviewerSubmission } from "../types";

export type ReviewerSessionNote = {
  draftText: string;
  savedText: string;
  hasSaved: boolean;
};

type ReviewerSessionState = {
  notesByKey: Record<string, ReviewerSessionNote>;
  submissionsByReportId: Record<string, ReviewerSubmission>;
  setDraft: (
    platformReportId: string,
    sectionId: string,
    draftText: string,
  ) => void;
  saveNote: (platformReportId: string, sectionId: string) => void;
  discardDrafts: (platformReportId: string) => void;
  submitReview: (platformReportId: string) => void;
};

export const EMPTY_REVIEWER_NOTE: ReviewerSessionNote = {
  draftText: "",
  savedText: "",
  hasSaved: false,
};

export function getReviewerNoteKey(
  platformReportId: string,
  sectionId: string,
): string {
  return `${platformReportId}::${sectionId}`;
}

export function isReviewerNoteDirty(note: ReviewerSessionNote): boolean {
  return note.draftText !== note.savedText;
}

export function reportHasDirtyNotes(
  notesByKey: Record<string, ReviewerSessionNote>,
  platformReportId: string,
): boolean {
  const prefix = `${platformReportId}::`;

  return Object.entries(notesByKey).some(
    ([key, note]) => key.startsWith(prefix) && isReviewerNoteDirty(note),
  );
}

export const useReviewerSessionStore = create<ReviewerSessionState>()(
  (set, get) => ({
    notesByKey: {},
    submissionsByReportId: {},
    setDraft: (platformReportId, sectionId, draftText) => {
      const key = getReviewerNoteKey(platformReportId, sectionId);
      const existing = get().notesByKey[key] ?? EMPTY_REVIEWER_NOTE;

      if (existing.draftText === draftText) {
        return;
      }

      set({
        notesByKey: {
          ...get().notesByKey,
          [key]: {
            ...existing,
            draftText,
          },
        },
      });
    },
    saveNote: (platformReportId, sectionId) => {
      const key = getReviewerNoteKey(platformReportId, sectionId);
      const existing = get().notesByKey[key] ?? EMPTY_REVIEWER_NOTE;

      set({
        notesByKey: {
          ...get().notesByKey,
          [key]: {
            draftText: existing.draftText,
            savedText: existing.draftText,
            hasSaved: true,
          },
        },
      });
    },
    discardDrafts: (platformReportId) => {
      const prefix = `${platformReportId}::`;
      const notesByKey = { ...get().notesByKey };
      let changed = false;

      for (const [key, note] of Object.entries(notesByKey)) {
        if (!key.startsWith(prefix) || !isReviewerNoteDirty(note)) {
          continue;
        }

        notesByKey[key] = {
          ...note,
          draftText: note.savedText,
        };
        changed = true;
      }

      if (changed) {
        set({ notesByKey });
      }
    },
    submitReview: (platformReportId) => {
      const existing = get().submissionsByReportId[platformReportId];
      if (existing) {
        return;
      }

      set({
        submissionsByReportId: {
          ...get().submissionsByReportId,
          [platformReportId]: {
            platformReportId,
            submittedAt: new Date().toISOString(),
          },
        },
      });
    },
  }),
);
