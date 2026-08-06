type AuthSessionUnavailableProps = {
  onRetry: () => void;
  isRetrying: boolean;
};

export function AuthSessionUnavailable({
  onRetry,
  isRetrying,
}: AuthSessionUnavailableProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface-default px-6">
      <p className="text-center text-input text-text-heading">
        Authentication is temporarily unavailable. Please try again.
      </p>
      <button
        type="button"
        className="rounded-field border border-border-default bg-surface-elevated px-4 py-2 text-label font-medium text-text-heading transition-colors hover:bg-input-fill disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onRetry}
        disabled={isRetrying}
      >
        {isRetrying ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}
