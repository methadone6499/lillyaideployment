import type {
  BudgetImpactAnalysis,
  CostAnalysisResult,
  PharmaCurrency,
} from "./pharmaCalculator";

type PdfColor = readonly [number, number, number];
type PdfRow = readonly [label: string, value: string];
type PdfTable = {
  title: string;
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  widths?: readonly number[];
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const PAGE_MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const CONTENT_BOTTOM = 800;

const COLORS = {
  ink: [0.08, 0.1, 0.09] as PdfColor,
  muted: [0.37, 0.42, 0.4] as PdfColor,
  line: [0.83, 0.87, 0.85] as PdfColor,
  paperTint: [0.96, 0.98, 0.97] as PdfColor,
  brand: [0.04, 0.72, 0.51] as PdfColor,
  brandDark: [0.035, 0.09, 0.07] as PdfColor,
  white: [1, 1, 1] as PdfColor,
} as const;

function ascii(value: string): string {
  return value
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/×/g, "x")
    .replace(/Δ/g, "Delta")
    .replace(/−/g, "-")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

function escapePdfText(value: string): string {
  return ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function colorCommand(color: PdfColor): string {
  return `${color[0]} ${color[1]} ${color[2]}`;
}

function wrapText(value: string, maximumCharacters: number): string[] {
  const normalized = ascii(value).trim() || "-";
  const words = normalized.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    if (word.length > maximumCharacters) {
      if (line) {
        lines.push(line);
        line = "";
      }
      for (let index = 0; index < word.length; index += maximumCharacters) {
        lines.push(word.slice(index, index + maximumCharacters));
      }
      return;
    }

    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maximumCharacters) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  });

  if (line) lines.push(line);
  return lines.length > 0 ? lines : ["-"];
}

