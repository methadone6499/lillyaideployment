import assert from "node:assert/strict";

import {
  DOSAGE_CALCULATOR_CATEGORY_STANDARD_WEIGHT_KG,
  DOSAGE_CALCULATOR_CATEGORY_WEIGHT_DISCLOSURE,
  DOSAGE_CALCULATOR_CURRENCY_CODES,
  DOSAGE_CALCULATOR_DEFAULT_PATIENT_VOLUME,
  DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE,
  DOSAGE_CALCULATOR_PHASE_LABELS,
} from "../constants/dosageCalculatorOptions";
import {
  dosageCalculatorEnqueueResponseSchema,
  dosageCalculatorFormSchema,
  dosageCalculatorJobPhaseSchema,
  dosageCalculatorJobStatusSchema,
  dosageCalculatorPollUrlsSchema,
  dosageCalculatorProgressSchema,
  dosageCalculatorRequestSchema,
  dosageCalculatorResultSchema,
  dosageCalculatorStatusResponseSchema,
  dosageCalculatorTableRowSchema,
  dosageCalculatorUiRequestSchema,
  isDosageCalculatorResultReady,
  isDosageCalculatorTerminalJobStatus,
} from "../schemas/dosageCalculatorSchemas";
import {
  DOSAGE_SNAPSHOT_NOT_SENT,
  getAppliedSnapshotRows,
  getCategoryWeightHelper,
  getDosagePhaseLabel,
  getIndicationMatchNotice,
} from "../utils/dosageCalculatorDisplay";
import {
  buildDosageSubmittedInputViewModel,
  createDosageIdempotencyKey,
  formatDosageDuration,
  mapDosageFormToRequest,
  mapPopulationToCategory,
  pinDosageIdempotencyKey,
} from "../utils/mapDosageCalculatorRequest";

const JOB_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const POLL_URLS = {
  status: `/api/v1/dosage-calculator/${JOB_ID}`,
  result: `/api/v1/dosage-calculator/${JOB_ID}/result`,
  markdown: `/api/v1/dosage-calculator/${JOB_ID}/markdown`,
};

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const UI_REQUEST_KEYS_WITH_VOLUME = [
  "category",
  "currency",
  "drug",
  "duration",
  "frequency",
  "idempotency_key",
  "indication",
  "patient_volume",
  "unit_price",
] as const;

const UI_REQUEST_KEYS_WITHOUT_VOLUME = UI_REQUEST_KEYS_WITH_VOLUME.filter(
  (key) => key !== "patient_volume",
);

const FORM_ONLY_FIELD_KEYS = [
  "population",
  "treatmentDuration",
  "durationUnit",
  "customCurrency",
  "unitPrice",
  "patientVolume",
] as const;

function buildForm(overrides: Record<string, unknown> = {}) {
  return {
    drug: "Spinraza",
    indication: "Spinal muscular atrophy",
    population: "infant",
    frequency: "once every 4 months",
    treatmentDuration: "12",
    durationUnit: "weeks",
    currency: "USD",
    customCurrency: "",
    unitPrice: "75000",
    patientVolume: "30",
    ...overrides,
  };
}

function buildTableRow(overrides: Record<string, unknown> = {}) {
  return {
    drug_name: "Spinraza (nusinersen)",
    unit_price: "USD 75,000.00",
    dose: "12 mg intrathecal; 4 loading doses then 12 mg every 4 months",
    estimated_usage: "6 vials (4 loading + 2 maintenance)",
    cost_per_patient: "USD 450,000.00",
    cost_cohort: "USD 13,500,000.00",
    period: "Year 1",
    presentation: "12 mg/5 mL (2.4 mg/mL) single-dose vial",
    units: 6.0,
    ...overrides,
  };
}

