import {
  DOSAGE_CALCULATOR_CATEGORY_STANDARD_WEIGHT_KG,
  DOSAGE_CALCULATOR_CATEGORY_VALUES,
  DOSAGE_CALCULATOR_CATEGORY_WEIGHT_DISCLOSURE,
  DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE,
  DOSAGE_CALCULATOR_POPULATION_TO_CATEGORY,
  type DosageCalculatorCategory,
  type DosageCalculatorDurationUnit,
  type DosageCalculatorPopulationSlug,
} from "../constants/dosageCalculatorOptions";
import {
  dosageCalculatorFormSchema,
  dosageCalculatorUiRequestSchema,
  type DosageCalculatorParsedForm,
  type DosageCalculatorRequest,
  type DosageCalculatorUiRequest,
} from "../schemas/dosageCalculatorSchemas";

export type DosageCalculatorSubmittedInputViewModel = {
  applied: {
    drug: string;
    indication: string;
    category: DosageCalculatorCategory;
    frequency: string;
    duration: string;
    currency: string;
    unitPrice: number;
    patientVolume?: number;
    standardWeightKg: number;
    standardCategoryWeightsDisclosure: string;
  };
};

export type DosageCalculatorSubmission = {
  request: DosageCalculatorUiRequest;
  submittedInputs: DosageCalculatorSubmittedInputViewModel;
};

const DURATION_UNIT_SINGULAR = {
  days: "day",
  weeks: "week",
  months: "month",
  years: "year",
} as const satisfies Record<DosageCalculatorDurationUnit, string>;

function isPopulationSlug(
  value: string,
): value is DosageCalculatorPopulationSlug {
  return Object.hasOwn(DOSAGE_CALCULATOR_POPULATION_TO_CATEGORY, value);
}

function isCategory(value: string): value is DosageCalculatorCategory {
  return (DOSAGE_CALCULATOR_CATEGORY_VALUES as readonly string[]).includes(
    value,
  );
}

export function createDosageIdempotencyKey(): string {
  return crypto.randomUUID();
}

/**
 * Pins an idempotency key onto the request object so React Query transport
 * retries reuse the same key. Intentional new runs must pass a fresh object
 * (or a newly generated key) instead of calling this again.
 */
export function pinDosageIdempotencyKey(
  request: DosageCalculatorRequest,
): DosageCalculatorRequest {
  if (!request.idempotency_key) {
    request.idempotency_key = createDosageIdempotencyKey();
  }

  return request;
}

export function mapPopulationToCategory(
  population: string,
): DosageCalculatorCategory {
  const trimmed = population.trim();

  if (isPopulationSlug(trimmed)) {
    return DOSAGE_CALCULATOR_POPULATION_TO_CATEGORY[trimmed];
  }

  if (isCategory(trimmed)) {
    return trimmed;
  }

  throw new Error(`Unsupported dosage population: ${population}`);
}

export function formatDosageDuration(
  amount: number,
  unit: DosageCalculatorDurationUnit,
): string {
  const unitLabel = amount === 1 ? DURATION_UNIT_SINGULAR[unit] : unit;
  return `${amount} ${unitLabel}`;
}

function mapFormCurrency(parsed: DosageCalculatorParsedForm): string {
  if (parsed.currency !== DOSAGE_CALCULATOR_OTHER_CURRENCY_VALUE) {
    return parsed.currency;
  }

  const customCode = parsed.customCurrency?.trim().toUpperCase();
  if (!customCode) {
    throw new Error("Custom currency code is required");
  }

  return customCode;
}

function buildRequestFromParsedForm(
  parsed: DosageCalculatorParsedForm,
  options?: { idempotencyKey?: string },
): DosageCalculatorUiRequest {
  const request: DosageCalculatorUiRequest = {
    drug: parsed.drug,
    indication: parsed.indication,
    category: mapPopulationToCategory(parsed.population),
    frequency: parsed.frequency,
    duration: formatDosageDuration(
      parsed.treatmentDuration,
      parsed.durationUnit,
    ),
    currency: mapFormCurrency(parsed),
    unit_price: parsed.unitPrice,
    idempotency_key: options?.idempotencyKey ?? createDosageIdempotencyKey(),
  };

  if (parsed.patientVolume !== undefined) {
    request.patient_volume = parsed.patientVolume;
  }

  return dosageCalculatorUiRequestSchema.parse(request);
}

function buildSubmittedInputViewModel(
  request: DosageCalculatorUiRequest,
): DosageCalculatorSubmittedInputViewModel {
  const category = request.category;

  return {
    applied: {
      drug: request.drug,
      indication: request.indication,
      category,
      frequency: request.frequency,
      duration: request.duration,
      currency: request.currency,
      unitPrice: request.unit_price,
      patientVolume: request.patient_volume,
      standardWeightKg: DOSAGE_CALCULATOR_CATEGORY_STANDARD_WEIGHT_KG[category],
      standardCategoryWeightsDisclosure:
        DOSAGE_CALCULATOR_CATEGORY_WEIGHT_DISCLOSURE,
    },
  };
}

export function mapDosageFormToRequest(
  form: unknown,
  options?: { idempotencyKey?: string },
): DosageCalculatorUiRequest {
  const parsed = dosageCalculatorFormSchema.parse(form);
  return buildRequestFromParsedForm(parsed, options);
}

export function buildDosageSubmittedInputViewModel(
  form: unknown,
  options?: { idempotencyKey?: string },
): DosageCalculatorSubmittedInputViewModel {
  return mapDosageCalculatorSubmission(form, options).submittedInputs;
}

export function mapDosageCalculatorSubmission(
  form: unknown,
  options?: { idempotencyKey?: string },
): DosageCalculatorSubmission {
  const parsed = dosageCalculatorFormSchema.parse(form);
  const request = buildRequestFromParsedForm(parsed, options);
  return {
    request,
    submittedInputs: buildSubmittedInputViewModel(request),
  };
}
