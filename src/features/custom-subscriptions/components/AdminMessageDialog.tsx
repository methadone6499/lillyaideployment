"use client";

import { useState, type ReactNode } from "react";

import { CUSTOM_TEXT_MAX_LENGTH } from "../schemas/customSubscriptionSchemas";
import { CustomSubscriptionDialog } from "./CustomSubscriptionDialog";
import { CustomTextArea } from "./CustomTextArea";

type AdminMessageDialogProps = {
  title: string;
  label: string;
  description: ReactNode;
  confirmLabel: string;
  confirmTone?: "brand" | "danger";
  requiredMessage: string;
  isPending: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: (message: string) => void;
};

/** Collects one required, customer-visible message (action required, close reason). */
export function AdminMessageDialog({
  title,
  label,
  description,
  confirmLabel,
  confirmTone = "brand",
  requiredMessage,
  isPending,
  errorMessage,
  onClose,
  onConfirm,
}: AdminMessageDialogProps) {
  const [message, setMessage] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  return (
    <CustomSubscriptionDialog
      open
      title={title}
      confirmLabel={confirmLabel}
      confirmTone={confirmTone}
      confirmDisabled={isPending}
      closeDisabled={isPending}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();

        if (isPending) {
          return;
        }

        const trimmed = message.trim();
        if (!trimmed) {
          setFieldError(requiredMessage);
          return;
        }

        setFieldError(null);
        onConfirm(trimmed);
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="text-label leading-relaxed text-text-body">
          {description}
        </div>
        <CustomTextArea
          label={label}
          required
          maxLength={CUSTOM_TEXT_MAX_LENGTH}
          value={message}
          error={fieldError}
          disabled={isPending}
          data-autofocus
          onChange={(event) => {
            setMessage(event.target.value);
            setFieldError(null);
          }}
        />
        {errorMessage ? (
          <p role="alert" className="text-helper text-status-running">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </CustomSubscriptionDialog>
  );
}