function buildResult(overrides: Record<string, unknown> = {}) {
  return {
    job_id: JOB_ID,
    price_source: "user_provided",
    indication_match: "exact",
    table: [buildTableRow()],
    extraction: { opaque: "full structured label extraction" },
    markdown: "# Dosage Calculator — Spinraza\n...",
    artifacts: {
      label_html_path: "/data/dosage_calculator/.../Spinraza_dailymed.html",
      label_markdown_path: "...",
      extraction_path: "...",
      markdown_path: "...",
    },
    warnings: [],
    ...overrides,
  };
}

function assertMappedRequestExclusions(request: object) {
  assert.deepEqual(Object.keys(request).sort(), [...UI_REQUEST_KEYS_WITH_VOLUME]);

  for (const key of FORM_ONLY_FIELD_KEYS) {
    assert.equal(Object.hasOwn(request, key), false);
  }

  assert.equal(Object.hasOwn(request, "model"), false);
  assert.equal(
    Object.hasOwn(request, DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE),
    false,
  );
}

const parsedForm = dosageCalculatorFormSchema.parse(buildForm());
assert.equal(parsedForm.unitPrice, 75000);
assert.equal(parsedForm.patientVolume, 30);
assert.equal(parsedForm.treatmentDuration, 12);
assert.equal(parsedForm.durationUnit, "weeks");
assert.equal(parsedForm.currency, "USD");
assert.equal(parsedForm.customCurrency, undefined);

const trimmedForm = dosageCalculatorFormSchema.parse(
  buildForm({
    drug: "  Spinraza  ",
    indication: "  Spinal muscular atrophy  ",
    frequency: "  every 8 weeks  ",
    customCurrency: "  ",
    unitPrice: " 75000 ",
    treatmentDuration: " 12 ",
  }),
);
assert.equal(trimmedForm.drug, "Spinraza");
assert.equal(trimmedForm.indication, "Spinal muscular atrophy");
assert.equal(trimmedForm.frequency, "every 8 weeks");
assert.equal(trimmedForm.customCurrency, undefined);
assert.equal(trimmedForm.unitPrice, 75000);
assert.equal(trimmedForm.treatmentDuration, 12);

const otherCurrencyForm = dosageCalculatorFormSchema.parse(
  buildForm({
    currency: DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE,
    customCurrency: " jpy ",
  }),
);
assert.equal(otherCurrencyForm.currency, DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE);
assert.equal(otherCurrencyForm.customCurrency, "JPY");

assert.equal(
  dosageCalculatorFormSchema.safeParse(
    buildForm({ frequency: "", currency: "", unitPrice: "" }),
  ).success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ drug: "   " })).success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ indication: "   " })).success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ frequency: "   " })).success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ durationUnit: "" })).success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ durationUnit: "hours" }))
    .success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ currency: "JPY" })).success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(
    buildForm({
      currency: DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE,
      customCurrency: "",
    }),
  ).success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(
    buildForm({
      currency: DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE,
      customCurrency: "   ",
    }),
  ).success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ unitPrice: "0" })).success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ unitPrice: "-1" })).success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ unitPrice: "Infinity" }))
    .success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ unitPrice: "NaN" })).success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ treatmentDuration: "0" }))
    .success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ treatmentDuration: "-1" }))
    .success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(
    buildForm({ treatmentDuration: "Infinity" }),
  ).success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ patientVolume: "0" }))
    .success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ patientVolume: "-3" }))
    .success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ patientVolume: "1.5" }))
    .success,
  false,
);
assert.equal(
  dosageCalculatorFormSchema.safeParse(buildForm({ patientVolume: "" })).success,
  true,
);
for (const removedField of [
  "age",
  "weight",
  "region",
  "renalFunction",
  "hepaticFunction",
  "pregnantOrPlanning",
  "concomitantInsulin",
] as const) {
  assert.equal(
    dosageCalculatorFormSchema.safeParse(
      buildForm({ [removedField]: "unused" }),
    ).success,
    false,
  );
}
assert.equal(
  dosageCalculatorFormSchema.parse(buildForm({ patientVolume: "" }))
    .patientVolume,
  undefined,
);
assert.equal(
  dosageCalculatorFormSchema.parse(
    buildForm({ currency: "USD", customCurrency: "jpy" }),
  ).customCurrency,
  "JPY",
);

