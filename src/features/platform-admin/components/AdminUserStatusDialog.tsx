"use client";

import { useEffect, useId, useRef, type FormEvent } from "react";

import type { AdminUserResponse } from "../schemas/adminUserSchemas";
import { AdminRequestId } from "./AdminRequestId";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type AdminUserStatusDialogProps = {
  open: boolean;
  action: "disable" | "enable";
  user: AdminUserResponse;
  isPending: boolean;
  errorMessage?: string | null;
  requestId?: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function AdminUserStatusDialog({
  open,
  action,
  user,
  isPending,
  errorMessage,
  requestId,
  onClose,
  onConfirm,
}: AdminUserStatusDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLFormElement>(null);
  const onCloseRef = useRef(onClose);
  const isPendingRef = useRef(isPending);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      dialogRef.current
        ?.querySelector<HTMLButtonElement>("[data-autofocus]")
        ?.focus();
    });

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isPendingRef.current) onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open]);

  if (!open) return null;

  const isDisable = action === "disable";
  const isCompanyAdmin = user.access.effective_role === "company_admin";
  const verb = isDisable ? "Disable" : "Enable";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isPending) void onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose();
      }}
    >
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        className="w-full max-w-[680px] overflow-hidden rounded-button border border-border-default bg-[#171717] text-white shadow-2xl"
      >
        <header className="border-b border-border-default px-6 py-4">
          <h2 id={titleId} className="text-card-title font-medium">
            {verb} account
          </h2>
        </header>

        <div className="flex flex-col gap-4 px-6 py-6 text-label leading-relaxed text-text-body">
          <p>
            {verb} <span className="font-medium text-white">{user.full_name}</span>{" "}
            ({user.email})?
          </p>

          {isDisable ? (
            <>
              <p>
                Disabling this account immediately blocks sign-in and invalidates
                active sessions. It does not cancel subscriptions or billing,
                remove company membership, release seats or quota, delete reports,
                or change company status.
              </p>
              {isCompanyAdmin ? (
                <p className="rounded-card border border-status-running/40 bg-status-running/10 p-4 text-status-running">
                  This user is a Company Admin. Disabling the account can leave the
                  company without a functioning administrator.
                </p>
              ) : null}
            </>
          ) : (
            <p>
              Enabling restores sign-in for this verified account. It does not
              change the user&apos;s company membership, seat, quota, or subscription.
            </p>
          )}

          {errorMessage ? (
            <p role="alert" className="text-status-running">
              {errorMessage}
              <AdminRequestId requestId={requestId} />
            </p>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-border-default px-6 py-5">
          <button
            type="button"
            data-autofocus
            disabled={isPending}
            onClick={onClose}
            className="inline-flex h-[42px] items-center justify-center rounded-button border border-border-default px-[18px] text-label font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={`inline-flex h-[42px] items-center justify-center rounded-button px-[18px] text-label font-medium text-white disabled:opacity-50 ${
              isDisable ? "bg-[#d92244]" : "bg-brand"
            }`}
          >
            {isPending
              ? action === "disable"
                ? "Disabling…"
                : "Enabling…"
              : `${verb} account`}
          </button>
        </footer>
      </form>
    </div>
  );
}
