"use client";

import { TextField } from "@/components/ui";
import { useState, type FormEvent } from "react";
import {
  addSeatFormSchema,
  type AddSeatFormValues,
} from "../schemas/seatManagementSchemas";
import { SeatFormDialog } from "./SeatFormDialog";

type InviteConfirmationError = {
  message: string;
  fieldError?: string;
};

type AddSeatDialogProps = {
  open: boolean;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: (
    values: AddSeatFormValues,
  ) => Promise<InviteConfirmationError | null>;
};

export function AddSeatDialog({
  open,
  isPending = false,
  onClose,
  onConfirm,
}: AddSeatDialogProps) {
  const [userEmail, setUserEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const result = addSeatFormSchema.safeParse({ userEmail });

    if (!result.success) {
      setEmailError(
        result.error.flatten().fieldErrors.userEmail?.[0] ??
          "Enter a valid email address.",
      );
      setFormError(null);
      return;
    }

    const confirmationError = await onConfirm(result.data);

    if (!confirmationError) {
      onClose();
      return;
    }

    if (confirmationError.fieldError) {
      setEmailError(confirmationError.fieldError);
      setFormError(null);
      return;
    }

    setFormError(confirmationError.message);
  };

  const handleClose = () => {
    if (isPending) {
      return;
    }

    onClose();
  };

  return (
    <SeatFormDialog
      open={open}
      title="Invite User"
      confirmLabel={isPending ? "Sending..." : "Send invitation"}
      confirmDisabled={isPending}
      closeDisabled={isPending}
      onClose={handleClose}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <div className="flex flex-col gap-6">
        <p className="text-label leading-relaxed text-text-body">
          Send an invitation to this email. They will join as a company seat
          user.
        </p>
        <label
          htmlFor="add-seat-email"
          className="text-label font-medium text-white"
        >
          User Email Address
        </label>
        <TextField
          id="add-seat-email"
          data-autofocus
          type="email"
          autoComplete="email"
          value={userEmail}
          placeholder="Enter the invitee's email address"
          error={emailError}
          disabled={isPending}
          onChange={(event) => {
            setUserEmail(event.target.value);
            setEmailError(null);
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
    </SeatFormDialog>
  );
}