const requestFromForm = mapDosageFormToRequest(buildForm(), {
  idempotencyKey: "spinraza-test-1",
});
assert.deepEqual(requestFromForm, {
  drug: "Spinraza",
  indication: "Spinal muscular atrophy",
  category: "Infant",
  frequency: "once every 4 months",
  duration: "12 weeks",
  currency: "USD",
  unit_price: 75000,
  patient_volume: 30,
  idempotency_key: "spinraza-test-1",
});
assertMappedRequestExclusions(requestFromForm);
assert.deepEqual(
  dosageCalculatorUiRequestSchema.parse(requestFromForm),
  requestFromForm,
);
assert.deepEqual(
  dosageCalculatorRequestSchema.parse(requestFromForm),
  requestFromForm,
);

const whitespaceMapped = mapDosageFormToRequest(
  buildForm({
    drug: "  Spinraza  ",
    indication: "  Spinal muscular atrophy  ",
    frequency: "  every 8 weeks  ",
  }),
  { idempotencyKey: "spinraza-test-1" },
);
assert.equal(whitespaceMapped.drug, "Spinraza");
assert.equal(whitespaceMapped.indication, "Spinal muscular atrophy");
assert.equal(whitespaceMapped.frequency, "every 8 weeks");

assert.equal(
  mapDosageFormToRequest(buildForm({ frequency: "every 8 weeks" })).frequency,
  "every 8 weeks",
);
assert.equal(
  mapDosageFormToRequest(
    buildForm({ indication: "spinal-muscular-atrophy" }),
  ).indication,
  "spinal-muscular-atrophy",
);
assert.equal(
  mapDosageFormToRequest(buildForm({ indication: "type-2-diabetes" }))
    .indication,
  "type-2-diabetes",
);

const durationCases = [
  { amount: "1", unit: "days", expected: "1 day" },
  { amount: "2", unit: "days", expected: "2 days" },
  { amount: "1", unit: "weeks", expected: "1 week" },
  { amount: "12", unit: "weeks", expected: "12 weeks" },
  { amount: "1", unit: "months", expected: "1 month" },
  { amount: "6", unit: "months", expected: "6 months" },
  { amount: "1", unit: "years", expected: "1 year" },
  { amount: "2", unit: "years", expected: "2 years" },
] as const;

for (const { amount, unit, expected } of durationCases) {
  assert.equal(formatDosageDuration(Number(amount), unit), expected);
  assert.equal(
    mapDosageFormToRequest(
      buildForm({ treatmentDuration: amount, durationUnit: unit }),
    ).duration,
    expected,
  );
}

assert.equal(formatDosageDuration(52, "weeks"), "52 weeks");
assert.equal(
  mapDosageFormToRequest(buildForm({ treatmentDuration: 52 })).duration,
  "52 weeks",
);

for (const code of DOSAGE_CALCULATOR_CURRENCY_CODES) {
  assert.equal(
    mapDosageFormToRequest(buildForm({ currency: code })).currency,
    code,
  );
}

const yenRequest = mapDosageFormToRequest(
  buildForm({
    currency: DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE,
    customCurrency: "JPY",
  }),
);
assert.equal(yenRequest.currency, "JPY");
assert.notEqual(yenRequest.currency, DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE);
assert.notEqual(yenRequest.currency, "Other currency");
assert.equal(Object.hasOwn(yenRequest, "customCurrency"), false);

const cadRequest = mapDosageFormToRequest(
  buildForm({
    currency: DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE,
    customCurrency: " cad ",
  }),
);
assert.equal(cadRequest.currency, "CAD");

