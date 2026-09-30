export type SectionReviewNote = {
  id: string;
  section_id: string | null;
  section_heading: string;
  section_occurrence: number;
  content: string;
  review_cycle: number;
};

export type ReviewNoteSection = {
  sectionId?: string | null;
  title: string;
  headingOccurrence: number;
};

function normalizeHeading(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function matchesSection(
  note: SectionReviewNote,
  section: ReviewNoteSection,
): boolean {
  if (note.section_id && section.sectionId) {
    return note.section_id === section.sectionId;
  }
  if (note.section_id && !section.sectionId) return false;
  return (
    normalizeHeading(note.section_heading) === normalizeHeading(section.title) &&
    note.section_occurrence === section.headingOccurrence
  );
}

export function getNotesForSection(
  notes: readonly SectionReviewNote[],
  section: ReviewNoteSection,
): SectionReviewNote[] {
  return notes.filter((note) => matchesSection(note, section));
}

export function getUnmatchedNotes(
  notes: readonly SectionReviewNote[],
  sections: readonly ReviewNoteSection[],
): SectionReviewNote[] {
  return notes.filter(
    (note) => !sections.some((section) => matchesSection(note, section)),
  );
}
