import type { SectionReviewNote } from "../utils/matchReviewNotes";

type CompletedReviewNotesProps = {
  notes: readonly SectionReviewNote[];
  title?: string;
  showSectionHeadings?: boolean;
};

export function CompletedReviewNotes({
  notes,
  title = "Reviewer notes",
  showSectionHeadings = false,
}: CompletedReviewNotesProps) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 border-t border-border-default pt-6" aria-label={title}>
      <h3 className="text-card-title font-medium text-white">{title}</h3>
      <div className="mt-4 flex flex-col gap-4">
        {notes.map((note) => (
          <article
            key={note.id}
            className="rounded-card border border-border-default bg-surface-default p-5"
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
              className={`whitespace-pre-wrap text-body-lg leading-report text-text-body ${showSectionHeadings ? "mt-3" : ""}`}
            >
              {note.content}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