assert.equal(
  mapDosageFormToRequest(
    buildForm({ currency: "USD", customCurrency: "jpy" }),
  ).currency,
  "USD",
);

assert.equal(
  dosageCalculatorUiRequestSchema.safeParse({
    ...requestFromForm,
    currency: DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE,
  }).success,
  false,
);

assert.equal(mapPopulationToCategory("adult"), "Adult");
assert.equal(mapPopulationToCategory("adolescent"), "Adolescent");
assert.equal(mapPopulationToCategory("child-6-12"), "Child 6–12");
assert.equal(mapPopulationToCategory("child-2-5"), "Child 2–5");
assert.equal(mapPopulationToCategory("infant"), "Infant");
assert.equal(mapPopulationToCategory("Adult"), "Adult");
assert.throws(() => mapPopulationToCategory("pediatric"));
assert.throws(() => mapPopulationToCategory("Pediatric"));

assert.equal(
  mapDosageFormToRequest(buildForm({ population: "adult" })).category,
  "Adult",
);

const omittedVolume = mapDosageFormToRequest(
  buildForm({ patientVolume: "" }),
);
assert.equal(Object.hasOwn(omittedVolume, "patient_volume"), false);
assert.equal(omittedVolume.patient_volume, undefined);
assert.deepEqual(Object.keys(omittedVolume).sort(), [
  ...UI_REQUEST_KEYS_WITHOUT_VOLUME,
]);

assert.equal(
  dosageCalculatorRequestSchema.safeParse({
    drug: "Metformin",
    indication: "Type 2 Diabetes",
    category: "Adult",
    frequency: "once daily",
    duration: "52 weeks",
    currency: "USD",
    unit_price: 0,
  }).success,
  false,
);
assert.equal(
  dosageCalculatorRequestSchema.parse({
    drug: "Metformin",
    indication: "Type 2 Diabetes",
    category: "Adult",
    frequency: "once daily",
    duration: "52 weeks",
    currency: "USD",
    unit_price: 0.02,
  }).unit_price,
  0.02,
);

const backendRequestWithModel = dosageCalculatorRequestSchema.parse({
  ...requestFromForm,
  model: "dosage-label-v1",
});
assert.equal(backendRequestWithModel.model, "dosage-label-v1");
assert.equal(
  dosageCalculatorRequestSchema.parse(requestFromForm).model,
  undefined,
);
assert.equal(
  dosageCalculatorUiRequestSchema.safeParse({
    ...requestFromForm,
    model: "dosage-label-v1",
  }).success,
  false,
);
assert.equal(
  dosageCalculatorRequestSchema.safeParse({
    ...requestFromForm,
    model: "   ",
  }).success,
  false,
);

assert.equal(
  dosageCalculatorRequestSchema.safeParse({
    ...requestFromForm,
    age: 1,
  }).success,
  false,
);
assert.equal(
  dosageCalculatorRequestSchema.safeParse({
    ...requestFromForm,
    weight: 8.4,
    region: "Saudi Arabia",
    renalFunction: "normal",
    hepaticFunction: "normal",
    pregnantOrPlanning: false,
    concomitantInsulin: true,
  }).success,
  false,
);
assert.equal(
  dosageCalculatorUiRequestSchema.safeParse({
    ...requestFromForm,
    durationUnit: "weeks",
    customCurrency: "JPY",
  }).success,
  false,
);

const generatedKey = createDosageIdempotencyKey();
assert.match(generatedKey, UUID_V4_PATTERN);
assert.notEqual(createDosageIdempotencyKey(), generatedKey);

const generatedRequest = mapDosageFormToRequest(buildForm());
assert.match(generatedRequest.idempotency_key ?? "", UUID_V4_PATTERN);
assert.notEqual(
  mapDosageFormToRequest(buildForm()).idempotency_key,
  mapDosageFormToRequest(buildForm()).idempotency_key,
);
assert.equal(
  mapDosageFormToRequest(buildForm(), { idempotencyKey: generatedKey })
    .idempotency_key,
  generatedKey,
);

