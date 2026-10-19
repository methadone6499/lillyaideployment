import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export type DashboardSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
};

export function DashboardSearchInput({
  value,
  onChange,
  label = "Search report name",
  placeholder = "Search report name",
  maxLength,
  className,
}: DashboardSearchInputProps) {
  return (
    <label className={cn("relative block min-w-0 w-full sm:flex-1", className)}>
      <span className="sr-only">{label}</span>
      <span className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-text-muted">
        <SearchIcon />
      </span>
      <input
        type="search"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full rounded-surface bg-surface-subtle py-4 pr-5 pl-14 text-body-lg text-white outline-none transition-[box-shadow] placeholder:text-text-placeholder focus-visible:ring-2 focus-visible:ring-brand/35"
      />
    </label>
  );
}
