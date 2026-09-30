import type { ReviewHistory } from "../schemas/reviewerSchemas";

const statusLabel: Record<string, string> = {
  awaiting_assignment: "Awaiting assignment",
  pending: "Pending review",
  in_review: "In review",
  reviewed: "Reviewed",
  completed: "Completed",
  superseded: "Superseded",
};

const localDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatLocalDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : localDateTimeFormatter.format(date);
}

export function ReviewHistoryTimeline({ history }: { history: ReviewHistory }) {
  const cycles = [...history.items].sort((a, b) => b.cycle_number - a.cycle_number);
  return (
    <section className="mb-8 rounded-card border border-border-default bg-surface-default p-6" aria-labelledby="review-history-title">
      <h2 id="review-history-title" className="text-card-title font-medium text-white">Review history</h2>
      {cycles.length === 0 ? (
        <p className="mt-4 text-label text-text-muted">This report has not entered review.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {cycles.map((cycle, index) => (
            <details key={cycle.id} open={index === 0} className="rounded-card border border-border-default bg-surface-subtle p-4">
              <summary className="cursor-pointer text-label font-medium text-white">
                Cycle {cycle.cycle_number} · {statusLabel[cycle.status]} · Submitted {formatLocalDateTime(cycle.submitted_at)}
              </summary>
              {cycle.completed_at ? <p className="mt-3 text-helper text-text-muted">Completed {formatLocalDateTime(cycle.completed_at)}</p> : null}
              {cycle.assignments.length === 0 ? (
                <p className="mt-4 text-label text-text-muted">Awaiting a reviewer assignment.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {[...cycle.assignments].sort((a, b) => a.assigned_at.localeCompare(b.assigned_at)).map((assignment) => (
                    <article key={assignment.id} className="rounded-card border border-border-default bg-surface-default p-4">
                      <h3 className="text-label font-medium text-white">
                        Assignment {assignment.id} · {statusLabel[assignment.status]}
                      </h3>
                      <p className="mt-2 text-helper text-text-muted">
                        Assigned {formatLocalDateTime(assignment.assigned_at)} · Due {formatLocalDateTime(assignment.due_at)}
                      </p>
                      {assignment.superseded_at ? <p className="mt-1 text-helper text-text-muted">Reassigned {formatLocalDateTime(assignment.superseded_at)}</p> : null}
                      {assignment.completed_at ? <p className="mt-1 text-helper text-text-muted">Completed {formatLocalDateTime(assignment.completed_at)}</p> : null}
                      {assignment.notes.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          {assignment.notes.map((note) => (
                            <div key={note.id} className="border-l-2 border-brand pl-4">
                              <h4 className="text-label font-medium text-white">
                                {note.section_heading}{note.section_occurrence > 1 ? ` (${note.section_occurrence})` : ""}
                              </h4>
                              <p className="mt-1 whitespace-pre-wrap text-label text-text-body">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
