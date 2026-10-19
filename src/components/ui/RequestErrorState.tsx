import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { SpinnerIcon } from "./icons";

type RequestErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  retryPending?: boolean;
  retryLabel?: string;
  tone?: "error" | "warning";
  className?: string;
};

export function RequestErrorState({
  title,
  message,
  onRetry,
  retryPending = false,
  retryLabel = "Try again",
  tone = "error",
  className,
}: RequestErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-surface border px-5 py-5",
        tone === "warning"
          ? "border-status-running/30 bg-status-running/5"
          : "border-red-400/30 bg-red-400/5",
        className,
      )}
    >
      <p className="text-label font-medium text-white">{title}</p>
      <p className="max-w-prose text-label leading-6 text-text-primary">{message}</p>
      {onRetry ? (
        <Button
          variant="secondary"
          onClick={onRetry}
          disabled={retryPending}
          aria-busy={retryPending}
          leadingIcon={retryPending ? <SpinnerIcon /> : undefined}
          size="table" className="self-start text-label"
        >
          {retryPending ? "Trying again…" : retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
