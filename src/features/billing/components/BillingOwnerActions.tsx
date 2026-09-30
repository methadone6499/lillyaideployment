"use client";

import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";

import { Button, CloseIcon, TextField } from "@/components/ui";

import { companyNameSchema } from "../schemas/billingSchemas";
import type { BillingOwnerCapabilities } from "../utils/selectBillingCapabilities";

type BillingOwnerActionsProps = {
  capabilities: BillingOwnerCapabilities;
  institutionName: string;
  disabled: boolean;
  companyNameError: string | null;
  isUpgradePending: boolean;
  feedback?: ReactNode;
  onUpgrade: (companyName: string) => void;
  onCancel: () => void;
  onCompanyNameChange?: () => void;
};

export function BillingOwnerActions({
  capabilities,
  institutionName,
  disabled,
  companyNameError,
  isUpgradePending,
  feedback,
  onUpgrade,
  onCancel,
  onCompanyNameChange,
}: BillingOwnerActionsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [companyName, setCompanyName] = useState(institutionName);
  const [localCompanyNameError, setLocalCompanyNameError] = useState<
    string | null
  >(null);
  const companyError = localCompanyNameError ?? companyNameError;
  const isBusy = disabled || isUpgradePending;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!capabilities.canUpgradeToEnterprise || !dialog) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;

    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [capabilities.canUpgradeToEnterprise]);

  if (!capabilities.canUpgradeToEnterprise) {
    return null;
  }

  const handleUpgrade = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) {
      return;
    }

    const parsed = companyNameSchema.safeParse(companyName);
    if (!parsed.success) {
      setLocalCompanyNameError(
        parsed.error.issues[0]?.message ??
          "Enter a company name between 1 and 200 characters.",
      );
      return;
    }

    setLocalCompanyNameError(null);
    onUpgrade(parsed.data);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="billing-owner-heading"
      aria-describedby="billing-owner-description"
      aria-busy={isBusy}
      tabIndex={-1}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-button border border-border-default bg-[#171717] p-6 font-[family-name:var(--font-inter)] text-white shadow-2xl backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        if (!isBusy) {
          onCancel();
        }
      }}
      onMouseDown={(event) => {
        if (isBusy || event.target !== event.currentTarget) {
          return;
        }

        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          onCancel();
        }
      }}
    >
      <header className="flex items-center justify-between gap-4">
        <h2
          id="billing-owner-heading"
          className="text-card-title font-medium text-white"
        >
          Upgrade to Enterprise
        </h2>
        <button
          type="button"
          aria-label="Close Enterprise upgrade"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-card text-text-muted transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isBusy}
          onClick={onCancel}
        >
          <CloseIcon />
        </button>
      </header>
      <p
        id="billing-owner-description"
        className="mt-4 text-input text-text-muted"
      >
        Confirm your company name for 10 seats and 100 monthly company reports.
        Stripe calculates any amount due.
      </p>
      {feedback ? <div className="mt-4">{feedback}</div> : null}
      <form
        className="mt-6 flex flex-col gap-4"
        noValidate
        onSubmit={handleUpgrade}
      >
        <TextField
          label="Company name"
          autoFocus
          required
          autoComplete="organization"
          maxLength={200}
          value={companyName}
          error={companyError}
          placeholder="Example Pharma"
          disabled={isBusy}
          onChange={(event) => {
            setCompanyName(event.target.value);
            setLocalCompanyNameError(null);
            onCompanyNameChange?.();
          }}
        />
        <Button type="submit" className="h-12 text-label" disabled={isBusy}>
          {isUpgradePending ? "Starting upgrade..." : "Upgrade to Enterprise"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-label"
          disabled={isBusy}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </form>
    </dialog>
  );
}