assert.equal(DOSAGE_CALCULATOR_DEFAULT_PATIENT_VOLUME, 30);
assert.equal(DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE, "other");

const submitted = buildDosageSubmittedInputViewModel(buildForm(), {
  idempotencyKey: "spinraza-test-1",
});
assert.deepEqual(submitted.applied, {
  drug: "Spinraza",
  indication: "Spinal muscular atrophy",
  category: "Infant",
  frequency: "once every 4 months",
  duration: "12 weeks",
  currency: "USD",
  unitPrice: 75000,
  patientVolume: 30,
  standardWeightKg: 8,
  standardCategoryWeightsDisclosure:
    DOSAGE_CALCULATOR_CATEGORY_WEIGHT_DISCLOSURE,
});
assert.equal(
  submitted.applied.standardWeightKg,
  DOSAGE_CALCULATOR_CATEGORY_STANDARD_WEIGHT_KG.Infant,
);
assert.match(
  submitted.applied.standardCategoryWeightsDisclosure,
  /adult 70 kg/,
);
assert.match(
  submitted.applied.standardCategoryWeightsDisclosure,
  /adolescent 50 kg/,
);
assert.match(
  submitted.applied.standardCategoryWeightsDisclosure,
  /child 6–12 30 kg/,
);
assert.match(
  submitted.applied.standardCategoryWeightsDisclosure,
  /child 2–5 15 kg/,
);
assert.match(
  submitted.applied.standardCategoryWeightsDisclosure,
  /infant 8 kg/,
);

const adultSubmitted = buildDosageSubmittedInputViewModel(
  buildForm({ population: "adult" }),
);
assert.equal(adultSubmitted.applied.standardWeightKg, 70);
assert.equal(adultSubmitted.applied.category, "Adult");

const freeTextSubmitted = buildDosageSubmittedInputViewModel(
  buildForm({
    frequency: "every 8 weeks",
    indication: "spinal-muscular-atrophy",
    currency: DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE,
    customCurrency: " eur ",
    durationUnit: "months",
    treatmentDuration: "1",
  }),
);
assert.equal(freeTextSubmitted.applied.frequency, "every 8 weeks");
assert.equal(freeTextSubmitted.applied.indication, "spinal-muscular-atrophy");
assert.equal(freeTextSubmitted.applied.duration, "1 month");
assert.equal(freeTextSubmitted.applied.currency, "EUR");

const whitespaceSubmitted = buildDosageSubmittedInputViewModel(
  buildForm({
    frequency: "  every 8 weeks  ",
  }),
);
assert.equal(whitespaceSubmitted.applied.frequency, "every 8 weeks");

assert.deepEqual(
  dosageCalculatorPollUrlsSchema.parse(POLL_URLS),
  POLL_URLS,
);

const enqueue = dosageCalculatorEnqueueResponseSchema.parse({
  job_id: JOB_ID,
  job_status: "queued",
  phase: "queued",
  celery_task_id: "celery-task-1",
  poll_urls: POLL_URLS,
  created_at: "2026-08-31T00:00:00Z",
  message: "Dosage calculation queued",
});
assert.equal(enqueue.job_status, "queued");
assert.equal(enqueue.phase, "queued");

const processingPhases = ["label", "extract", "calculate"] as const;
for (const phase of processingPhases) {
  const status = dosageCalculatorStatusResponseSchema.parse({
    job_id: JOB_ID,
    job_status: "processing",
    phase,
    progress: {
      percent: 55,
      detail: "Extracting labeled dosing",
    },
    error: null,
    poll_urls: POLL_URLS,
  });
  assert.equal(status.phase, phase);
  assert.equal(isDosageCalculatorTerminalJobStatus(status.job_status), false);
}

