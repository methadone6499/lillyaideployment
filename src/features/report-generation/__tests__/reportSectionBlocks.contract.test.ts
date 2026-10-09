import assert from "node:assert/strict";

import { editableDocumentResponseSchema } from "../schemas/editingSchemas";
import { reportSectionResponseSchema } from "../schemas/reportSchemas";
import { toReportSectionContent } from "../utils/reportBlockEditing";

const parsed = reportSectionResponseSchema.parse({
  section_id: "economic-section-1",
  section_type: "economic",
  display_name: "Economic Evidence",
  status: "completed",
  content: {
    raw: {},
    blocks: [
      {
        type: "chart",
        chart_type: "doughnut",
        title: "Per-patient cost components",
        categories: ["Drug acquisition", "Administration"],
        series: [{ name: "Cost", values: [240.9, 3] }],
        currency: "USD",
      },
      {
        type: "table",
        columns: ["Category", "Cost"],
        rows: [
          ["Drug acquisition", 240.9],
          ["Administration", 3],
        ],
      },
      {
        type: "chart",
        chart_type: "bar",
        title: "Baseline versus scenario spend",
        categories: ["Year 1", "Year 2", "Year 3"],
        series: [
          { name: "Baseline", values: [29200, 30668.25, 32224.84] },
          { name: "Scenario", values: [27108.04, 25180.16, 23005.96] },
        ],
        currency: "USD",
      },
      {
        type: "chart",
        chart_type: "line",
        title: "Scenario comparison",
        categories: ["Year 1", "Year 2", "Year 3"],
        series: [
          { name: "Conservative", values: [-1207.92, -3181.49, -5345.61] },
          { name: "Base", values: [-2091.96, -5488.09, -9218.88] },
          { name: "Optimistic", values: [-3009.07, -7880.65, -13236.47] },
        ],
        currency: "USD",
      },
      {
        type: "chart",
        chart_type: "tornado",
        title: "One-way sensitivity",
        categories: ["Uptake", "Prevalence"],
        series: [
          { name: "Low", values: [-11746.19, -12603.39] },
          { name: "High", values: [-21833.25, -20994.47] },
        ],
        currency: "USD",
      },
    ],
  },
});

assert.equal(parsed.content?.blocks.length, 5);
assert.equal(parsed.content?.blocks[0]?.type, "chart");
assert.equal(parsed.content?.blocks[1]?.type, "table");

const numericTable = parsed.content?.blocks[1];
assert.equal(numericTable?.type, "table");
if (numericTable?.type === "table") {
  assert.equal(numericTable.rows[0]?.[1], 240.9);
  assert.equal(numericTable.rows[1]?.[1], 3);
}

const editableDocument = editableDocumentResponseSchema.parse({
  report_id: "report-1",
  section_id: "economic-section-1",
  section_type: "economic",
  revision: 0,
  blocks: [
    {
      block_id: "economic-chart-1",
      type: "chart",
      chart_type: "bar",
      title: "Annual cost comparison",
      categories: ["Spinraza", "Risdiplam"],
      series: [{ name: "Per-patient net cost", values: [263.1, 6] }],
      currency: "USD",
    },
    {
      block_id: "economic-table-1",
      type: "table",
      columns: ["Category", "Cost"],
      rows: [["Drug acquisition", 240.9]],
    },
  ],
});

assert.equal(editableDocument.blocks[0]?.type, "chart");
assert.equal(editableDocument.blocks[1]?.type, "table");

const editableDisplayContent = toReportSectionContent(editableDocument.blocks);
assert.equal(editableDisplayContent.blocks[0]?.type, "chart");
assert.equal(editableDisplayContent.blocks[1]?.type, "table");
