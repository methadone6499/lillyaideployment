import type {
  BillingInterval,
  PlanType,
  SubscriptionStatus,
} from "../schemas/billingSchemas";

const DEFAULT_CURRENCY_FRACTION_DIGITS = 2;
const DEFAULT_CURRENCY_LOCALE = "en-US";

function parseIsoTimestamp(isoTimestamp: string): Date | null {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function padUtcPart(value: number): string {
  return String(value).padStart(2, "0");
}

export function getCurrencyFractionDigits(currency: string): number {
  const formatter = new Intl.NumberFormat(DEFAULT_CURRENCY_LOCALE, {
    style: "currency",
    currency: currency.toUpperCase(),
  });

  return (
    formatter.resolvedOptions().maximumFractionDigits ??
    DEFAULT_CURRENCY_FRACTION_DIGITS
  );
}

export function formatAmountMinor(
  amountMinor: number,
  currency: string,
  locale = DEFAULT_CURRENCY_LOCALE,
): string {
  try {
    const normalizedCurrency = currency.toUpperCase();
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: normalizedCurrency,
    });
    const fractionDigits =
      formatter.resolvedOptions().maximumFractionDigits ??
      DEFAULT_CURRENCY_FRACTION_DIGITS;

    return formatter.format(amountMinor / 10 ** fractionDigits);
  } catch {
    return `${amountMinor} ${currency}`;
  }
}

export function formatUtcDate(isoTimestamp: string): string {
  const date = parseIsoTimestamp(isoTimestamp);

  if (!date) {
    return isoTimestamp;
  }

  return `${date.getUTCFullYear()}-${padUtcPart(date.getUTCMonth() + 1)}-${padUtcPart(date.getUTCDate())}`;
}

export function formatUtcDateTime(isoTimestamp: string): string {
  const date = parseIsoTimestamp(isoTimestamp);

  if (!date) {
    return isoTimestamp;
  }

  return `${formatUtcDate(isoTimestamp)} ${padUtcPart(date.getUTCHours())}:${padUtcPart(date.getUTCMinutes())} UTC`;
}

const localDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "long",
});

const localDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatLocalDate(isoTimestamp: string): string {
  const date = parseIsoTimestamp(isoTimestamp);
  return date ? localDateFormatter.format(date) : isoTimestamp;
}

export function formatLocalDateTime(isoTimestamp: string): string {
  const date = parseIsoTimestamp(isoTimestamp);
  return date ? localDateTimeFormatter.format(date) : isoTimestamp;
}

export function formatPlanName(planType: PlanType): string {
  return `${planType.charAt(0).toUpperCase()}${planType.slice(1)}`;
}

export function formatStatusLabel(status: SubscriptionStatus): string {
  return status.replaceAll("_", " ");
}

export function formatBillingIntervalSuffix(interval: BillingInterval): string {
  return interval === "month" ? "/mo" : `/${interval}`;
}

export function formatBillingIntervalCopy(interval: BillingInterval): string {
  return interval === "month" ? "monthly" : interval;
}