const documentedPhases = [
  "queued",
  "label",
  "extract",
  "calculate",
  "done",
] as const;
for (const phase of documentedPhases) {
  assert.equal(dosageCalculatorJobPhaseSchema.parse(phase), phase);
  assert.equal(getDosagePhaseLabel(phase), DOSAGE_CALCULATOR_PHASE_LABELS[phase]);
}

const completed = dosageCalculatorStatusResponseSchema.parse({
  job_id: JOB_ID,
  job_status: "completed",
  phase: "done",
  progress: { percent: 100, detail: "Done" },
  error: null,
  poll_urls: POLL_URLS,
});
assert.equal(completed.job_status, "completed");
assert.equal(isDosageCalculatorTerminalJobStatus(completed.job_status), true);

const failed = dosageCalculatorStatusResponseSchema.parse({
  job_id: JOB_ID,
  job_status: "failed",
  phase: "extract",
  progress: { percent: 40, detail: "Label extraction failed" },
  error: "DailyMed download failed",
  poll_urls: POLL_URLS,
});
assert.equal(failed.job_status, "failed");
assert.equal(failed.error, "DailyMed download failed");
assert.equal(isDosageCalculatorTerminalJobStatus(failed.job_status), true);

assert.equal(
  dosageCalculatorJobPhaseSchema.safeParse("voiceover").success,
  false,
);
assert.equal(dosageCalculatorJobPhaseSchema.safeParse("tts").success, false);
assert.equal(
  dosageCalculatorJobStatusSchema.safeParse("cancelled").success,
  false,
);
assert.equal(
  dosageCalculatorJobStatusSchema.safeParse("pending").success,
  false,
);
assert.equal(
  dosageCalculatorProgressSchema.safeParse({ percent: 101, detail: "x" })
    .success,
  false,
);

const tableRow = dosageCalculatorTableRowSchema.parse(buildTableRow());
assert.equal(tableRow.units, 6);

const exactResult = dosageCalculatorResultSchema.parse(buildResult());
assert.equal(exactResult.indication_match, "exact");
assert.deepEqual(exactResult.warnings, []);
assert.equal(exactResult.price_source, "user_provided");
assert.deepEqual(exactResult.extraction, {
  opaque: "full structured label extraction",
});

const exactMatchNotice = getIndicationMatchNotice(exactResult.indication_match);
assert.equal(exactMatchNotice.tone, "success");
assert.match(exactMatchNotice.body, /found on the label/i);

const mismatchResult = dosageCalculatorResultSchema.parse(
  buildResult({
    indication_match: "none",
    warnings: ["Indication was not found on the label; using fallback dosing."],
  }),
);
assert.equal(mismatchResult.indication_match, "none");
assert.equal(mismatchResult.warnings.length, 1);
assert.notEqual(mismatchResult.warnings[0], "");

const mismatchNotice = getIndicationMatchNotice(mismatchResult.indication_match);
assert.equal(mismatchNotice.tone, "warning");
assert.match(mismatchNotice.body, /fallback labeled dosing/i);

const { warnings: emptyWarnings, ...resultWithoutWarnings } = buildResult();
assert.deepEqual(emptyWarnings, []);
assert.equal(
  dosageCalculatorResultSchema.safeParse(resultWithoutWarnings).success,
  false,
);
assert.equal(
  dosageCalculatorResultSchema.safeParse(buildResult({ warnings: undefined }))
    .success,
  false,
);

