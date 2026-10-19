const countFormatter = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0,
});

type DateValue = string | Date | null | undefined;

function parseDate(value: DateValue): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  // Calendar dates represent a day, rather than an instant in a time zone.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (date.toISOString().slice(0, 10) !== value) return null;
  }
  return date;
}

export function formatDisplayDate(value: DateValue): string {
  const date = parseDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? { timeZone: "UTC" }
      : {}),
  }).format(date);
}

export function formatDisplayDateTime(value: DateValue): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDisplayDate(value);
  }
  const date = parseDate(value);
  if (!date) return "—";

  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).format(date);
  return `${formatDisplayDate(date)}, ${time}`;
}

export function formatDisplayCount(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? countFormatter.format(Object.is(value, -0) ? 0 : value)
    : "—";
}
