"use client";

import { TextField } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useState, type FormEvent } from "react";
import {
  editSeatFormSchema,
  type CompanySeat,
  type EditSeatFormValues,
  type SeatStatus,
} from "../schemas/seatManagementSchemas";
import { SeatFormDialog } from "./SeatFormDialog";

type EditSeatDialogProps = {
  open: boolean;
  seat: CompanySeat;
  onClose: () => void;
  onConfirm: (
    seatId: string,
    values: EditSeatFormValues,
  ) => string | null;
};

export function EditSeatDialog({
  open,
  seat,
  onClose,
  onConfirm,
}: EditSeatDialogProps) {
  const [userEmail, setUserEmail] = useState(seat.userEmail);
  const [reportQuota, setReportQuota] = useState(String(seat.reportQuota));
  const [status, setStatus] = useState<SeatStatus>(seat.status);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = editSeatFormSchema.safeParse({
      userEmail,
      reportQuota,
      usedReports: seat.usedReports,
      status,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setEmailError(fieldErrors.userEmail?.[0] ?? null);
      setQuotaError(fieldErrors.reportQuota?.[0] ?? null);
      return;
    }

    const confirmationError = onConfirm(seat.id, result.data);

    if (confirmationError) {
      setEmailError(confirmationError);
      return;
    }

    onClose();
  };

  return (
    <SeatFormDialog
      open={open}
      title="Edit Company Seat"
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-6">
          <label
            htmlFor="edit-seat-email"
            className="text-label font-medium text-white"
          >
            Email Address
          </label>
          <TextField
            id="edit-seat-email"
            data-autofocus
            type="email"
            autoComplete="email"
            value={userEmail}
            placeholder="e.g. john.doe@company.com"
            error={emailError}
            onChange={(event) => {
              setUserEmail(event.target.value);
              setEmailError(null);
            }}
            className="h-14 bg-surface-default text-label font-normal placeholder:text-text-body"
          />
        </div>

        <div className="flex flex-col gap-6">
          <label
            htmlFor="edit-seat-quota"
            className="text-label font-medium text-white"
          >
            Reports Quota
          </label>
          <TextField
            id="edit-seat-quota"
            type="number"
            inputMode="numeric"
            min={seat.usedReports}
            step={1}
            value={reportQuota}
            placeholder="e.g. 500"
            error={quotaError}
            onChange={(event) => {
              setReportQuota(event.target.value);
              setQuotaError(null);
            }}
            className="h-14 bg-surface-default text-label font-normal placeholder:text-text-body"
          />
        </div>

        <fieldset className="flex flex-col gap-6">
          <legend className="text-label font-medium text-white">Status</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {([
              ["active", "Active"],
              ["disabled", "Disable"],
            ] as const).map(([value, label]) => {
              const isSelected = status === value;

              return (
                <label
                  key={value}
                  className={cn(
                    "flex h-14 cursor-pointer items-center justify-center rounded-card border text-body-lg text-white transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand",
                    isSelected
                      ? "border-brand-chip-border bg-brand"
                      : "border-border-default bg-surface-default hover:bg-surface-elevated",
                  )}
                >
                  <input
                    type="radio"
                    name="seat-status"
                    value={value}
                    checked={isSelected}
                    onChange={() => setStatus(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </SeatFormDialog>
  );
}
