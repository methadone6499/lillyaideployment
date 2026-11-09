export const REPORT_CURRENCY_CODES = [
  "USD",
  "SAR",
  "AED",
  "GBP",
  "EUR",
] as const;

export type ReportCurrencyCode = (typeof REPORT_CURRENCY_CODES)[number];

/** Select sentinel; never send this value as `currency`. */
export const REPORT_OTHER_CURRENCY_VALUE = "other" as const;

export type ReportCurrencySelectValue =
  | ReportCurrencyCode
  | typeof REPORT_OTHER_CURRENCY_VALUE;

export const REPORT_CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "SAR", label: "SAR" },
  { value: "AED", label: "AED" },
  { value: "GBP", label: "GBP" },
  { value: "EUR", label: "EUR" },
  { value: REPORT_OTHER_CURRENCY_VALUE, label: "Other" },
] as const satisfies ReadonlyArray<{
  value: ReportCurrencySelectValue;
  label: string;
}>;

export function getReportCurrencySelectValue(
  code: string,
): ReportCurrencySelectValue {
  const normalized = code.trim().toUpperCase();
  if ((REPORT_CURRENCY_CODES as readonly string[]).includes(normalized)) {
    return normalized as ReportCurrencyCode;
  }

  return REPORT_OTHER_CURRENCY_VALUE;
}
