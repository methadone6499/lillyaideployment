"use client";

import { TextField } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useState, type FormEvent } from "react";
import {
  editSeatFormSchema,
  type EditSeatFormValues,
  type Seat,
  type SeatStatus,
} from "../schemas/seatManagementSchemas";
import { SeatFormDialog } from "./SeatFormDialog";

type EditSeatDialogProps = {
  open: boolean;
  seat: Seat;
  isPending?: boolean;
  quotaUnallocated?: number | null;
  onClose: () => void;
  onConfirm: (seat: Seat, values: EditSeatFormValues) => Promise<string | null>;
  onRequestRemove?: (seat: Seat) => void;
};

function parseQuotaTotal(value: string): number | null {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function EditSeatDialog({
  open,
  seat,
  isPending = false,
  quotaUnallocated = null,
  onClose,
  onConfirm,
  onRequestRemove,
}: EditSeatDialogProps) {
  const canChangeStatus =
    seat.can_manage_status && seat.status !== "removed";
  const canChangeQuota = seat.can_manage_quota && seat.status !== "removed";
  const canSave = canChangeStatus || canChangeQuota;
  const initialStatus: SeatStatus =
    seat.status === "disabled" ? "disabled" : "active";
  const [status, setStatus] = useState<SeatStatus>(initialStatus);
  const [quotaTotal, setQuotaTotal] = useState(
    String(seat.report_quota_total),
  );
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const quotaHelper = canChangeQuota
    ? [
        `Used: ${seat.report_quota_used}. Set the absolute report total for this seat.`,
        quotaUnallocated == null
          ? null
          : `${quotaUnallocated} unallocated in the company pool.`,
      ]
        .filter(Boolean)
        .join(" ")
    : `${seat.report_quota_used} used · ${seat.report_quota_remaining} remaining.`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending || !canSave) {
      return;
    }

    const parsedQuota = parseQuotaTotal(quotaTotal);

    if (parsedQuota == null) {
      setQuotaError("Enter a whole number of 0 or more.");
      setFormError(null);
      return;
    }

    const result = editSeatFormSchema.safeParse({
      status,
      quota_total: parsedQuota,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setQuotaError(fieldErrors.quota_total?.[0] ?? null);
      setFormError(
        fieldErrors.status?.[0] ??
          (!fieldErrors.quota_total ? "Select a valid seat status." : null),
      );
      return;
    }

    const confirmationError = await onConfirm(seat, result.data);

    if (confirmationError) {
      if (canChangeQuota && parsedQuota !== seat.report_quota_total) {
        setQuotaError(confirmationError);
        setFormError(null);
      } else {
        setFormError(confirmationError);
      }
    }
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
      title="Company Seat"
      confirmLabel="Save"
      confirmDisabled={isPending || !canSave}
      hideConfirm={!canSave}
      cancelLabel={canSave ? "Cancel" : "Close"}
      closeDisabled={isPending}
      onClose={handleClose}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-6">
          <label
            htmlFor="edit-seat-name"
            className="text-label font-medium text-white"
          >
            User Name
          </label>
          <TextField
            id="edit-seat-name"
            value={seat.full_name}
            readOnly
            disabled
            className="h-14 bg-surface-default text-label font-normal"
          />
        </div>

        <div className="flex flex-col gap-6">
          <label
            htmlFor="edit-seat-email"
            className="text-label font-medium text-white"
          >
            Email Address
          </label>
          <TextField
            id="edit-seat-email"
            type="email"
            value={seat.email}
            readOnly
            disabled
            className="h-14 bg-surface-default text-label font-normal"
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
            data-autofocus
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={quotaTotal}
            readOnly={!canChangeQuota}
            disabled={!canChangeQuota || isPending}
            error={quotaError}
            helper={quotaError ? undefined : quotaHelper}
            onChange={(event) => {
              setQuotaTotal(event.target.value);
              setQuotaError(null);
              setFormError(null);
            }}
            className="h-14 bg-surface-default text-label font-normal"
          />
        </div>

        {canChangeStatus ? (
          <fieldset className="flex flex-col gap-6">
            <legend className="text-label font-medium text-white">
              Status
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(
                [
                  ["active", "Active"],
                  ["disabled", "Disable"],
                ] as const
              ).map(([value, label]) => {
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
                      disabled={isPending}
                      onChange={() => {
                        setStatus(value);
                        setFormError(null);
                      }}
                      className="sr-only"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <p className="text-label text-text-body">
            Status:{" "}
            {seat.status === "active"
              ? "Active"
              : seat.status === "disabled"
                ? "Disabled"
                : "Removed"}
          </p>
        )}

        {onRequestRemove && seat.can_manage && seat.status !== "removed" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => onRequestRemove(seat)}
            className="self-start text-label font-medium text-[#d92244] transition-colors hover:text-[#fb4141] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d92244] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remove seat
          </button>
        ) : null}

        {formError ? (
          <p role="alert" className="text-helper text-status-running">
            {formError}
          </p>
        ) : null}
      </div>
    </SeatFormDialog>
  );
}
