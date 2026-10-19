import { Button } from "@/components/ui/Button";
import { UsageProgressCard } from "./UsageProgressCard";

type CompanyQuotaPoolCardsProps = {
  allocated: number | null;
  unallocated: number | null;
  remaining: number | null;
  used: number | null;
  total: number | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
};

export function CompanyQuotaPoolCards({
  allocated,
  unallocated,
  remaining,
  used,
  total,
  isLoading = false,
  isError = false,
  errorMessage = null,
  onRetry,
}: CompanyQuotaPoolCardsProps) {
  return (
    <section
      aria-label="Company report quota"
      aria-busy={isLoading}
      className="mt-6"
    >
      {isError ? (
        <div
          className="mb-4 flex flex-wrap items-center gap-3 text-label text-status-running"
          role="alert"
        >
          <p>{errorMessage ?? "Unable to load company quota."}</p>
          {onRetry ? (
            <Button variant="table" size="table" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      <UsageProgressCard
        title="Report Allocation"
        used={used}
        total={total}
        usedSuffix="reports used this period"
        remainder={remaining}
        remainderSuffix="left"
        footerStats={[
          { value: allocated, label: "allocated" },
          { value: unallocated, label: "unallocated" },
        ]}
      />
    </section>
  );
}
