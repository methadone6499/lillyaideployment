import { cn } from "@/lib/cn";

const UNAVAILABLE_METRICS_DESCRIPTION_ID =
  "subscription-metrics-unavailable";

const SUMMARY_CARDS = [
  {
    title: "Total Subscriptions",
    valueClassName: "text-white",
  },
  {
    title: "Active Subscriptions",
    valueClassName: "text-status-success",
  },
  {
    title: "Disabled Subscriptions",
    valueClassName: "text-[#d92244]",
  },
  {
    title: "Monthly Revenue",
    valueClassName: "text-white",
  },
] as const;

export function AdminSubscriptionSummaryCards() {
  return (
    <section
      aria-label="Subscription summary"
      aria-describedby={UNAVAILABLE_METRICS_DESCRIPTION_ID}
      className="mt-9 lg:mt-12"
    >
      <p id={UNAVAILABLE_METRICS_DESCRIPTION_ID} className="sr-only">
        Platform subscription totals and monthly revenue are not available
        yet.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map((card) => (
          <article
            key={card.title}
            className="flex min-h-[163px] flex-col rounded-button border border-border-default bg-surface-default p-6"
          >
            <h2 className="text-card-title font-medium text-white">
              {card.title}
            </h2>
            <p
              className={cn(
                "mt-auto pt-6 text-[40px] leading-none font-medium sm:text-[64px]",
                card.valueClassName,
              )}
            >
              —
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