assert.equal(
  dosageCalculatorResultSchema.safeParse(
    buildResult({ indication_match: "partial" }),
  ).success,
  false,
);
assert.equal(
  dosageCalculatorResultSchema.safeParse(
    buildResult({ price_source: "nadac" }),
  ).success,
  false,
);
assert.equal(
  dosageCalculatorResultSchema.safeParse(
    buildResult({ extraction: ["not", "inspected"] }),
  ).success,
  true,
);
assert.equal(
  dosageCalculatorResultSchema.safeParse(buildResult({ extra: true })).success,
  false,
);
assert.equal(
  dosageCalculatorStatusResponseSchema.safeParse({
    job_id: JOB_ID,
    job_status: "processing",
    phase: "queued",
    progress: { percent: 10, detail: "Waiting" },
    error: null,
    poll_urls: POLL_URLS,
  }).success,
  true,
);
assert.equal(isDosageCalculatorTerminalJobStatus("queued"), false);
assert.equal(isDosageCalculatorTerminalJobStatus("processing"), false);
assert.equal(isDosageCalculatorTerminalJobStatus("completed"), true);
assert.equal(isDosageCalculatorTerminalJobStatus("failed"), true);
assert.equal(isDosageCalculatorResultReady("queued"), false);
assert.equal(isDosageCalculatorResultReady("processing"), false);
assert.equal(isDosageCalculatorResultReady("failed"), false);
assert.equal(isDosageCalculatorResultReady("completed"), true);
assert.equal(isDosageCalculatorResultReady(undefined), false);

const pinned = pinDosageIdempotencyKey({
  drug: "Metformin",
  indication: "Type 2 Diabetes",
  category: "Adult",
  frequency: "once daily",
  duration: "52 weeks",
  currency: "USD",
  unit_price: 0.02,
});
assert.match(pinned.idempotency_key ?? "", UUID_V4_PATTERN);
assert.equal(
  pinDosageIdempotencyKey(pinned).idempotency_key,
  pinned.idempotency_key,
);

const pinnedWithModel = pinDosageIdempotencyKey({
  drug: "Metformin",
  indication: "Type 2 Diabetes",
  category: "Adult",
  frequency: "once daily",
  duration: "52 weeks",
  currency: "USD",
  unit_price: 0.02,
  model: "dosage-label-v1",
});
assert.equal(pinnedWithModel.model, "dosage-label-v1");
assert.equal(
  dosageCalculatorRequestSchema.parse(pinnedWithModel).model,
  "dosage-label-v1",
);
assert.equal(
  dosageCalculatorUiRequestSchema.safeParse(pinnedWithModel).success,
  false,
);

assert.match(getCategoryWeightHelper("infant"), /Standard weight for Infant: 8 kg/);
assert.match(getCategoryWeightHelper("adult"), /adult 70 kg/);

assert.deepEqual(getAppliedSnapshotRows(submitted.applied), [
  { label: "Drug", value: "Spinraza" },
  { label: "Indication", value: "Spinal muscular atrophy" },
  { label: "Patient category", value: "Infant" },
  {
    label: "Standard weight",
    value: "8 kg (derived from Infant)",
  },
  { label: "Frequency", value: "once every 4 months" },
  { label: "Duration", value: "12 weeks" },
  { label: "Currency", value: "USD" },
  { label: "Unit price", value: "USD 75000" },
  { label: "Patient volume", value: "30" },
]);

const omittedVolumeSubmitted = buildDosageSubmittedInputViewModel(
  buildForm({ patientVolume: "" }),
);
assert.equal(omittedVolumeSubmitted.applied.patientVolume, undefined);
assert.deepEqual(
  getAppliedSnapshotRows(omittedVolumeSubmitted.applied).find(
    (row) => row.label === "Patient volume",
  ),
  { label: "Patient volume", value: DOSAGE_SNAPSHOT_NOT_SENT },
);

assert.deepEqual(getAppliedSnapshotRows(freeTextSubmitted.applied), [
  { label: "Drug", value: "Spinraza" },
  { label: "Indication", value: "spinal-muscular-atrophy" },
  { label: "Patient category", value: "Infant" },
  {
    label: "Standard weight",
    value: "8 kg (derived from Infant)",
  },
  { label: "Frequency", value: "every 8 weeks" },
  { label: "Duration", value: "1 month" },
  { label: "Currency", value: "EUR" },
  { label: "Unit price", value: "EUR 75000" },
  { label: "Patient volume", value: "30" },
]);
