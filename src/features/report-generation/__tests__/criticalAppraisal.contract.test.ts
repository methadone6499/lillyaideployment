import assert from "node:assert/strict";

import {
  ALL_WIZARD_SECTION_IDS,
  DEFAULT_SECTION_IDS,
  REPORT_SECTION_DEFINITIONS,
} from "../constants/reportSections";
import {
  builtInSectionTypeSchema,
  generateReportSectionSchema,
  reportSelectionsSchema,
  reportStatusSectionSchema,
  sectionTypeSchema,
} from "../schemas/reportSchemas";
import {
  applyCriticalAppraisalSelectionRule,
  buildApiSectionTypes,
  filterApiSectionIds,
  getDefaultSelectedSectionIds,
  getReportSectionDefinition,
  getToggleableSectionIds,
  getWizardSectionOrder,
  isSectionAvailable,
  mergeViewerSectionIds,
  migrateWizardSelectedSectionIdsToV12,
  reconcileSelectedSectionIdsWithInputs,
  syncSelectedSectionIdsOnInputChange,
  type SectionSelectionInputs,
} from "../utils/sectionOrdering";

const emptyInputs: SectionSelectionInputs = {
  selectedClinicalArticleIds: [],
  selectedEconomicArticleIds: [],
  selectedComparators: [],
};

const clinicalInputs: SectionSelectionInputs = {
  selectedClinicalArticleIds: ["PMC1"],
  selectedEconomicArticleIds: [],
  selectedComparators: [],
};

const economicInputs: SectionSelectionInputs = {
  selectedClinicalArticleIds: [],
  selectedEconomicArticleIds: ["PMC2"],
  selectedComparators: [],
};

const bothEvidenceInputs: SectionSelectionInputs = {
  selectedClinicalArticleIds: ["PMC1"],
  selectedEconomicArticleIds: ["PMC2"],
  selectedComparators: [],
};

assert.equal(
  builtInSectionTypeSchema.parse("critical_appraisal"),
  "critical_appraisal",
);
assert.equal(sectionTypeSchema.parse("critical_appraisal"), "critical_appraisal");
assert.equal(builtInSectionTypeSchema.safeParse("critical-appraisal").success, false);

const parsedSelections = reportSelectionsSchema.parse({
  comparators: [],
  clinical_pmcids: ["PMC1"],
  economic_pmcids: [],
  section_types: ["disease", "clinical", "critical_appraisal", "executive"],
});
assert.deepEqual(parsedSelections.section_types, [
  "disease",
  "clinical",
  "critical_appraisal",
  "executive",
]);

assert.equal(
  generateReportSectionSchema.parse({
    section_id: "section-ca",
    section_type: "critical_appraisal",
    display_name: "Critical Appraisal",
    status: "completed",
  }).section_type,
  "critical_appraisal",
);

assert.equal(
  reportStatusSectionSchema.parse({
    section_type: "critical_appraisal",
    status: "pending",
  }).section_type,
  "critical_appraisal",
);

const order = getWizardSectionOrder();
assert.deepEqual([...order], ALL_WIZARD_SECTION_IDS);
assert.ok(order.indexOf("economic") >= 0);
assert.equal(order[order.indexOf("economic") + 1], "critical_appraisal");
assert.equal(
  order[order.indexOf("critical_appraisal") + 1],
  "comparator",
);

const criticalAppraisalDefinition = getReportSectionDefinition(
  "critical_appraisal",
);
assert.equal(criticalAppraisalDefinition?.title, "Critical Appraisal");
assert.equal(
  REPORT_SECTION_DEFINITIONS.find((section) => section.id === "critical_appraisal")
    ?.title,
  "Critical Appraisal",
);
assert.ok(DEFAULT_SECTION_IDS.includes("critical_appraisal"));
assert.ok(!DEFAULT_SECTION_IDS.includes("environmental"));
assert.ok(!DEFAULT_SECTION_IDS.includes("compliance"));
assert.equal(
  DEFAULT_SECTION_IDS[DEFAULT_SECTION_IDS.indexOf("economic") + 1],
  "critical_appraisal",
);

assert.equal(isSectionAvailable("critical_appraisal", emptyInputs), false);
assert.equal(isSectionAvailable("critical_appraisal", clinicalInputs), true);
assert.equal(isSectionAvailable("critical_appraisal", economicInputs), true);
assert.equal(
  isSectionAvailable("critical_appraisal", bothEvidenceInputs, [
    "disease",
    "clinical",
  ]),
  true,
);
assert.equal(
  isSectionAvailable("critical_appraisal", bothEvidenceInputs, ["disease"]),
  false,
);

assert.ok(
  getToggleableSectionIds(clinicalInputs).includes("critical_appraisal"),
);
assert.ok(
  !getToggleableSectionIds(emptyInputs).includes("critical_appraisal"),
);

