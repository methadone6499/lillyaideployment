import assert from "node:assert/strict";

import {
  emptyFixtureReviewerDataSource,
  fixtureReviewerDataSource,
  REVIEWER_KPI_IDS,
  REVIEWER_STATUS_FILTER_OPTIONS,
} from "../index";

const FIGMA_VISIBLE_REPORTS = [
  {
    name: "Panadol - Mild Fever",
    assignedDate: "12 Aug, 2025",
    deadline: "19 Aug, 2025",
    status: "completed",
  },
  {
    name: "Metformin - Diabetes",
    assignedDate: "11 Aug, 2025",
    deadline: "18 Aug, 2025",
    status: "completed",
  },
  {
    name: "Dupilumab - Atopic Dermatitis",
    assignedDate: "10 Aug, 2025",
    deadline: "17 Aug, 2025",
    status: "in_review",
  },
  {
    name: "Semaglutide - Obesity",
    assignedDate: "09 Aug, 2025",
    deadline: "16 Aug, 2025",
    status: "completed",
  },
  {
    name: "Tirzepatide - Type 2 Diabetes",
    assignedDate: "08 Aug, 2025",
    deadline: "15 Aug, 2025",
    status: "overdue",
  },
  {
    name: "Adalimumab - Rheumatoid Arthritis",
    assignedDate: "07 Aug, 2025",
    deadline: "14 Aug, 2025",
    status: "overdue",
  },
] as const;

const dashboard = await fixtureReviewerDataSource.getDashboard();
const emptyDashboard = await emptyFixtureReviewerDataSource.getDashboard();

assert.deepEqual(
  dashboard.kpis.map((kpi) => kpi.id),
  [...REVIEWER_KPI_IDS],
);
assert.equal(dashboard.kpis.length, 5);
assert.equal(dashboard.reports.length, 12);
assert.equal(
  new Set(dashboard.reports.map((report) => report.platformReportId)).size,
  dashboard.reports.length,
);

const kpiById = Object.fromEntries(
  dashboard.kpis.map((kpi) => [kpi.id, kpi]),
);
assert.equal(kpiById.total_assigned?.label, "Total Assigned Reports");
assert.equal(kpiById.total_assigned?.value, 12);
assert.equal(kpiById.in_queue?.label, "Reports in Queue");
assert.equal(kpiById.in_queue?.value, 3);
assert.equal(kpiById.in_review?.label, "In Review");
assert.equal(kpiById.in_review?.value, 2);
assert.equal(kpiById.overdue?.label, "Overdue Reviews");
assert.equal(kpiById.overdue?.value, 2);
assert.equal(kpiById.completed?.label, "Completed Reviews");
assert.equal(kpiById.completed?.value, 5);

for (const [index, expected] of FIGMA_VISIBLE_REPORTS.entries()) {
  const report = dashboard.reports[index];
  assert.ok(report);
  assert.equal(report.name, expected.name);
  assert.equal(report.assignedDate, expected.assignedDate);
  assert.equal(report.deadline, expected.deadline);
  assert.equal(report.status, expected.status);
}

assert.deepEqual(
  dashboard.reports.map((report) => report.status).sort(),
  [
    "completed",
    "completed",
    "completed",
    "completed",
    "completed",
    "in_queue",
    "in_queue",
    "in_queue",
    "in_review",
    "in_review",
    "overdue",
    "overdue",
  ],
);

assert.deepEqual(
  dashboard.notifications.map((notification) => ({
    message: notification.message,
    timestamp: notification.timestamp,
  })),
  [
    {
      message: "New report Panadol - Mild Fever is assigned",
      timestamp: "24 mins ago",
    },
    {
      message: "Metformin - Diabetes review is overdue",
      timestamp: "1 hour ago",
    },
    {
      message: "Dupilumab - Atopic Dermatitis review submitted",
      timestamp: "2 hour ago",
    },
  ],
);

assert.deepEqual(
  REVIEWER_STATUS_FILTER_OPTIONS.map((option) => option.value),
  ["all", "completed", "in_review", "overdue", "in_queue"],
);

const panadol = dashboard.reports[0];
assert.ok(panadol);
const panadolDetail = await fixtureReviewerDataSource.getReport(
  panadol.platformReportId,
);
assert.ok(panadolDetail);
assert.equal(panadolDetail.title, "Panadol - Mild Fever");
assert.equal(
  panadolDetail.generatedOnLabel,
  "Evidence Report - Generated on Friday, May 22, 2026, 04:27 PM PKT",
);
assert.equal(panadolDetail.sections.length, 7);
assert.deepEqual(
  panadolDetail.sections.map((section) => ({
    id: section.id,
    order: section.order,
    title: section.title,
  })),
  [
    { id: "disease", order: 1, title: "Disease Overview" },
    { id: "drug", order: 2, title: "Drug Details" },
    { id: "clinical", order: 3, title: "Clinical Evidence" },
    { id: "economic", order: 4, title: "Economic Evidence" },
    { id: "comparator", order: 5, title: "Competitor Analysis" },
    { id: "hta", order: 6, title: "HTA Summary" },
    { id: "executive", order: 7, title: "Executive Summary" },
  ],
);
assert.equal(
  panadolDetail.sections[0]?.description,
  "Definition, epidemiology, burden, ICD-11 mapping",
);

const diseaseDefinition = panadolDetail.sections[0]?.blocks.find(
  (block) => block.type === "definition",
);
assert.equal(diseaseDefinition?.type, "definition");
assert.equal(
  diseaseDefinition?.type === "definition" ? diseaseDefinition.label : null,
  "Indication",
);
assert.equal(
  diseaseDefinition?.type === "definition" ? diseaseDefinition.value : null,
  "1A00: Fever",
);

for (const report of dashboard.reports) {
  const detail = await fixtureReviewerDataSource.getReport(
    report.platformReportId,
  );
  assert.ok(detail);
  assert.equal(detail.platformReportId, report.platformReportId);
  assert.equal(detail.status, report.status);
  assert.equal(detail.sections.length, 7);
  assert.equal(
    new Set(detail.sections.map((section) => section.id)).size,
    7,
  );
}

const unknownReport = await fixtureReviewerDataSource.getReport(
  "unknown-report",
);
assert.equal(unknownReport, null);

assert.deepEqual(
  emptyDashboard.kpis.map((kpi) => kpi.value),
  [0, 0, 0, 0, 0],
);
assert.deepEqual(emptyDashboard.reports, []);
assert.deepEqual(emptyDashboard.notifications, []);
assert.equal(
  await emptyFixtureReviewerDataSource.getReport(panadol.platformReportId),
  null,
);
