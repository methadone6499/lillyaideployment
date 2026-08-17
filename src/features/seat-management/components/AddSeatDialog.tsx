"use client";

import { TextField } from "@/components/ui";
import { useState, type FormEvent } from "react";
import {
  addSeatFormSchema,
  type AddSeatFormValues,
} from "../schemas/seatManagementSchemas";
import { SeatFormDialog } from "./SeatFormDialog";

type AddSeatDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (values: AddSeatFormValues) => string | null;
};

export function AddSeatDialog({
  open,
  onClose,
  onConfirm,
}: AddSeatDialogProps) {
  const [userEmail, setUserEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = addSeatFormSchema.safeParse({ userEmail });

    if (!result.success) {
      setEmailError(
        result.error.flatten().fieldErrors.userEmail?.[0] ??
          "Enter a valid company email address.",
      );
      return;
    }

    const confirmationError = onConfirm(result.data);

    if (confirmationError) {
      setEmailError(confirmationError);
      return;
    }

    onClose();
  };

  return (
    <SeatFormDialog
      open={open}
      title="Add Seat"
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-6">
        <label htmlFor="add-seat-email" className="text-label font-medium text-white">
          User Email Address
        </label>
        <TextField
          id="add-seat-email"
          data-autofocus
          type="email"
          autoComplete="email"
          value={userEmail}
          placeholder="Enter your email address"
          error={emailError}
          onChange={(event) => {
            setUserEmail(event.target.value);
            setEmailError(null);
          }}
          className="h-14 bg-surface-default text-label font-normal placeholder:text-text-body"
        />
      </div>
    </SeatFormDialog>
  );
}
