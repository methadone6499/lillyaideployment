const reportCountFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

export type AdminReportLeaderboardItem = {
  id: string;
  primaryLabel: string;
  secondaryLabel?: string;
  reportCount: number;
  title?: string;
};

type AdminReportLeaderboardCardProps = {
  title: string;
  headingId: string;
  items: AdminReportLeaderboardItem[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  isAccessDenied?: boolean;
  errorMessage?: string | null;
  requestId?: string | null;
  onRetry?: () => void;
};

function getHighestReportCount(items: AdminReportLeaderboardItem[]): number {
  return items.reduce((highest, item) => Math.max(highest, item.reportCount), 0);
}

function getRelativeBarPercent(count: number, highest: number): number {
  if (highest <= 0 || count <= 0) {
    return 0;
  }

  return Math.min(100, (count / highest) * 100);
}

export function AdminReportLeaderboardCard({
  title,
  headingId,
  items,
  isLoading = false,
  isRefreshing = false,
  isAccessDenied = false,
  errorMessage = null,
  requestId = null,
  onRetry,
}: AdminReportLeaderboardCardProps) {
  const hasItems = items.length > 0;
  const showAccessDenied = isAccessDenied && !hasItems;
  const showError = Boolean(errorMessage) && !hasItems && !showAccessDenied;
  const showLoading = isLoading && !hasItems && !showAccessDenied && !showError;
  const showEmpty =
    !hasItems && !showLoading && !showAccessDenied && !showError;
  const highestReportCount = getHighestReportCount(items);

  return (
    <article
      aria-labelledby={headingId}
      aria-busy={isLoading || isRefreshing}
      className="flex min-h-[240px] min-w-0 flex-col rounded-button border border-border-default bg-surface-default p-6"
    >
      <h2
        id={headingId}
        className="text-label font-medium tracking-[0.08em] text-white uppercase"
      >
        {title}
      </h2>

      {hasItems && errorMessage ? (
        <div
          className="mt-4 flex flex-col gap-2 text-label text-text-muted"
          role="alert"
        >
          <p>{errorMessage}</p>
          {requestId ? (
            <p className="text-helper text-text-step">Request ID: {requestId}</p>
          ) : null}
          {onRetry ? (
            <button
              type="button"
              className="self-start rounded-button border border-border-default px-3 py-1.5 font-medium text-white transition-colors hover:bg-surface-elevated"
              onClick={onRetry}
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {showAccessDenied ? (
        <p className="mt-auto py-10 text-center text-label text-text-muted">
          You do not have permission to view report analytics.
        </p>
      ) : showError ? (
        <div
          className="mt-auto flex flex-col items-center gap-4 py-10 text-center text-label text-text-muted"
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
      ) : showLoading ? (
        <p className="mt-auto py-10 text-center text-label text-text-muted">
          Loading…
        </p>
      ) : showEmpty ? (
        <p className="mt-auto py-10 text-center text-label text-text-muted">
          No report activity yet.
        </p>
      ) : (
        <ol className="mt-5 flex list-none flex-col p-0">
          {items.map((item, index) => {
            const rank = index + 1;
            const barPercent = getRelativeBarPercent(
              item.reportCount,
              highestReportCount,
            );

            return (
              <li
                key={item.id}
                value={rank}
                className="border-b border-border-subtle py-3 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-toggle-knob bg-surface-elevated text-input font-medium text-white">
                    {rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-label font-medium text-white"
                      title={item.title ?? item.primaryLabel}
                    >
                      {item.primaryLabel}
                    </p>
                    {item.secondaryLabel ? (
                      <p className="truncate text-helper text-text-body">
                        {item.secondaryLabel}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-label font-medium text-white tabular-nums">
                    {reportCountFormatter.format(item.reportCount)}
                    <span className="sr-only"> reports</span>
                  </span>
                </div>
                <div
                  aria-hidden
                  className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-elevated"
                >
                  <div
                    className="h-full rounded-full bg-brand transition-[width]"
                    style={{ width: `${barPercent}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="sr-only" aria-live="polite">
        {isRefreshing ? `Updating ${title}.` : ""}
      </p>
    </article>
  );
}
