import assert from "node:assert/strict";
import { z } from "zod";
import { ReportApiError } from "../api/reportApiError";
import { reportDosingSelectionSchema, reportBudgetImpactSelectionSchema } from "../schemas/reportSchemas";
import { getCustomSectionErrorMessage } from "../utils/customSections";
import { getReportRequestErrorMessage } from "../utils/getReportRequestErrorMessage";
import { cloneReportCalculatorDraft, EMPTY_REPORT_CALCULATOR_DRAFT, formatReportCalculatorValidationError, mapReportCalculatorDraft } from "../utils/reportCalculator";
import { getSaveEditableDocumentFailureMessage } from "../utils/saveEditableDocument";
import { getRewritePreviewFailureMessage, getRewritePreviewStatusMessage } from "../utils/rewritePreview";

const invalid = reportDosingSelectionSchema.safeParse({ unit_cost: 10, unit_size: 0, dose: 1, times_per_day: 1, days_per_year: 365, dose_type: "fixed", wastage_percent: 0 });
assert.equal(invalid.success, false);
if (invalid.success) throw new Error("Expected an invalid unit size");
assert.equal(formatReportCalculatorValidationError(invalid.error), "Enter a unit size greater than 0.");
assert.doesNotMatch(formatReportCalculatorValidationError(invalid.error), /unit_size|invalid_type|expected|received/);
const invalidUptake = z.object({ uptake_percent: reportBudgetImpactSelectionSchema.shape.uptake_percent }).safeParse({ uptake_percent: [101] });
assert.equal(invalidUptake.success, false);
if (invalidUptake.success) throw new Error("Expected invalid uptake");
assert.match(formatReportCalculatorValidationError(invalidUptake.error), /Year 1 uptake.*100/);

const cost = cloneReportCalculatorDraft(EMPTY_REPORT_CALCULATOR_DRAFT);
cost.costAnalysisEnabled = true;
assert.throws(() => mapReportCalculatorDraft(cost), (error: unknown) => {
  assert.equal(formatReportCalculatorValidationError(error), "Enter the annual drug acquisition cost, or enable Dosing to calculate it.");
  return true;
});

const fallback = "We could not load this report. Try again.";
for (const error of [invalid.error, new SyntaxError("Unexpected token <"), new Error("Traceback: private diagnostic"), new ReportApiError(500, "Worker traceback")]) {
  assert.equal(getReportRequestErrorMessage(error, fallback), fallback);
  assert.doesNotMatch(getSaveEditableDocumentFailureMessage(error), /Traceback|traceback|invalid_type|Unexpected token/);
  assert.doesNotMatch(getRewritePreviewFailureMessage(error), /Traceback|traceback|invalid_type|Unexpected token/);
  assert.doesNotMatch(getCustomSectionErrorMessage(error), /Traceback|traceback|invalid_type|Unexpected token/);
}
assert.match(getReportRequestErrorMessage(new ReportApiError(401, "raw"), fallback), /Sign in again/);
assert.match(getReportRequestErrorMessage(new ReportApiError(403, "raw"), fallback), /permission/);
assert.match(getReportRequestErrorMessage(new ReportApiError(429, "raw"), fallback), /Wait a moment/);
assert.match(getReportRequestErrorMessage(new ReportApiError(504, "raw"), fallback), /took too long/);
assert.match(getReportRequestErrorMessage(new TypeError("fetch failed"), fallback), /connection/);
assert.match(getCustomSectionErrorMessage(new ReportApiError(413, "raw")), /20 MB/);
assert.match(getCustomSectionErrorMessage(new ReportApiError(422, "The template cannot be used due to a lack of structured outline"), "add"), /outline.*headings/);
assert.match(getCustomSectionErrorMessage(new Error("raw"), "load"), /load the custom sections/);
assert.match(getSaveEditableDocumentFailureMessage(new ReportApiError(200, "Schema mismatch", "invalid_response")), /could not confirm.*saved/);
assert.match(getRewritePreviewFailureMessage(new ReportApiError(422, "Unsafe block internals", "validation_failed")), /selection or instruction/);
assert.doesNotMatch(getRewritePreviewStatusMessage({ status: "validation_failed", message: "ZodError: private validator details" }) ?? "", /ZodError|private/);
