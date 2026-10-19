"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";
export function ModalDialog({ title, children, busy = false, onClose }: {
  title: string;
  children: ReactNode;
  busy?: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog)
      return;
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (focused?.isConnected)
        focused.focus();
    };
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId} aria-busy={busy} className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-3xl overflow-y-auto rounded-surface border border-border-default bg-[#171717] p-6 font-[family-name:var(--font-inter)] text-white shadow-2xl backdrop:bg-black/60" onCancel={(event) => {
    event.preventDefault(); if (!busy)
      onClose();
  }}>
    <header className="flex items-start justify-between gap-4 border-b border-border-default pb-4">
      <h2 id={titleId} className="text-card-title font-medium">{title}</h2>
      <Button variant="secondary" size="compact" disabled={busy} onClick={onClose}>Close</Button>
    </header>
    <div className="mt-5">{children}</div>
  </dialog>;
}
