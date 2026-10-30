import type { ReviewHistory, ReviewSectionNote } from "../schemas/reviewerSchemas";
import {
  getNotesForSection,
  type ReviewNoteSection,
  type SectionReviewNote,
} from "./matchReviewNotes";

export type ReviewNoteCycle = {
  cycle: number;
  completedAt: string | null;
  notes: readonly (SectionReviewNote & { updated_at?: string })[];
};

export function groupAssignmentNoteHistory(
  notes: readonly ReviewSectionNote[],
): ReviewNoteCycle[] {
  const byCycle = new Map<number, ReviewSectionNote[]>();
  for (const note of notes) {
    const cycleNotes = byCycle.get(note.review_cycle) ?? [];
    cycleNotes.push(note);
    byCycle.set(note.review_cycle, cycleNotes);
  }

  // Reassigned reviewers can have previous assignment notes in the same cycle.
  return [...byCycle]
    .sort(([a], [b]) => b - a)
    .map(([cycle, cycleNotes]) => ({
      cycle,
      completedAt: null,
      notes: cycleNotes.sort(
        (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at),
      ),
    }));
}

export function getReportReviewNotes({
  history,
  completedNotes,
  reviewCycle,
  reviewStatus,
  admin,
}: {
  history: ReviewHistory | undefined;
  completedNotes: readonly SectionReviewNote[];
  reviewCycle: number;
  reviewStatus: string;
  admin: boolean;
}) {
  const completedCycles = history?.items.filter(
    (cycle) => cycle.status === "reviewed",
  ) ?? [];
  const historyNotes = completedCycles.flatMap((cycle) =>
    cycle.assignments
      .filter((assignment) =>
        cycle.completed_assignment_id
          ? assignment.id === cycle.completed_assignment_id
          : assignment.status === "completed",
      )
      .flatMap((assignment) =>
        assignment.notes.map((note) => ({
          ...note,
          review_cycle: cycle.cycle_number,
        })),
      ),
  );
  const notes: readonly SectionReviewNote[] = admin
    ? historyNotes
    : [...new Map(
        [...historyNotes, ...completedNotes].map((note) => [note.id, note]),
      ).values()];
  // Use the report-level cycle, including a completed cycle with no notes.
  // A new round can only be submitted after the previous round is completed.
  const reportedCompletedCycle = reviewStatus === "reviewed"
    ? reviewCycle
    : history === undefined && reviewCycle > 1
      ? reviewCycle - 1
      : 0;
  const latestCompletedCycle = Math.max(
    reportedCompletedCycle,
    0,
    ...completedCycles.map((cycle) => cycle.cycle_number),
    ...notes.map((note) => note.review_cycle),
  );

  return { notes, latestCompletedCycle };
}

export function getSectionReviewNotes(
  notes: readonly SectionReviewNote[],
  section: ReviewNoteSection,
  latestCompletedCycle: number,
  history?: ReviewHistory,
) {
  const sectionNotes = getNotesForSection(notes, section);
  const currentNotes = sectionNotes.filter(
    (note) => note.review_cycle === latestCompletedCycle,
  );
  const olderByCycle = new Map<number, SectionReviewNote[]>();

  for (const note of sectionNotes) {
    if (note.review_cycle >= latestCompletedCycle) continue;
    const cycleNotes = olderByCycle.get(note.review_cycle) ?? [];
    cycleNotes.push(note);
    olderByCycle.set(note.review_cycle, cycleNotes);
  }

  const olderCycles: ReviewNoteCycle[] = [...olderByCycle]
    .sort(([a], [b]) => b - a)
    .map(([cycle, cycleNotes]) => ({
      cycle,
      completedAt: history?.items.find(
        (item) => item.cycle_number === cycle && item.status === "reviewed",
      )?.completed_at ?? null,
      notes: cycleNotes,
    }));

  return { currentNotes, olderCycles };
}
