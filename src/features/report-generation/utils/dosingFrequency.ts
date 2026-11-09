export const DOSING_YEAR_DAYS = 365;

export const DOSING_FREQUENCY_UNITS = ["day", "week", "month", "year"] as const;

export type DosingFrequencyUnit = (typeof DOSING_FREQUENCY_UNITS)[number];

const UNIT_DAYS = {
  day: 1,
  week: 7,
  month: DOSING_YEAR_DAYS / 12,
  year: DOSING_YEAR_DAYS,
} as const satisfies Record<DosingFrequencyUnit, number>;

export const DOSING_FREQUENCY_PRESETS = [
  { id: "once-daily", label: "Once daily", count: 1, interval: 1, unit: "day" },
  { id: "twice-daily", label: "Twice daily", count: 2, interval: 1, unit: "day" },
  { id: "three-times-daily", label: "Three times daily", count: 3, interval: 1, unit: "day" },
  { id: "once-weekly", label: "Once weekly", count: 1, interval: 1, unit: "week" },
  { id: "every-2-weeks", label: "Once every 2 weeks", count: 1, interval: 2, unit: "week" },
  { id: "every-4-weeks", label: "Once every 4 weeks", count: 1, interval: 4, unit: "week" },
  { id: "once-monthly", label: "Once monthly", count: 1, interval: 1, unit: "month" },
  { id: "every-2-months", label: "Once every 2 months", count: 1, interval: 2, unit: "month" },
  { id: "every-3-months", label: "Once every 3 months", count: 1, interval: 3, unit: "month" },
  { id: "every-6-months", label: "Once every 6 months", count: 1, interval: 6, unit: "month" },
  { id: "once-yearly", label: "Once yearly", count: 1, interval: 1, unit: "year" },
  { id: "custom", label: "Custom", count: 1, interval: 1, unit: "day" },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  count: number;
  interval: number;
  unit: DosingFrequencyUnit;
}>;

export type DosingFrequencyPresetId =
  (typeof DOSING_FREQUENCY_PRESETS)[number]["id"];

/** Schedules shown in the dosing menu. Other presets stay defined so a saved draft can reopen. */
export const DOSING_FREQUENCY_MENU_IDS = [
  "once-daily",
  "twice-daily",
  "once-weekly",
  "every-2-weeks",
  "once-monthly",
  "every-3-months",
  "custom",
] as const satisfies readonly DosingFrequencyPresetId[];

export type DosingFrequency = {
  preset: DosingFrequencyPresetId;
  count: string;
  interval: string;
  unit: DosingFrequencyUnit;
};

export const DOSING_FREQUENCY_UNIT_OPTIONS = [
  { value: "day", label: "Days" },
  { value: "week", label: "Weeks" },
  { value: "month", label: "Months" },
  { value: "year", label: "Years" },
] as const satisfies ReadonlyArray<{ value: DosingFrequencyUnit; label: string }>;

export const DEFAULT_DOSING_FREQUENCY: DosingFrequency = {
  preset: "once-daily",
  count: "1",
  interval: "1",
  unit: "day",
};

const WHOLE_NUMBER_TOLERANCE = 1e-6;

function isPresetId(value: string): value is DosingFrequencyPresetId {
  return DOSING_FREQUENCY_PRESETS.some((preset) => preset.id === value);
}

function isFrequencyUnit(value: string): value is DosingFrequencyUnit {
  return (DOSING_FREQUENCY_UNITS as readonly string[]).includes(value);
}

function presetById(preset: DosingFrequencyPresetId) {
  return DOSING_FREQUENCY_PRESETS.find((item) => item.id === preset);
}

function positiveNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.NaN;
}

function nearlyEqual(left: number, right: number): boolean {
  const scale = Math.max(Math.abs(left), Math.abs(right), 1);
  return Math.abs(left - right) <= WHOLE_NUMBER_TOLERANCE * scale;
}

function formatCount(value: number): string {
  const nearest = Math.round(value);
  if (Math.abs(value - nearest) <= WHOLE_NUMBER_TOLERANCE) {
    return String(nearest);
  }

  const fixed = value.toFixed(2);
  return fixed.replace(/\.?0+$/, "");
}

export function timesPerDayFromParts(
  count: number,
  interval: number,
  unit: DosingFrequencyUnit,
): number {
  if (unit === "month") {
    return (count * 12) / interval / DOSING_YEAR_DAYS;
  }

  if (unit === "year") {
    return count / interval / DOSING_YEAR_DAYS;
  }

  if (unit === "week") {
    return count / (interval * 7);
  }

  return count / interval;
}

export function frequencyFromPreset(
  preset: DosingFrequencyPresetId,
): DosingFrequency {
  const match = presetById(preset);
  if (!match || match.id === "custom") {
    return { ...DEFAULT_DOSING_FREQUENCY, preset: "custom" };
  }

  return {
    preset: match.id,
    count: String(match.count),
    interval: String(match.interval),
    unit: match.unit,
  };
}

