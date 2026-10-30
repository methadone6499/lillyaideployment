import { HistoryIcon } from "@/components/ui";
import { formatDisplayCount } from "@/lib/formatDisplay";
import type { SectionReviewNote } from "../utils/matchReviewNotes";

type CompletedReviewNotesProps = {
  notes: readonly SectionReviewNote[];
  title?: string;
  showSectionHeadings?: boolean;
  olderCycleCount?: number;
  onOpenHistory?: () => void;
};

export function CompletedReviewNotes({
  notes,
  title = "Reviewer notes",
  showSectionHeadings = false,
  olderCycleCount = 0,
  onOpenHistory,
}: CompletedReviewNotesProps) {
  const hasHistory = olderCycleCount > 0 && onOpenHistory !== undefined;
  if (notes.length === 0 && !hasHistory) {
    return null;
  }

  return (
    <section className="mt-8 border-t border-border-default pt-6" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-card-title font-medium text-white">{title}</h3>
        {hasHistory ? (
          <button
            type="button"
            onClick={onOpenHistory}
            aria-haspopup="dialog"
            className="inline-flex items-center gap-2 rounded-field py-2 text-helper text-text-muted underline underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <HistoryIcon className="size-4" />
            Older reviewer notes ({formatDisplayCount(olderCycleCount)})
          </button>
        ) : null}
      </div>
      {notes.length === 0 ? (
        <p className="mt-4 text-label text-text-muted">
          No reviewer notes for this section in the latest completed review.
        </p>
      ) : null}
      <div className="mt-4 flex flex-col gap-4">
        {notes.map((note) => (
          <article
            key={note.id}
            className="rounded-surface border border-border-default bg-surface-default p-5"
          >
            {showSectionHeadings ? (
              <h4 className="text-label font-medium text-white">
                {note.section_heading}
                {note.section_occurrence > 1
                  ? ` (${note.section_occurrence})`
                  : ""}
              </h4>
            ) : null}
            <p className="mt-2 text-helper text-text-muted">Review cycle {note.review_cycle}</p>
            <p
              className={`whitespace-pre-wrap break-words text-body-lg leading-report text-text-body ${showSectionHeadings ? "mt-3" : ""}`}
            >
              {note.content}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
