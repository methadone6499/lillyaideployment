export function AuthSessionLoading() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-surface-default"
      role="status"
      aria-live="polite"
      aria-label="Loading session"
    >
      <p className="text-input text-text-muted">Loading…</p>
    </div>
  );
}
