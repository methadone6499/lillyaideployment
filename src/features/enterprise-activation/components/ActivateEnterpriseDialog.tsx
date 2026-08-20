"use client";

import { TextField } from "@/components/ui";
import { refetchAuthMe, useAuthUser } from "@/features/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { enterpriseActivationQueryKeys } from "../api/enterpriseActivationQueryKeys";
import { useActivateEnterpriseMutation } from "../hooks/useActivateEnterpriseMutation";
import { enterpriseActivationRequestSchema } from "../schemas/enterpriseActivationSchemas";
import { classifyEnterpriseActivationError } from "../utils/classifyEnterpriseActivationError";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const COMPANY_HOME_PATH = "/company-admin/dashboard";
const SESSION_REFRESH_FAILED_MESSAGE =
  "Enterprise was activated, but we could not refresh your session. Please reload the page.";

type ActivateEnterpriseDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function ActivateEnterpriseDialog({
  open,
  onClose,
}: ActivateEnterpriseDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLFormElement>(null);
  const onCloseRef = useRef(onClose);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useAuthUser();
  const mutation = useActivateEnterpriseMutation();
  const [companyName, setCompanyName] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const isPending = mutation.isPending;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

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
      const initialField =
        dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]");
      initialField?.focus();
    });

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!isPending) {
          onCloseRef.current();
        }

        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;

      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [open, isPending]);

  const handleClose = () => {
    if (isPending) {
      return;
    }

    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending) {
      return;
    }

    setFieldError(null);
    setFormError(null);

    const parsed = enterpriseActivationRequestSchema.safeParse({
      company_name: companyName,
    });

    if (!parsed.success) {
      setFieldError(
        parsed.error.flatten().fieldErrors.company_name?.[0] ??
          "Enter a company name between 1 and 200 characters.",
      );
      return;
    }

    let activationSucceeded = false;

    try {
      const snapshot = await mutation.mutateAsync(parsed.data);
      activationSucceeded = true;

      if (userId) {
        queryClient.setQueryDefaults(enterpriseActivationQueryKeys.root, {
          staleTime: Number.POSITIVE_INFINITY,
          gcTime: Number.POSITIVE_INFINITY,
        });
        queryClient.setQueryData(
          enterpriseActivationQueryKeys.snapshot(userId),
          snapshot,
        );
      }

      await refetchAuthMe();
      router.push(COMPANY_HOME_PATH);
    } catch (error) {
      if (activationSucceeded) {
        setFormError(SESSION_REFRESH_FAILED_MESSAGE);
        return;
      }

      const classified = classifyEnterpriseActivationError(error);
      setFieldError(classified.fieldError ?? null);
      setFormError(classified.fieldError ? null : classified.message);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        noValidate
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[640px] flex-col overflow-hidden rounded-button border border-border-default bg-[#171717] font-[family-name:var(--font-inter)] text-white shadow-2xl"
      >
        <header className="flex min-h-[58px] shrink-0 items-center border-b border-border-default px-6 py-4">
          <h2 id={titleId} className="text-card-title font-medium text-white">
            Activate Enterprise
          </h2>
        </header>

        <div className="flex min-h-0 flex-col gap-6 overflow-y-auto px-6 py-6 sm:px-7">
          <p className="text-input text-text-body">
            Enter your company name to create a company workspace. You will
            become the company admin.
          </p>
          <TextField
            id="activate-enterprise-company-name"
            data-autofocus
            label="Company name"
            autoComplete="organization"
            maxLength={200}
            value={companyName}
            placeholder="Example Pharma"
            error={fieldError}
            onChange={(event) => {
              setCompanyName(event.target.value);
              setFieldError(null);
              setFormError(null);
            }}
            className="h-14 bg-surface-default text-label font-normal placeholder:text-text-body"
          />
          {formError ? (
            <p role="alert" className="text-helper text-status-running">
              {formError}
            </p>
          ) : null}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-border-default px-6 py-5 sm:px-7">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="inline-flex h-[42px] items-center justify-center rounded-button border border-border-default bg-white/[0.04] px-[18px] text-label font-medium text-white/72 transition-colors hover:bg-surface-default hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-[42px] items-center justify-center rounded-button bg-brand px-[18px] text-label font-medium text-white transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Activating..." : "Activate Enterprise"}
          </button>
        </footer>
      </form>
    </div>
  );
}
