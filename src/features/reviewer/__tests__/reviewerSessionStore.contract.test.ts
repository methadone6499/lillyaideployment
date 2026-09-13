import assert from "node:assert/strict";

import { toReviewerSectionPresentationItems } from "../utils/mapReviewerReportContent.ts";
import {
  EMPTY_REVIEWER_NOTE,
  getReviewerNoteKey,
  isReviewerNoteDirty,
  reportHasDirtyNotes,
  useReviewerSessionStore,
} from "../store/useReviewerSessionStore.ts";
import type { ReviewerReportSection } from "../types/index.ts";

function resetSession() {
  useReviewerSessionStore.setState({
    notesByKey: {},
    submissionsByReportId: {},
  });
}

resetSession();

assert.equal(getReviewerNoteKey("rpt-a", "disease"), "rpt-a::disease");
assert.equal(isReviewerNoteDirty(EMPTY_REVIEWER_NOTE), false);
assert.equal(
  isReviewerNoteDirty({
    draftText: "Need dosing check",
    savedText: "",
    hasSaved: false,
  }),
  true,
);

const { setDraft, saveNote, discardDrafts, submitReview } =
  useReviewerSessionStore.getState();

setDraft("rpt-a", "disease", "Check indication coding.");
setDraft("rpt-a", "drug", "Confirm hepatic limits.");
setDraft("rpt-b", "disease", "Other report draft.");

let state = useReviewerSessionStore.getState();
assert.equal(
  state.notesByKey[getReviewerNoteKey("rpt-a", "disease")]?.draftText,
  "Check indication coding.",
);
assert.equal(
  state.notesByKey[getReviewerNoteKey("rpt-a", "drug")]?.draftText,
  "Confirm hepatic limits.",
);
assert.equal(reportHasDirtyNotes(state.notesByKey, "rpt-a"), true);
assert.equal(reportHasDirtyNotes(state.notesByKey, "rpt-b"), true);

saveNote("rpt-a", "disease");
state = useReviewerSessionStore.getState();
const savedDisease =
  state.notesByKey[getReviewerNoteKey("rpt-a", "disease")];
assert.ok(savedDisease);
assert.equal(savedDisease.draftText, "Check indication coding.");
assert.equal(savedDisease.savedText, "Check indication coding.");
assert.equal(savedDisease.hasSaved, true);
assert.equal(isReviewerNoteDirty(savedDisease), false);
assert.equal(reportHasDirtyNotes(state.notesByKey, "rpt-a"), true);

saveNote("rpt-a", "drug");
assert.equal(
  reportHasDirtyNotes(useReviewerSessionStore.getState().notesByKey, "rpt-a"),
  false,
);

setDraft("rpt-a", "disease", "");
saveNote("rpt-a", "disease");
state = useReviewerSessionStore.getState();
const emptySaved = state.notesByKey[getReviewerNoteKey("rpt-a", "disease")];
assert.ok(emptySaved);
assert.equal(emptySaved.draftText, "");
assert.equal(emptySaved.savedText, "");
assert.equal(emptySaved.hasSaved, true);

setDraft("rpt-a", "clinical", "Unsaved accordion-safe draft.");
assert.equal(
  useReviewerSessionStore.getState().notesByKey[
    getReviewerNoteKey("rpt-a", "drug")
  ]?.savedText,
  "Confirm hepatic limits.",
);

submitReview("rpt-a");
state = useReviewerSessionStore.getState();
const firstSubmission = state.submissionsByReportId["rpt-a"];
assert.ok(firstSubmission);
assert.equal(firstSubmission.platformReportId, "rpt-a");
assert.ok(firstSubmission.submittedAt);
assert.equal(
  state.notesByKey[getReviewerNoteKey("rpt-a", "clinical")]?.draftText,
  "Unsaved accordion-safe draft.",
);
assert.equal(
  state.notesByKey[getReviewerNoteKey("rpt-a", "drug")]?.savedText,
  "Confirm hepatic limits.",
);

submitReview("rpt-a");
assert.equal(
  useReviewerSessionStore.getState().submissionsByReportId["rpt-a"]
    ?.submittedAt,
  firstSubmission.submittedAt,
);

discardDrafts("rpt-a");
state = useReviewerSessionStore.getState();
assert.equal(
  state.notesByKey[getReviewerNoteKey("rpt-a", "clinical")]?.draftText,
  "",
);
assert.equal(reportHasDirtyNotes(state.notesByKey, "rpt-a"), false);
assert.equal(
  state.notesByKey[getReviewerNoteKey("rpt-b", "disease")]?.draftText,
  "Other report draft.",
);

const fixtureSections: readonly ReviewerReportSection[] = [
  {
    id: "disease",
    order: 1,
    title: "Disease Overview",
    description: "Definition, epidemiology, burden, ICD-11 mapping",
    blocks: [
      { type: "definition", label: "Indication", value: "1A00: Fever" },
      { type: "heading", text: "What is Fever?" },
      { type: "paragraph", text: "Fever is a temporary increase in body temperature." },
      {
        type: "subsection",
        heading: "Epidemiology",
        body: "FMF is particularly common in Mediterranean populations.",
      },
    ],
  },
];

const items = toReviewerSectionPresentationItems(fixtureSections);
assert.equal(items[0]?.id, "disease");
assert.equal(items[0]?.order, 1);
assert.deepEqual(items[0]?.content?.blocks, [
  { type: "definition", label: "Indication", value: "1A00: Fever" },
  { type: "heading", level: 2, text: "What is Fever?" },
  {
    type: "paragraph",
    text: "Fever is a temporary increase in body temperature.",
  },
  {
    type: "section",
    heading: "Epidemiology",
    level: 3,
    blocks: [
      {
        type: "paragraph",
        text: "FMF is particularly common in Mediterranean populations.",
      },
    ],
  },
]);

resetSession();
