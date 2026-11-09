import assert from "node:assert/strict";

import {
  DOSING_FREQUENCY_MENU_IDS,
  dosingFrequencyToTimesPerDay,
  formatDosingAdministrationSummary,
  frequencyFromPreset,
  frequencyFromTimesPerDay,
} from "../utils/dosingFrequency";
import {
  cloneReportCalculatorDraft,
  EMPTY_REPORT_CALCULATOR_DRAFT,
  formatReportCalculatorValidationError,
  mapReportCalculatorDraft,
  migrateReportCalculatorDraft,
} from "../utils/reportCalculator";

assert.deepEqual(DOSING_FREQUENCY_MENU_IDS, [
  "once-daily",
  "twice-daily",
  "once-weekly",
  "every-2-weeks",
  "once-monthly",
  "every-3-months",
  "custom",
]);

const everyThreeMonths = frequencyFromPreset("every-3-months");
const everyThreeMonthsRate = dosingFrequencyToTimesPerDay(everyThreeMonths);

assert.equal(dosingFrequencyToTimesPerDay(frequencyFromPreset("once-daily")), 1);
assert.equal(dosingFrequencyToTimesPerDay(frequencyFromPreset("twice-daily")), 2);
assert.equal(
  dosingFrequencyToTimesPerDay(frequencyFromPreset("once-monthly")),
  12 / 365,
);
assert.equal(everyThreeMonthsRate, 4 / 365);
assert.equal(everyThreeMonthsRate * 365, 4);

assert.equal(
  dosingFrequencyToTimesPerDay({
    preset: "custom",
    count: "1",
    interval: "3",
    unit: "month",
  }),
  everyThreeMonthsRate,
);

assert.equal(
  formatDosingAdministrationSummary(everyThreeMonths, "365"),
  "Once every 3 months. 4 administrations in one year (365 treatment days).",
);
assert.equal(
  formatDosingAdministrationSummary(frequencyFromPreset("once-monthly"), "365"),
  "Once monthly. 12 administrations in one year (365 treatment days).",
);
assert.equal(
  formatDosingAdministrationSummary(everyThreeMonths, "90"),
  "Once every 3 months. 0.99 administrations in one year (90 treatment days).",
);
assert.equal(
  formatDosingAdministrationSummary(frequencyFromPreset("once-daily"), "1"),
  "Once daily. 1 administration in one year (1 treatment day).",
);
assert.equal(
  formatDosingAdministrationSummary(
    { preset: "custom", count: "3", interval: "10", unit: "day" },
    "365",
  ),
  "3 doses every 10 days. 109.5 administrations in one year (365 treatment days).",
);
assert.equal(
  formatDosingAdministrationSummary(everyThreeMonths, "365").includes("0.0109"),
  false,
);

assert.equal(frequencyFromTimesPerDay(1).preset, "once-daily");
assert.equal(frequencyFromTimesPerDay(4 / 365).preset, "every-3-months");

const recoveredFraction = frequencyFromTimesPerDay(0.0082);
assert.equal(recoveredFraction.preset, "custom");
assert.ok(
  Math.abs(dosingFrequencyToTimesPerDay(recoveredFraction) - 0.0082) < 1e-12,
);

const legacyDaily = migrateReportCalculatorDraft({
  dosingEnabled: true,
  dosing: {
    unitCost: "10",
    unitSize: "1",
    dose: "1",
    timesPerDay: "1",
    daysPerYear: "365",
    doseType: "fixed",
    patientWeight: "70",
    wastagePercent: "0",
  },
});
assert.equal(legacyDaily.dosing.frequency.preset, "once-daily");
assert.equal(mapReportCalculatorDraft(legacyDaily).dosing?.times_per_day, 1);
assert.equal("timesPerDay" in legacyDaily.dosing, false);

const legacyFraction = migrateReportCalculatorDraft({
  dosingEnabled: true,
  dosing: {
    unitCost: "10",
    unitSize: "1",
    dose: "1",
    timesPerDay: "0.0082",
    daysPerYear: "365",
    doseType: "fixed",
    patientWeight: "70",
    wastagePercent: "0",
  },
});
assert.equal(legacyFraction.dosing.frequency.preset, "custom");
assert.ok(
  Math.abs(
    (mapReportCalculatorDraft(legacyFraction).dosing?.times_per_day ?? 0) -
      0.0082,
  ) < 1e-12,
);

const savedSchedule = cloneReportCalculatorDraft(EMPTY_REPORT_CALCULATOR_DRAFT);
savedSchedule.dosingEnabled = true;
savedSchedule.dosing.unitCost = "10";
savedSchedule.dosing.unitSize = "1";
savedSchedule.dosing.dose = "1";
savedSchedule.dosing.frequency = frequencyFromPreset("every-3-months");
const reopened = cloneReportCalculatorDraft(savedSchedule);
assert.equal(reopened.dosing.frequency.preset, "every-3-months");
assert.equal(mapReportCalculatorDraft(reopened).dosing?.times_per_day, 4 / 365);

const invalidFrequency = cloneReportCalculatorDraft(EMPTY_REPORT_CALCULATOR_DRAFT);
invalidFrequency.dosingEnabled = true;
invalidFrequency.dosing.unitCost = "10";
invalidFrequency.dosing.unitSize = "1";
invalidFrequency.dosing.dose = "1";
invalidFrequency.dosing.frequency = {
  preset: "custom",
  count: "0",
  interval: "1",
  unit: "day",
};
assert.throws(
  () => mapReportCalculatorDraft(invalidFrequency),
  (error: unknown) =>
    formatReportCalculatorValidationError(error) ===
    "Enter how often the dose is given.",
);
