import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type DashboardPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function DashboardPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: DashboardPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      aria-label="Recent reports pagination"
      className={cn("flex items-center justify-end gap-3", className)}
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={currentPage <= 1}
        className="flex size-8 items-center justify-center rounded-card text-text-primary drop-shadow-[0_0_2.286px_rgba(0,0,0,0.16)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronDownIcon className="size-4 -rotate-90 -scale-y-100" />
      </button>

      <div className="flex items-center gap-2.5">
        {pages.map((page) => {
          const isActive = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              aria-label={`Page ${page}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex size-8 items-center justify-center rounded-card text-body-lg shadow-toggle-knob transition-colors",
                isActive
                  ? "bg-brand font-semibold text-white"
                  : "bg-surface-subtle font-medium text-text-primary hover:bg-surface-default",
              )}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Next page"
        disabled={currentPage >= totalPages}
        className="flex size-8 items-center justify-center rounded-card text-text-primary drop-shadow-[0_0_2.286px_rgba(0,0,0,0.16)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronDownIcon className="size-4 -rotate-90" />
      </button>
    </nav>
  );
}
