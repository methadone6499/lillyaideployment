const TOTAL_CARDS = [
  {
    key: "today",
    title: "Today",
    caption: "UTC day",
  },
  {
    key: "this_week",
    title: "This week",
    caption: "UTC week (Mon–now)",
  },
  {
    key: "this_month",
    title: "This month",
    caption: "UTC month",
  },
] as const;

const reportCountFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

export type AdminReportTotalsValues = {
  today: number;
  thisWeek: number;
  thisMonth: number;
};

type AdminReportTotalsCardsProps = {
  totals: AdminReportTotalsValues | null;
  isLoading?: boolean;
  isRefreshing?: boolean;
  isAccessDenied?: boolean;
  errorMessage?: string | null;
  requestId?: string | null;
  onRetry?: () => void;
};

function formatTotalValue(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return reportCountFormatter.format(value);
}

export function AdminReportTotalsCards({
  totals,
  isLoading = false,
  isRefreshing = false,
  isAccessDenied = false,
  errorMessage = null,
  requestId = null,
  onRetry,
}: AdminReportTotalsCardsProps) {
  const hasTotals = totals !== null;
  const showAccessDenied = isAccessDenied && !hasTotals;
  const showError = Boolean(errorMessage) && !hasTotals && !showAccessDenied;
  const showCards = hasTotals || (!showAccessDenied && !showError);
  const cardValues = {
    today: totals?.today ?? null,
    this_week: totals?.thisWeek ?? null,
    this_month: totals?.thisMonth ?? null,
  } as const;

  return (
    <section
      aria-label="Report totals"
      aria-busy={isLoading || isRefreshing}
      className="mt-6"
    >
      {showAccessDenied ? (
        <p className="rounded-button border border-border-default bg-surface-default px-6 py-10 text-center text-label text-text-muted">
          You do not have permission to view report analytics.
        </p>
      ) : null}

      {showError ? (
        <div
          className="flex flex-col items-center gap-4 rounded-button border border-border-default bg-surface-default px-6 py-10 text-center text-label text-text-muted"
          role="alert"
        >
          <p>{errorMessage}</p>
          {requestId ? (
            <p className="text-helper text-text-step">Request ID: {requestId}</p>
          ) : null}
          {onRetry ? (
            <button
              type="button"
              className="rounded-button border border-border-default px-4 py-2 font-medium text-white transition-colors hover:bg-surface-elevated"
              onClick={onRetry}
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {hasTotals && errorMessage ? (
        <div
          className="mb-4 flex flex-wrap items-center gap-3 text-label text-text-muted"
          role="alert"
        >
          <p>{errorMessage}</p>
          {requestId ? (
            <p className="text-helper text-text-step">Request ID: {requestId}</p>
          ) : null}
          {onRetry ? (
            <button
              type="button"
              className="rounded-button border border-border-default px-3 py-1.5 font-medium text-white transition-colors hover:bg-surface-elevated"
              onClick={onRetry}
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {showCards ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOTAL_CARDS.map((card) => (
            <article
              key={card.key}
              className="flex min-h-[163px] flex-col rounded-button border border-border-default bg-surface-default p-6"
            >
              <h2 className="text-card-title font-medium text-white">
                {card.title}
              </h2>
              <p className="mt-auto pt-6 text-[40px] leading-none font-medium text-white tabular-nums sm:text-[64px]">
                {formatTotalValue(cardValues[card.key])}
              </p>
              <p className="mt-3 text-helper text-text-body">{card.caption}</p>
            </article>
          ))}
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {isLoading && !hasTotals
          ? "Loading report totals."
          : isRefreshing
            ? "Updating report totals."
            : ""}
      </p>
    </section>
  );
}