function formatMoney(value: number, currency: PharmaCurrency): string {
  const amount = Number.isFinite(value) ? value : 0;
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value: number, fractionDigits = 0): string {
  const amount = Number.isFinite(value) ? value : 0;
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function buildPdfFile(pageStreams: readonly string[]): string {
  const pageIds = pageStreams.map((_, index) => 5 + index * 2);
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  pageStreams.forEach((stream, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

class PdfReportBuilder {
  private readonly pages: string[][] = [];
  private currentPage: string[] = [];
  private cursorY = 0;

  constructor(
    private readonly title: string,
    private readonly subtitle: string,
    private readonly generatedLabel: string,
  ) {
    this.startPage();
  }

  private text(
    value: string,
    x: number,
    top: number,
    size: number,
    color: PdfColor = COLORS.ink,
    font: "F1" | "F2" = "F1",
  ) {
    this.currentPage.push(
      `BT /${font} ${size} Tf ${colorCommand(color)} rg 1 0 0 1 ${x} ${PAGE_HEIGHT - top} Tm (${escapePdfText(value)}) Tj ET`,
    );
  }

  private rectangle(
    x: number,
    top: number,
    width: number,
    height: number,
    color: PdfColor,
  ) {
    this.currentPage.push(
      `${colorCommand(color)} rg ${x} ${PAGE_HEIGHT - top - height} ${width} ${height} re f`,
    );
  }

  private rule(x1: number, x2: number, top: number, color: PdfColor) {
    this.currentPage.push(
      `${colorCommand(color)} RG 0.7 w ${x1} ${PAGE_HEIGHT - top} m ${x2} ${PAGE_HEIGHT - top} l S`,
    );
  }

  private startPage() {
    if (this.currentPage.length > 0) this.pages.push(this.currentPage);
    this.currentPage = [];
    this.rectangle(0, 0, PAGE_WIDTH, 72, COLORS.brandDark);
    this.rectangle(0, 69, PAGE_WIDTH, 3, COLORS.brand);
    this.text(this.title, PAGE_MARGIN, 31, 17, COLORS.white, "F2");
    this.text(this.subtitle, PAGE_MARGIN, 51, 8.5, [0.71, 0.86, 0.79]);
    this.text("LillyAI", PAGE_WIDTH - PAGE_MARGIN - 44, 31, 10, COLORS.brand, "F2");
    this.text(this.generatedLabel, PAGE_WIDTH - PAGE_MARGIN - 112, 51, 7.5, [0.71, 0.76, 0.73]);
    this.cursorY = 94;
  }

  private ensureSpace(height: number, continuationTitle?: string) {
    if (this.cursorY + height <= CONTENT_BOTTOM) return;
    this.startPage();
    if (continuationTitle) this.addSectionHeading(`${continuationTitle} (continued)`);
  }

  private addSectionHeading(title: string) {
    this.ensureSpace(27);
    this.rectangle(PAGE_MARGIN, this.cursorY, 3, 17, COLORS.brand);
    this.text(title, PAGE_MARGIN + 11, this.cursorY + 12, 10.5, COLORS.ink, "F2");
    this.rule(PAGE_MARGIN, PAGE_WIDTH - PAGE_MARGIN, this.cursorY + 23, COLORS.line);
    this.cursorY += 32;
  }

  addGridSection(title: string, rows: readonly PdfRow[]) {
    if (rows.length === 0) return;
    this.ensureSpace(72);
    this.addSectionHeading(title);

    const gap = 8;
    const cellWidth = (CONTENT_WIDTH - gap) / 2;
    for (let index = 0; index < rows.length; index += 2) {
      const pair = rows.slice(index, index + 2);
      const layouts = pair.map(([label, value]) => {
        const labelLines = wrapText(label.toUpperCase(), 36);
        const valueLines = wrapText(value, 39);
        return { labelLines, valueLines };
      });
      const rowHeight = Math.max(
        46,
        ...layouts.map(
          ({ labelLines, valueLines }) =>
            13 + labelLines.length * 8 + valueLines.length * 10,
        ),
      );

      this.ensureSpace(rowHeight + 6, title);
      pair.forEach((_, pairIndex) => {
        const x = PAGE_MARGIN + pairIndex * (cellWidth + gap);
        const layout = layouts[pairIndex];
        this.rectangle(x, this.cursorY, cellWidth, rowHeight, COLORS.paperTint);
        layout.labelLines.forEach((line, lineIndex) => {
          this.text(
            line,
            x + 9,
            this.cursorY + 12 + lineIndex * 8,
            6.8,
            COLORS.muted,
            "F2",
          );
        });
        const valueTop = this.cursorY + 18 + layout.labelLines.length * 8;
        layout.valueLines.forEach((line, lineIndex) => {
          this.text(line, x + 9, valueTop + lineIndex * 10, 9, COLORS.ink);
        });
      });
      this.cursorY += rowHeight + 5;
    }
    this.cursorY += 9;
  }

  addTable({ title, columns, rows, widths }: PdfTable) {
    if (rows.length === 0) return;
    const normalizedWidths = widths ?? columns.map(() => 1 / columns.length);
    const widthTotal = normalizedWidths.reduce((total, width) => total + width, 0);
    const columnWidths = normalizedWidths.map(
      (width) => (width / widthTotal) * CONTENT_WIDTH,
    );
    const drawHeader = () => {
      this.rectangle(PAGE_MARGIN, this.cursorY, CONTENT_WIDTH, 24, COLORS.brandDark);
      let x = PAGE_MARGIN;
      columns.forEach((column, index) => {
        this.text(column.toUpperCase(), x + 6, this.cursorY + 16, 6.7, COLORS.white, "F2");
        x += columnWidths[index];
      });
      this.cursorY += 24;
    };

    this.ensureSpace(82);
    this.addSectionHeading(title);
    drawHeader();

    rows.forEach((row, rowIndex) => {
      const wrappedCells = row.map((cell, columnIndex) =>
        wrapText(cell, Math.max(8, Math.floor(columnWidths[columnIndex] / 4.9))),
      );
      const rowHeight = Math.max(25, ...wrappedCells.map((lines) => lines.length * 9 + 9));
      if (this.cursorY + rowHeight > CONTENT_BOTTOM) {
        this.startPage();
        this.addSectionHeading(`${title} (continued)`);
        drawHeader();
      }
      if (rowIndex % 2 === 0) {
        this.rectangle(PAGE_MARGIN, this.cursorY, CONTENT_WIDTH, rowHeight, COLORS.paperTint);
      }
      let x = PAGE_MARGIN;
      wrappedCells.forEach((lines, columnIndex) => {
        lines.forEach((line, lineIndex) => {
          this.text(
            line,
            x + 6,
            this.cursorY + 16 + lineIndex * 9,
            7.3,
            COLORS.ink,
            columnIndex === 0 ? "F2" : "F1",
          );
        });
        x += columnWidths[columnIndex];
      });
      this.rule(PAGE_MARGIN, PAGE_WIDTH - PAGE_MARGIN, this.cursorY + rowHeight, COLORS.line);
      this.cursorY += rowHeight;
    });
    this.cursorY += 14;
  }

  build(): string {
    if (this.currentPage.length > 0) this.pages.push(this.currentPage);
    const pageCount = this.pages.length;
    const streams = this.pages.map((commands, index) => {
      const footerTop = PAGE_HEIGHT - 24;
      return [
        ...commands,
        `${colorCommand(COLORS.line)} RG 0.7 w ${PAGE_MARGIN} ${PAGE_HEIGHT - footerTop} m ${PAGE_WIDTH - PAGE_MARGIN} ${PAGE_HEIGHT - footerTop} l S`,
        `BT /F1 7 Tf ${colorCommand(COLORS.muted)} rg 1 0 0 1 ${PAGE_MARGIN} 12 Tm (Generated by LillyAI - review assumptions before decision use) Tj ET`,
        `BT /F2 7 Tf ${colorCommand(COLORS.muted)} rg 1 0 0 1 ${PAGE_WIDTH - PAGE_MARGIN - 52} 12 Tm (Page ${index + 1} of ${pageCount}) Tj ET`,
      ].join("\n");
    });
    return buildPdfFile(streams);
  }
}

function generatedOnLabel(): string {
  return `Generated ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date())}`;
}

function downloadPdf(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function slugify(value: string): string {
  return ascii(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "analysis";
}

export function createCostAnalysisPdfContent(
  result: CostAnalysisResult,
  currency: PharmaCurrency,
): string {
  const { inputs } = result;
  const report = new PdfReportBuilder(
    "Cost Analysis",
    `${inputs.drugName} - ${inputs.indication}`,
    generatedOnLabel(),
  );

  report.addGridSection("Analysis inputs", [
    ["Drug", inputs.drugName],
    ["Indication", inputs.indication],
    ["Dosage form", inputs.dosageForm],
    ["Drug class", inputs.drugClass],
    ["Currency", currency],
    ["New-treatment patients", formatNumber(inputs.estimatedPatients)],
  ]);
  report.addGridSection("Annual per-patient cost inputs", [
    ["Drug acquisition", formatMoney(inputs.annualDrugCost, currency)],
    ["Administration", formatMoney(inputs.administration, currency)],
    ["Monitoring", formatMoney(inputs.monitoring, currency)],
    ["Laboratory / diagnostics", formatMoney(inputs.labDiagnostics, currency)],
    ["Outpatient visits", formatMoney(inputs.outpatientVisits, currency)],
    ["Adverse-event management", formatMoney(inputs.adverseEventManagement, currency)],
    ["Adverse-event rate", `${formatNumber(inputs.adverseEventRatePercent, 2)}%`],
    ["Hospitalizations", formatMoney(inputs.hospitalizations, currency)],
    ["Other direct costs", formatMoney(inputs.otherDirectCosts, currency)],
    ["Hospitalization avoidance", formatMoney(inputs.hospitalizationAvoidance, currency)],
    ["Other offsets", formatMoney(inputs.otherOffsets, currency)],
  ]);
  if (inputs.comparatorName.trim()) {
    report.addGridSection("Comparator inputs", [
      ["Comparator", inputs.comparatorName],
      ["Comparator patients", formatNumber(inputs.comparatorPatients)],
      ["Annual drug cost", formatMoney(inputs.comparatorAnnualCost, currency)],
      ["Administration + monitoring", formatMoney(inputs.comparatorExtraCost, currency)],
      ["Offsets", formatMoney(inputs.comparatorOffsets, currency)],
    ]);
  }
  report.addGridSection("Per-patient outputs", [
    ["Expected adverse-event cost", formatMoney(result.expectedAdverseEventCost, currency)],
    ["Gross annual cost", formatMoney(result.grossCost, currency)],
    ["Total offsets", formatMoney(result.totalOffsets, currency)],
    ["Net annual cost", formatMoney(result.netCost, currency)],
    ...(result.hasComparator
      ? ([
          ["Comparator net annual cost", formatMoney(result.comparatorNetCost, currency)],
          ["Difference", formatMoney(result.perPatientDifference, currency)],
        ] as PdfRow[])
      : []),
  ]);
  report.addGridSection("Programme outputs", [
    ["Gross programme cost", formatMoney(result.totalGrossCost, currency)],
    ["Net programme cost", formatMoney(result.totalNetCost, currency)],
    ["Annual programme offsets", formatMoney(result.totalOffsets * inputs.estimatedPatients, currency)],
    ...(result.hasComparator
      ? ([
          ["Comparator programme cost", formatMoney(result.totalComparatorCost, currency)],
          ["Programme difference", formatMoney(result.totalDifference, currency)],
        ] as PdfRow[])
      : []),
  ]);
  report.addTable({
    title: "Cost component results",
    columns: ["Component", "Per patient", "Programme", "% net"],
    widths: [0.34, 0.22, 0.27, 0.17],
    rows: result.componentTable.map((row) => [
      row.component,
      formatMoney(row.per_patient, currency),
      formatMoney(row.programme, currency),
      `${row.percentage_of_net_programme.toFixed(1)}%`,
    ]),
  });
  if (result.hasComparator) {
    report.addTable({
      title: "Per-patient comparison",
      columns: ["Component", inputs.drugName, inputs.comparatorName, "Difference"],
      widths: [0.34, 0.22, 0.22, 0.22],
      rows: result.comparisonTable.map((row) => [
        row.component,
        formatMoney(row.new_treatment_per_patient, currency),
        formatMoney(row.comparator_per_patient, currency),
        formatMoney(row.per_patient_difference, currency),
      ]),
    });
  }
  return report.build();
}

export function createBudgetImpactPdfContent(
  analysis: BudgetImpactAnalysis,
  currency: PharmaCurrency,
): string {
  const { inputs, base, conservative, optimistic } = analysis;
  const finalYear = base.years.at(-1);
  const report = new PdfReportBuilder(
    "Budget Impact Analysis",
    `${inputs.drugName} - ${inputs.indication}`,
    generatedOnLabel(),
  );

  report.addGridSection("Decision context", [
    ["Perspective", inputs.perspective],
    ["Time horizon", `${inputs.horizon} years`],
    ["Drug", inputs.drugName],
    ["Indication", inputs.indication],
    ["Currency", currency],
    ["Current treatment", inputs.currentTreatment.name],
  ]);
  report.addGridSection("Treatment cost inputs", [
    ["Annual drug cost / patient", formatMoney(inputs.annualDrugCost, currency)],
    ["Administration + monitoring", formatMoney(inputs.administrationAndMonitoring, currency)],
    ["Expected adverse-event cost", formatMoney(inputs.adverseEventCost, currency)],
    ["Offsets", formatMoney(inputs.offsets, currency)],
    ["Wastage", `${formatNumber(inputs.wastagePercent, 2)}%`],
    ["Current-treatment drug price", formatMoney(inputs.currentTreatment.drugPrice, currency)],
    ["Current-treatment extra care", formatMoney(inputs.currentTreatment.extraCareCost, currency)],
    ["Current-treatment savings", formatMoney(inputs.currentTreatment.savings, currency)],
  ]);
  report.addGridSection("Population inputs", [
    ["Hospital beds", formatNumber(inputs.hospitalBeds)],
    ["Bed occupancy", `${formatNumber(inputs.bedOccupancyPercent, 2)}%`],
    ["Prevalence", `${formatNumber(inputs.prevalencePercent, 2)}%`],
    ["Diagnosis rate", `${formatNumber(inputs.diagnosisRatePercent, 2)}%`],
    ["Eligibility", `${formatNumber(inputs.eligiblePercent, 2)}%`],
    ["Average length of stay", `${formatNumber(inputs.averageLengthOfStay, 2)} days`],
    ["Annual population growth", `${formatNumber(inputs.populationGrowthPercent, 2)}%`],
    ["Annual inflation", `${formatNumber(inputs.inflationPercent, 2)}%`],
  ]);
  report.addGridSection("Uptake and scenario inputs", [
    ...inputs.uptakePercent.slice(0, inputs.horizon).map(
      (uptake, index) => [`Year ${index + 1} uptake`, `${formatNumber(uptake, 2)}%`] as PdfRow,
    ),
    ["Conservative uptake multiplier", formatNumber(inputs.conservativeUptakeFactor, 2)],
    ["Optimistic uptake multiplier", formatNumber(inputs.optimisticUptakeFactor, 2)],
    ["Conservative cost increase", `${formatNumber(inputs.conservativeCostIncreasePercent, 2)}%`],
    ["Optimistic cost decrease", `${formatNumber(inputs.optimisticCostDecreasePercent, 2)}%`],
    ["Analyst notes", inputs.notes.trim() || "No notes entered"],
  ]);
  report.addGridSection("Key outputs", [
    ["Eligible population - year 1", formatNumber(base.eligiblePopulationYearOne)],
    ["Current-treatment cost / patient", formatMoney(base.currentTreatmentCost, currency)],
    ["New-treatment net cost / patient", formatMoney(base.newDrugNetCost, currency)],
    ["Final-year new-treatment patients", formatNumber(finalYear?.newDrugPatients ?? 0)],
    [`${inputs.horizon}-year cumulative impact`, formatMoney(base.cumulativeImpact, currency)],
    ["Analysis date", analysis.analysisDate],
  ]);
  report.addTable({
    title: "Year-by-year results",
    columns: ["Year", "Eligible", "New treatment", "Baseline", "Scenario", "Impact"],
    widths: [0.09, 0.16, 0.18, 0.19, 0.19, 0.19],
    rows: base.years.map((year) => [
      String(year.year),
      formatNumber(year.population),
      `${formatNumber(year.newDrugPatients)} (${formatNumber(year.uptakePercent, 1)}%)`,
      formatMoney(year.baselineSpend, currency),
      formatMoney(year.totalSpend, currency),
      formatMoney(year.incrementalImpact, currency),
    ]),
  });
  report.addTable({
    title: "Scenario outputs",
    columns: ["Year", "Conservative", "Base case", "Optimistic"],
    widths: [0.16, 0.28, 0.28, 0.28],
    rows: [
      ...base.years.map((year, index) => [
        `Year ${year.year}`,
        formatMoney(conservative.years[index]?.incrementalImpact ?? 0, currency),
        formatMoney(year.incrementalImpact, currency),
        formatMoney(optimistic.years[index]?.incrementalImpact ?? 0, currency),
      ]),
      [
        "Cumulative",
        formatMoney(conservative.cumulativeImpact, currency),
        formatMoney(base.cumulativeImpact, currency),
        formatMoney(optimistic.cumulativeImpact, currency),
      ],
    ],
  });
  report.addTable({
    title: "Sensitivity outputs",
    columns: ["Parameter", "Low", "Base", "High", "Range"],
    widths: [0.3, 0.175, 0.175, 0.175, 0.175],
    rows: analysis.sensitivity.map((item) => [
      item.label,
      formatMoney(item.low, currency),
      formatMoney(item.base, currency),
      formatMoney(item.high, currency),
      formatMoney(item.range, currency),
    ]),
  });
  report.addGridSection(
    "Calculation assumptions",
    analysis.assumptions.map(
      (assumption) => [assumption.name, assumption.value] as PdfRow,
    ),
  );
  return report.build();
}

export function downloadCostAnalysisPdf(
  result: CostAnalysisResult,
  currency: PharmaCurrency,
) {
  downloadPdf(
    createCostAnalysisPdfContent(result, currency),
    `cost-analysis-${slugify(result.inputs.drugName)}.pdf`,
  );
}

export function downloadBudgetImpactPdf(
  analysis: BudgetImpactAnalysis,
  currency: PharmaCurrency,
) {
  downloadPdf(
    createBudgetImpactPdfContent(analysis, currency),
    `budget-impact-analysis-${slugify(analysis.inputs.drugName)}.pdf`,
  );
}
