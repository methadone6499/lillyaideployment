import { cn } from "@/lib/cn";

type FooterStat = {
  value: number | null;
  label: string;
};

type UsageProgressCardProps = {
  title: string;
  used: number | null;
  total: number | null;
  usedSuffix: string;
  remainder: number | null;
  remainderSuffix: string;
  footerStats: FooterStat[];
  className?: string;
};

function formatCount(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return String(value);
}

function getFillPercent(used: number | null, total: number | null): number {
  if (used == null || total == null || total <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (used / total) * 100));
}

export function UsageProgressCard({
  title,
  used,
  total,
  usedSuffix,
  remainder,
  remainderSuffix,
  footerStats,
  className,
}: UsageProgressCardProps) {
  const fillPercent = getFillPercent(used, total);
  const progressMax = total ?? 0;
  const progressNow = used ?? 0;

  return (
    <article
      className={cn(
        "rounded-button border border-border-default bg-surface-default p-6",
        className,
      )}
    >
      <h2 className="text-label font-medium tracking-[0.08em] text-white uppercase">
        {title}
      </h2>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <p className="text-body-lg font-medium text-white">
          {formatCount(used)} / {formatCount(total)}
          <span className="ml-2 font-normal text-text-body">{usedSuffix}</span>
        </p>
        <p className="text-body-lg text-text-body">
          {formatCount(remainder)} {remainderSuffix}
        </p>
      </div>

      <div
        role="progressbar"
        aria-label={`${title} usage`}
        aria-valuemin={0}
        aria-valuemax={progressMax}
        aria-valuenow={progressNow}
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-elevated"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width]"
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
        {footerStats.map((stat) => (
          <p key={stat.label} className="text-label text-text-body">
            <span className="font-medium text-white">
              {formatCount(stat.value)}
            </span>{" "}
            {stat.label}
          </p>
        ))}
      </div>
    </article>
  );
}
