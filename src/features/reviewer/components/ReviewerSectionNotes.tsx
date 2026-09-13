"use client";

import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useId } from "react";
import {
  EMPTY_REVIEWER_NOTE,
  getReviewerNoteKey,
  isReviewerNoteDirty,
  useReviewerSessionStore,
} from "../store/useReviewerSessionStore";

type ReviewerSectionNotesProps = {
  platformReportId: string;
  sectionId: string;
  sectionTitle: string;
};

export function ReviewerSectionNotes({
  platformReportId,
  sectionId,
  sectionTitle,
}: ReviewerSectionNotesProps) {
  const textareaId = useId();
  const noteKey = getReviewerNoteKey(platformReportId, sectionId);
  const note = useReviewerSessionStore(
    (state) => state.notesByKey[noteKey] ?? EMPTY_REVIEWER_NOTE,
  );
  const setDraft = useReviewerSessionStore((state) => state.setDraft);
  const saveNote = useReviewerSessionStore((state) => state.saveNote);
  const isDirty = isReviewerNoteDirty(note);
  const showSavedFeedback = note.hasSaved && !isDirty;

  return (
    <div className="mt-8 border-t border-border-default pt-8">
      <label
        htmlFor={textareaId}
        className="text-label font-medium text-white"
      >
        Reviewer Notes
        <span className="sr-only">{` for ${sectionTitle}`}</span>
      </label>
      <textarea
        id={textareaId}
        value={note.draftText}
        onChange={(event) =>
          setDraft(platformReportId, sectionId, event.target.value)
        }
        placeholder="Write your notes here..."
        className="mt-3.5 h-[200px] w-full resize-y rounded-card border border-border-default bg-landing-surface-input px-4 py-4 text-body-lg leading-[26px] text-text-body outline-none placeholder:text-text-body focus:border-brand/60 sm:px-[23px] sm:py-[23px]"
      />
      <div className="mt-6 flex flex-wrap items-center justify-end gap-4">
        <p
          className={cn(
            "text-helper text-brand",
            !showSavedFeedback && "sr-only",
          )}
          role="status"
          aria-live="polite"
        >
          {showSavedFeedback ? "Notes saved for this session." : ""}
        </p>
        <Button
          type="button"
          disabled={!isDirty}
          onClick={() => saveNote(platformReportId, sectionId)}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
