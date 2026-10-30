"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatDisplayCount, formatDisplayDateTime } from "@/lib/formatDisplay";
import type { ReviewNoteCycle } from "../utils/reportReviewNotes";

export function SectionReviewNoteHistory({
  cycles,
  variant = "cycles",
}: {
  cycles: readonly ReviewNoteCycle[];
  variant?: "cycles" | "assignments";
}) {
  const [selectedCycle, setSelectedCycle] = useState(cycles[0]?.cycle);
  const selected = cycles.find((cycle) => cycle.cycle === selectedCycle)
    ?? cycles[0];

  if (!selected) {
    return (
      <p className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-body-lg text-text-muted sm:px-6">
        No older reviewer notes for this section.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <nav
        className="max-h-44 shrink-0 overflow-y-auto border-b border-border-default bg-black/15 p-3 md:max-h-none md:w-64 md:border-b-0 md:border-r"
        aria-label={variant === "assignments" ? "Previous assignment notes" : "Previous review cycles"}
      >
        <p className="mb-2 px-2 text-helper font-medium text-text-muted">
          {variant === "assignments" ? "Previous assignment notes" : "Previous review cycles"}
        </p>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-1">
          {cycles.map((cycle) => (
            <button
              key={cycle.cycle}
              type="button"
              aria-pressed={selected.cycle === cycle.cycle}
              onClick={() => setSelectedCycle(cycle.cycle)}
              className={cn(
                "min-h-16 rounded-field border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                selected.cycle === cycle.cycle
                  ? "border-border-default bg-surface-elevated"
                  : "border-transparent hover:bg-surface-default",
              )}
            >
              <span className="block text-input font-medium text-white">
                Cycle {formatDisplayCount(cycle.cycle)}
              </span>
              <span className="mt-1 block text-helper text-text-muted">
                {cycle.completedAt
                  ? formatDisplayDateTime(cycle.completedAt)
                  : variant === "assignments" ? "Previous assignment notes" : "Completed review"}
              </span>
            </button>
          ))}
        </div>
      </nav>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-border-subtle px-5 py-4 sm:px-6">
          <h3 className="text-label font-medium text-white">
            Reviewer notes · Cycle {formatDisplayCount(selected.cycle)}
          </h3>
          {selected.completedAt ? (
            <p className="mt-1 text-helper text-text-muted">
              Completed {formatDisplayDateTime(selected.completedAt)}
            </p>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-6">
            {selected.notes.map((note) => (
              <article key={note.id}>
                <p className="whitespace-pre-wrap break-words text-body-lg leading-report-lg text-text-body">
                  {note.content}
                </p>
                {variant === "assignments" && note.updated_at ? (
                  <p className="mt-2 text-helper text-text-muted">
                    Updated {formatDisplayDateTime(note.updated_at)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
