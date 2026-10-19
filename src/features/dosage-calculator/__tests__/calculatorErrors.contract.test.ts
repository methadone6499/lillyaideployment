import assert from "node:assert/strict";
import { z } from "zod";
import { DosageCalculatorApiError, DosageCalculatorResponseError } from "../api/dosageCalculatorFetch";
import { dosingRequestSchema, dailyMedSuggestionRequestSchema, budgetImpactRequestSchema } from "../schemas/pharmaCalculatorSchemas";
import { getCalculatorApiValidationMessages } from "../utils/calculatorValidation";
import { classifyDosageCalculatorError } from "../utils/classifyDosageCalculatorError";
import { getPharmaCalculatorErrorMessage, toDosingRequest } from "../utils/pharmaCalculator";

const dosing = { unit_cost: 0, unit_size: 100, dose: 200, times_per_day: 1, days_per_year: 365, dose_type: "fixed", wastage_percent: 0 };
function inputError(schema: z.ZodType, input: unknown): z.ZodError {
  const result = schema.safeParse(input);
  assert.equal(result.success, false);
  if (result.success) throw new Error("Expected invalid inputs");
  return result.error;
}

assert.equal(getPharmaCalculatorErrorMessage(inputError(dosingRequestSchema, { ...dosing, unit_size: 0 })), "Enter a unit size greater than 0.");
assert.equal(getPharmaCalculatorErrorMessage(inputError(dosingRequestSchema, { ...dosing, wastage_percent: 101 })), "Enter a wastage percentage of no more than 100.");
assert.equal(getPharmaCalculatorErrorMessage(inputError(dosingRequestSchema, { ...dosing, dose: NaN })), "Enter a number for dose.");
assert.equal(getPharmaCalculatorErrorMessage(inputError(dailyMedSuggestionRequestSchema, { drug: " ", indication: "Oncology", category: "Adult", patient_weight: 70, frequency: "daily", duration: "12 months" })), "Enter the drug name.");
assert.equal(getPharmaCalculatorErrorMessage(inputError(z.object({ hospital_beds: budgetImpactRequestSchema.shape.hospital_beds }), { hospital_beds: 1.5 })), "Enter a whole number for hospital bed count.");

const backendMessages = getCalculatorApiValidationMessages({ detail: [{ loc: ["body", "unit_size"], type: "greater_than", ctx: { gt: 0 }, msg: "Value error, stack trace" }] });
assert.deepEqual(backendMessages, ["Enter a unit size greater than 0."]);
assert.equal(getPharmaCalculatorErrorMessage(new DosageCalculatorApiError(422, "Value error, stack trace", backendMessages)), "Enter a unit size greater than 0.");
assert.deepEqual(getCalculatorApiValidationMessages({ details: [{ loc: ["body", "drug_name"], type: "missing" }] }), ["Enter the drug name."]);
assert.deepEqual(getCalculatorApiValidationMessages({ detail: "Traceback" }), []);
assert.deepEqual(getCalculatorApiValidationMessages({ detail: [{ loc: "unsafe", type: "missing" }] }), []);
assert.deepEqual(getCalculatorApiValidationMessages({ detail: [{ loc: ["body", "uptake_percent", 1], type: "less_than_equal", ctx: { le: 100 } }] }), ["Enter a Year 2 uptake of no more than 100."]);

for (const status of [400, 401, 403, 404, 408, 409, 422, 429, 500, 503, 504]) {
  const message = getPharmaCalculatorErrorMessage(new DosageCalculatorApiError(status, "Internal server detail: ZodError"));
  assert.doesNotMatch(message, /Internal server detail|ZodError/);
}
assert.match(getPharmaCalculatorErrorMessage(new DosageCalculatorApiError(404, "not found"), "label"), /drug name.*manually/);
assert.match(getPharmaCalculatorErrorMessage(new TypeError("Failed to fetch")), /connection/);
assert.match(getPharmaCalculatorErrorMessage(new DosageCalculatorApiError(504, "upstream timeout")), /took too long/);
assert.match(getPharmaCalculatorErrorMessage(new DosageCalculatorResponseError()), /incomplete results/);
assert.doesNotMatch(getPharmaCalculatorErrorMessage(new Error("Traceback: private diagnostics")), /Traceback|private diagnostics/);
assert.equal(classifyDosageCalculatorError(new DOMException("Aborted", "AbortError")), null);
assert.equal(toDosingRequest({ unitCost: 0, unitSize: 1, doseAmount: 1, dosesPerDay: 1, daysPerYear: 365, doseType: "fixed", patientWeight: NaN, wastagePercent: 0 }).patient_weight, undefined);
