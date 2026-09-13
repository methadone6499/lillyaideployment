import assert from "node:assert/strict";

import { getReportSectionDefinition } from "../utils/sectionOrdering";
import {
  buildReportSectionItems,
  canExpandReportSection,
  getSectionAccordionKey,
} from "../utils/buildReportSectionItems";
import type { ReportStatusSection } from "../types";

const customId = "532cc119-a115-4ea8-8145-df44a3174a2a";
const customType = `custom:${customId}` as const;

const diseaseSection: ReportStatusSection = {
  section_type: "disease",
  status: "completed",
  section_id: "sec-disease",
  display_name: "Disease Overview (API)",
};

const clinicalPending: ReportStatusSection = {
  section_type: "clinical",
  status: "pending",
};

const executiveSection: ReportStatusSection = {
  section_type: "executive",
  status: "completed",
  section_id: "sec-exec",
};

const customSection: ReportStatusSection = {
  section_type: customType,
  status: "completed",
  section_id: "sec-custom",
};

assert.equal(
  getSectionAccordionKey(diseaseSection, "disease"),
  "sec-disease",
);
assert.equal(
  getSectionAccordionKey(clinicalPending, "clinical"),
  "clinical",
);

assert.equal(canExpandReportSection(diseaseSection), true);
assert.equal(canExpandReportSection(clinicalPending), false);
assert.equal(
  canExpandReportSection(
    { status: "completed", section_id: undefined },
    false,
  ),
  false,
);
assert.equal(
  canExpandReportSection(
    { status: "completed", section_id: undefined },
    true,
  ),
  true,
);
assert.equal(
  canExpandReportSection(
    { status: "partially_completed", section_id: "sec-partial" },
  ),
  true,
);

const items = buildReportSectionItems(
  [clinicalPending, customSection, executiveSection, diseaseSection],
  ["disease", "clinical", customType, "executive"],
  ["Safety narrative"],
);

assert.equal(items.length, 4);
assert.deepEqual(
  items.map((item) => item.section.section_type),
  ["disease", "clinical", customType, "executive"],
);
assert.deepEqual(
  items.map((item) => item.order),
  [1, 2, 3, 4],
);
assert.equal(items[0]?.title, "Disease Overview (API)");
assert.equal(items[0]?.id, "sec-disease");
assert.equal(items[0]?.accordionKey, "sec-disease");
assert.equal(items[0]?.canExpand, true);
assert.equal(
  items[0]?.description,
  getReportSectionDefinition("disease")?.description,
);

assert.equal(items[1]?.title, getReportSectionDefinition("clinical")?.title);
assert.equal(items[1]?.id, "clinical");
assert.equal(items[1]?.canExpand, false);
assert.equal(items[1]?.status, "pending");

assert.equal(items[2]?.title, "Safety narrative");
assert.equal(items[2]?.description, "");
assert.equal(items[2]?.canExpand, true);

assert.equal(items[3]?.title, getReportSectionDefinition("executive")?.title);

const skippedMissingStatus = buildReportSectionItems(
  [diseaseSection, executiveSection],
  ["disease", "clinical", "executive"],
);
assert.deepEqual(
  skippedMissingStatus.map((item) => item.section.section_type),
  ["disease", "executive"],
);
assert.deepEqual(
  skippedMissingStatus.map((item) => item.order),
  [1, 2],
);

const skippedMissingCustom = buildReportSectionItems(
  [diseaseSection, executiveSection],
  ["disease", customType, "executive"],
  ["Should not apply to executive"],
);
assert.equal(skippedMissingCustom.length, 2);
assert.equal(skippedMissingCustom[1]?.title, "Executive Summary");
assert.notEqual(skippedMissingCustom[1]?.title, "Should not apply to executive");

const definitionFallback = buildReportSectionItems(
  [
    {
      section_type: "drug",
      status: "completed",
      section_id: "sec-drug",
    },
  ],
  ["drug"],
);
assert.equal(definitionFallback[0]?.title, "Drug Details");
assert.equal(
  definitionFallback[0]?.description,
  getReportSectionDefinition("drug")?.description,
);
