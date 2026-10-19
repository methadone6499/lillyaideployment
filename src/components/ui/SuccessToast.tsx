"use client";

import { CloseIcon } from "./icons";

type SuccessToastProps = {
  message: string | null;
  onDismiss: () => void;
};

export function SuccessToast({ message, onDismiss }: SuccessToastProps) {
  return (
    <div className={message ? "fixed right-4 bottom-4 left-4 z-[80] flex items-center gap-4 rounded-surface border border-border-default bg-[#171717] p-4 font-[family-name:var(--font-inter)] shadow-lg sm:left-auto sm:max-w-md" : "sr-only"}>
      <p role="status" aria-live="polite" aria-atomic="true" className="min-w-0 flex-1 break-words text-label text-status-success">
        {message}
      </p>
      {message ? <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss success message"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-field text-text-muted hover:bg-surface-elevated hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <CloseIcon className="size-5" />
      </button> : null}
    </div>
  );
}
