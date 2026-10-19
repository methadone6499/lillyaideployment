"use client";

import { Button, Card } from "@/components/ui";
import { hasPermission, useAuthUser } from "@/features/auth";
import { cn } from "@/lib/cn";
import { formatDisplayCount } from "@/lib/formatDisplay";

import { useAdminSubscriptionSummary } from "../hooks/useAdminSubscriptions";

const revenueFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const trimmedTextClassName =
  "[text-box-edge:cap_alphabetic] [text-box-trim:trim-both]";

export function AdminSubscriptionSummaryCards() {
  const { authMe } = useAuthUser();
  const query = useAdminSubscriptionSummary();

  if (authMe && !hasPermission(authMe, "admin:subscriptions_read")) {
    return null;
  }

  const summary = query.data;
  const usdRevenue = summary?.mrr_by_currency.find(
    (value) => value.currency.toLowerCase() === "usd",
  );
  const cards = [
    {
      key: "total",
      title: "Total Subscriptions",
      value: summary ? formatDisplayCount(summary.total) : null,
      valueClassName: "text-white",
    },
    {
      key: "active",
      title: "Active Subscriptions",
      value: summary ? formatDisplayCount(summary.active) : null,
      valueClassName: "text-brand",
    },
    {
      key: "attention",
      title: "Needs Attention",
      value: summary ? formatDisplayCount(summary.needs_attention) : null,
      valueClassName: "text-[#d92244]",
    },
    {
      key: "revenue",
      title: "Monthly Revenue",
      value: summary
        ? revenueFormatter.format((usdRevenue?.amount_minor ?? 0) / 100)
        : null,
      valueClassName: "text-white",
    },
  ];

  return (
    <section
      aria-label="Subscription summary"
      aria-busy={query.isFetching}
      className="mt-9 lg:mt-12"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.key}
            className="@container min-h-[163px] min-w-0 p-[23px]"
          >
            <h2
              className={cn(
                "text-card-title font-medium leading-normal text-white",
                trimmedTextClassName,
              )}
            >
              {card.title}
            </h2>
            {card.value !== null ? (
              <p
                className={cn(
                  "mt-9 flex min-w-0 items-baseline gap-1 text-[clamp(2rem,16cqw,4rem)] font-medium leading-normal tabular-nums",
                  card.valueClassName,
                )}
              >
                {card.key === "revenue" ? (
                  <span className="sr-only">USD </span>
                ) : null}
                <span className={cn("min-w-0 break-words", trimmedTextClassName)}>
                  {card.value}
                </span>
                {card.key === "revenue" ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "shrink-0 text-[0.75em] text-text-muted",
                      trimmedTextClassName,
                    )}
                  >
                    $
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="mt-9 text-label text-text-muted">
                {query.isError ? "Unavailable" : "Loading…"}
              </p>
            )}
          </Card>
        ))}
      </div>
      {query.isError ? (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center gap-3 text-label text-text-muted"
        >
          <p>Unable to refresh subscription totals.</p>
          <Button
            variant="table"
            size="compact"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Retry summary
          </Button>
        </div>
      ) : null}
    </section>
  );
}