export function selectDosingFrequencyPreset(
  current: DosingFrequency,
  preset: DosingFrequencyPresetId,
): DosingFrequency {
  if (preset === "custom") {
    return { ...current, preset: "custom" };
  }

  return frequencyFromPreset(preset);
}

export function dosingFrequencyToTimesPerDay(
  frequency: DosingFrequency,
): number {
  const count = positiveNumber(frequency.count);
  const interval = positiveNumber(frequency.interval);
  if (!Number.isFinite(count) || !Number.isFinite(interval)) {
    return Number.NaN;
  }

  return timesPerDayFromParts(count, interval, frequency.unit);
}

const INTERVAL_UNIT_WORDS = {
  day: ["day", "days"],
  week: ["week", "weeks"],
  month: ["month", "months"],
  year: ["year", "years"],
} as const satisfies Record<DosingFrequencyUnit, readonly [string, string]>;

export function formatDosingIntervalUnit(unit: DosingFrequencyUnit): string {
  return INTERVAL_UNIT_WORDS[unit][1];
}

export function formatDosingRegimen(frequency: DosingFrequency): string {
  if (frequency.preset !== "custom") {
    return presetById(frequency.preset)?.label ?? "Enter how often the dose is given.";
  }

  const count = positiveNumber(frequency.count);
  const interval = positiveNumber(frequency.interval);
  if (!Number.isFinite(count) || !Number.isFinite(interval)) {
    return "Enter how often the dose is given.";
  }

  const doseNoun = formatCount(count) === "1" ? "dose" : "doses";
  const unitWord =
    formatCount(interval) === "1"
      ? INTERVAL_UNIT_WORDS[frequency.unit][0]
      : INTERVAL_UNIT_WORDS[frequency.unit][1];
  return `${formatCount(count)} ${doseNoun} every ${formatCount(interval)} ${unitWord}`;
}

export function formatDosingAdministrationSummary(
  frequency: DosingFrequency,
  daysPerYearText: string,
): string {
  const rate = dosingFrequencyToTimesPerDay(frequency);
  if (!Number.isFinite(rate)) {
    return "Enter how often the dose is given.";
  }

  const days = positiveNumber(daysPerYearText);
  if (!Number.isFinite(days)) {
    return "Enter treatment days to see the administration count.";
  }

  const administrations = formatCount(rate * days);
  const dayCount = formatCount(days);
  const noun = administrations === "1" ? "administration" : "administrations";
  const dayNoun = dayCount === "1" ? "treatment day" : "treatment days";
  return `${formatDosingRegimen(frequency)}. ${administrations} ${noun} in one year (${dayCount} ${dayNoun}).`;
}

export function frequencyFromTimesPerDay(timesPerDay: number): DosingFrequency {
  if (!Number.isFinite(timesPerDay) || timesPerDay <= 0) {
    return { ...DEFAULT_DOSING_FREQUENCY };
  }

  for (const preset of DOSING_FREQUENCY_PRESETS) {
    if (preset.id === "custom") {
      continue;
    }

    const rate = timesPerDayFromParts(preset.count, preset.interval, preset.unit);
    if (nearlyEqual(rate, timesPerDay)) {
      return frequencyFromPreset(preset.id);
    }
  }

  if (timesPerDay >= 1) {
    return {
      preset: "custom",
      count: formatRecoveredNumber(timesPerDay),
      interval: "1",
      unit: "day",
    };
  }

  const intervalDays = 1 / timesPerDay;
  const units: DosingFrequencyUnit[] = ["year", "month", "week", "day"];
  for (const unit of units) {
    const interval = intervalDays / UNIT_DAYS[unit];
    const nearest = Math.round(interval);
    if (nearest >= 1 && nearlyEqual(interval, nearest)) {
      return {
        preset: "custom",
        count: "1",
        interval: String(nearest),
        unit,
      };
    }
  }

  return {
    preset: "custom",
    count: "1",
    interval: formatRecoveredNumber(intervalDays),
    unit: "day",
  };
}

function formatRecoveredNumber(value: number): string {
  const nearest = Math.round(value);
  if (Math.abs(value - nearest) <= WHOLE_NUMBER_TOLERANCE) {
    return String(nearest);
  }

  return String(value);
}

export function frequencyFromPersisted(value: unknown): DosingFrequency | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const source = value as Record<string, unknown>;
  if (
    typeof source.preset !== "string" ||
    !isPresetId(source.preset) ||
    typeof source.unit !== "string" ||
    !isFrequencyUnit(source.unit) ||
    typeof source.count !== "string" ||
    typeof source.interval !== "string"
  ) {
    return undefined;
  }

  if (source.preset === "custom") {
    return {
      preset: "custom",
      count: source.count,
      interval: source.interval,
      unit: source.unit,
    };
  }

  return frequencyFromPreset(source.preset);
}