assert.ok(
  !getDefaultSelectedSectionIds(emptyInputs).includes("critical_appraisal"),
);
assert.ok(
  getDefaultSelectedSectionIds(clinicalInputs).includes("critical_appraisal"),
);
assert.ok(
  getDefaultSelectedSectionIds(economicInputs).includes("critical_appraisal"),
);
assert.ok(
  getDefaultSelectedSectionIds(bothEvidenceInputs).includes(
    "critical_appraisal",
  ),
);

const defaultWithClinical = getDefaultSelectedSectionIds(clinicalInputs);
assert.ok(defaultWithClinical.includes("clinical"));
assert.equal(
  defaultWithClinical.indexOf("critical_appraisal") >
    defaultWithClinical.indexOf("clinical"),
  true,
);

const afterClearingEvidence = syncSelectedSectionIdsOnInputChange(
  ["disease", "clinical", "critical_appraisal", "executive"],
  emptyInputs,
);
assert.deepEqual(afterClearingEvidence, ["disease", "executive"]);

const afterClearingOnlyClinical = syncSelectedSectionIdsOnInputChange(
  ["disease", "clinical", "economic", "critical_appraisal", "executive"],
  economicInputs,
);
assert.ok(afterClearingOnlyClinical.includes("economic"));
assert.ok(afterClearingOnlyClinical.includes("critical_appraisal"));
assert.ok(!afterClearingOnlyClinical.includes("clinical"));

const step5Entry = reconcileSelectedSectionIdsWithInputs(
  ["disease", "executive"],
  clinicalInputs,
);
assert.ok(step5Entry.includes("clinical"));
assert.ok(step5Entry.includes("critical_appraisal"));

const userOptedOut = reconcileSelectedSectionIdsWithInputs(
  ["disease", "clinical", "executive"],
  clinicalInputs,
);
assert.ok(userOptedOut.includes("clinical"));
assert.ok(!userOptedOut.includes("critical_appraisal"));

const bothDepsGone = reconcileSelectedSectionIdsWithInputs(
  ["disease", "clinical", "critical_appraisal", "executive"],
  emptyInputs,
);
assert.deepEqual(bothDepsGone, ["disease", "executive"]);

assert.deepEqual(
  applyCriticalAppraisalSelectionRule(
    ["disease", "clinical", "critical_appraisal"],
    ["disease"],
  ),
  ["disease"],
);
assert.deepEqual(
  applyCriticalAppraisalSelectionRule(["disease"], ["disease", "clinical"]),
  ["disease", "clinical", "critical_appraisal"],
);
assert.deepEqual(
  applyCriticalAppraisalSelectionRule(
    ["disease", "clinical", "critical_appraisal"],
    ["disease", "clinical"],
  ),
  ["disease", "clinical"],
);

assert.deepEqual(
  filterApiSectionIds(["disease", "critical_appraisal", "executive"]),
  ["disease", "executive"],
);
assert.deepEqual(
  filterApiSectionIds([
    "disease",
    "clinical",
    "critical_appraisal",
    "executive",
  ]),
  ["disease", "clinical", "critical_appraisal", "executive"],
);

const customId = "532cc119-a115-4ea8-8145-df44a3174a2a";
assert.deepEqual(
  buildApiSectionTypes(
    ["disease", "clinical", "critical_appraisal", "executive"],
    [{ customId, enabled: true }],
  ),
  [
    "disease",
    "clinical",
    "critical_appraisal",
    `custom:${customId}`,
    "executive",
  ],
);
assert.deepEqual(
  buildApiSectionTypes(
    ["disease", "critical_appraisal", "executive"],
    [{ customId, enabled: true }],
  ),
  ["disease", `custom:${customId}`, "executive"],
);

assert.deepEqual(
  mergeViewerSectionIds(
    ["disease", "clinical", "critical_appraisal", "executive"],
    [
      { section_type: "clinical", sort_order: 1 },
      { section_type: "critical_appraisal", sort_order: 2 },
    ],
  ),
  ["disease", "clinical", "critical_appraisal", "executive"],
);

assert.deepEqual(
  migrateWizardSelectedSectionIdsToV12([
    "executive",
    "clinical",
    "disease",
    "unknown-section",
  ]),
  ["disease", "clinical", "critical_appraisal", "executive"],
);
assert.deepEqual(
  migrateWizardSelectedSectionIdsToV12(["disease", "economic", "hta"]),
  ["disease", "economic", "critical_appraisal", "hta"],
);
assert.deepEqual(migrateWizardSelectedSectionIdsToV12(["disease", "drug"]), [
  "disease",
  "drug",
]);
assert.deepEqual(
  migrateWizardSelectedSectionIdsToV12([
    "disease",
    "critical_appraisal",
    "executive",
  ]),
  ["disease", "executive"],
);
assert.deepEqual(
  migrateWizardSelectedSectionIdsToV12(["clinical-evidence", "disease-overview"]),
  ["disease", "clinical", "critical_appraisal"],
);
