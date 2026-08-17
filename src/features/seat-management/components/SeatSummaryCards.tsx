import { cn } from "@/lib/cn";

type SeatSummaryCardsProps = {
  totalSeats: number;
  activeSeats: number;
  disabledSeats: number;
};

const summaryCards = [
  { key: "total", label: "Total Seats", valueClassName: "text-white" },
  {
    key: "active",
    label: "Active Seats",
    valueClassName: "text-status-success",
  },
  {
    key: "disabled",
    label: "Disabled Seats",
    valueClassName: "text-[#d92244]",
  },
] as const;

export function SeatSummaryCards({
  totalSeats,
  activeSeats,
  disabledSeats,
}: SeatSummaryCardsProps) {
  const values = {
    total: String(totalSeats),
    active: String(activeSeats).padStart(2, "0"),
    disabled: String(disabledSeats).padStart(2, "0"),
  };

  return (
    <section
      aria-label="Seat summary"
      className="mt-9 grid max-w-[1370px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
    >
      {summaryCards.map((card) => (
        <article
          key={card.key}
          className="flex min-h-[148px] flex-col justify-between rounded-button border border-border-default bg-surface-default p-6 lg:min-h-[163px]"
        >
          <h2 className="text-card-title font-medium text-white">
            {card.label}
          </h2>
          <p
            className={cn(
              "text-[52px] leading-none font-medium lg:text-[64px]",
              card.valueClassName,
            )}
          >
            {values[card.key]}
          </p>
        </article>
      ))}
    </section>
  );
}
