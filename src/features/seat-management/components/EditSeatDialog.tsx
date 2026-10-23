"use client";

import { formatDisplayCount } from "@/lib/formatDisplay";

import { Button, TextField } from "@/components/ui";
import { getMaximumTopUpTarget, parseTopUpInput, TopUpErrorNotice } from "@/features/billing";
import { cn } from "@/lib/cn";
import { useState, type FormEvent } from "react";
import {
  editSeatFormSchema,
  type EditSeatFormValues,
  type Seat,
  type SeatStatus,
} from "../schemas/seatManagementSchemas";
import { SeatFormDialog } from "./SeatFormDialog";

export type SeatEditFailure = {
  field: keyof EditSeatFormValues;
  message: string;
};

type EditSeatDialogProps = {
  open: boolean;
  seat: Seat;
  isPending?: boolean;
  quotaUnallocated?: number | null;
  seatChangesLocked?: boolean;
  quotaChangesLocked?: boolean;
  additionalReports?: {
    balance: number | null;
    pool: number | null;
    canEdit: boolean;
    loading: boolean;
    error: unknown;
    onRetry: () => void;
  };
  onClose: () => void;
  onConfirm: (seat: Seat, values: EditSeatFormValues) => Promise<SeatEditFailure | null>;
  onRequestRemove?: (seat: Seat) => void;
};

function parseQuotaTotal(value: string): number | null {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function EditSeatDialog({
  open,
  seat,
  isPending = false,
  quotaUnallocated = null,
  seatChangesLocked = false,
  quotaChangesLocked = false,
  additionalReports,
  onClose,
  onConfirm,
  onRequestRemove,
}: EditSeatDialogProps) {
  const canChangeStatus =
    seat.can_manage_status && seat.status !== "removed" && !seatChangesLocked;
  const canChangeQuota =
    seat.can_manage_quota && seat.status !== "removed" && !quotaChangesLocked;
  const canChangeAdditional = additionalReports?.canEdit === true && seat.status !== "removed";
  const canSave = canChangeStatus || canChangeQuota || canChangeAdditional;
  const initialStatus: SeatStatus =
    seat.status === "disabled" ? "disabled" : "active";
  const [status, setStatus] = useState<SeatStatus>(initialStatus);
  const [quotaTotal, setQuotaTotal] = useState(
    String(seat.report_quota_total),
  );
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [additionalBalance, setAdditionalBalance] = useState<string | null>(null);
  const [additionalError, setAdditionalError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const currentAdditional = additionalReports?.balance ?? null;
  const additionalPool = additionalReports?.pool ?? null;
  const maximumAdditional = currentAdditional !== null && additionalPool !== null
    ? getMaximumTopUpTarget(currentAdditional, additionalPool, status === "active")
    : 0;
  const additionalValue = additionalBalance ?? (currentAdditional === null ? "" : String(currentAdditional));
  const parsedAdditional = parseTopUpInput(additionalValue, 0, maximumAdditional);
  const additionalChanged = additionalBalance !== null &&
    (parsedAdditional === null || parsedAdditional !== currentAdditional);
  const additionalUnavailable = additionalChanged && !canChangeAdditional;
  const additionalValidationError = additionalUnavailable
    ? "Additional report changes are unavailable. Reload balances or cancel to discard your changes."
    : canChangeAdditional && parsedAdditional === null
      ? `Enter a whole number from 0 to ${formatDisplayCount(maximumAdditional)}.`
      : null;
  const additionalInputError = additionalError ?? additionalValidationError;
  const additionalChange = parsedAdditional !== null && currentAdditional !== null
    ? parsedAdditional - currentAdditional
    : 0;
  const quotaHelper = canChangeQuota
    ? [
        `Used: ${formatDisplayCount(seat.report_quota_used)}. Set the total monthly allocation for this seat.`,
        quotaUnallocated == null
          ? null
          : `${formatDisplayCount(quotaUnallocated)} unallocated monthly reports in the company pool.`,
      ]
        .filter(Boolean)
        .join(" ")
    : `${formatDisplayCount(seat.report_quota_used)} used · ${formatDisplayCount(seat.report_quota_remaining)} remaining.`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending || !canSave || additionalValidationError) {
      return;
    }

    const parsedQuota = parseQuotaTotal(quotaTotal);

    if (parsedQuota == null) {
      setQuotaError("Enter a whole number of 0 or more.");
      setFormError(null);
      return;
    }

    if (canChangeQuota && parsedQuota !== seat.report_quota_total && parsedQuota < seat.report_quota_used) {
      setQuotaError(`The monthly quota cannot be below ${formatDisplayCount(seat.report_quota_used)} already used.`);
      return;
    }

    const result = editSeatFormSchema.safeParse({
      status,
      quota_total: parsedQuota,
      ...(canChangeAdditional && parsedAdditional !== null
        ? { additional_report_balance: parsedAdditional } : {}),
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setQuotaError(fieldErrors.quota_total?.[0] ?? null);
      setAdditionalError(fieldErrors.additional_report_balance?.[0] ?? null);
      setFormError(
        fieldErrors.status?.[0] ??
          (!fieldErrors.quota_total ? "Select a valid seat status." : null),
      );
      return;
    }

    setQuotaError(null);
    setAdditionalError(null);
    setFormError(null);
    const confirmationError = await onConfirm(seat, result.data);

    if (confirmationError) {
      if (confirmationError.field === "quota_total") {
        setQuotaError(confirmationError.message);
      } else if (confirmationError.field === "additional_report_balance") {
        setAdditionalError(confirmationError.message);
      } else {
        setFormError(confirmationError.message);
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
      confirmLabel={isPending ? "Saving…" : "Save"}
      confirmDisabled={isPending || !canSave || Boolean(additionalValidationError)}
      hideConfirm={!canSave}
      cancelLabel={canSave ? "Cancel" : "Close"}
      cancelInHeader
      footerAction={onRequestRemove && seat.can_manage && seat.status !== "removed" && !seatChangesLocked ? (
        <Button variant="destructive" disabled={isPending} onClick={() => onRequestRemove(seat)}>
          Remove seat
        </Button>
      ) : undefined}
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
            Monthly report quota
          </label>
          <TextField
            id="edit-seat-quota"
            data-autofocus
            type="number"
            inputMode="numeric"
            min={seat.report_quota_used}
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

        {additionalReports ? (
          <div className="flex flex-col gap-6">
            <label htmlFor="edit-seat-additional" className="text-label font-medium text-white">
              Additional reports
            </label>
            <div className="flex flex-col gap-2">
              <TextField
                id="edit-seat-additional"
                data-autofocus={!canChangeQuota && canChangeAdditional ? true : undefined}
                type="number"
                inputMode="numeric"
                min={0}
                max={maximumAdditional}
                step={1}
                value={additionalValue}
                placeholder={additionalReports.loading ? "Loading…" : "Unavailable"}
                readOnly={!canChangeAdditional}
                disabled={!canChangeAdditional || isPending}
                error={additionalInputError}
                onChange={(event) => {
                  setAdditionalBalance(event.target.value);
                  setAdditionalError(null);
                  setFormError(null);
                }}
                className="h-14 bg-surface-default text-label font-normal"
              />
              <p className="text-helper text-text-muted">
                Currently assigned: {formatDisplayCount(currentAdditional)} · Available company pool: {formatDisplayCount(additionalPool)}
              </p>
              <p className="text-helper text-text-muted">
                {status === "disabled"
                  ? "Disabled seats can only return unused additional reports."
                  : "Used automatically after monthly quota is exhausted. Set the remaining balance."}
              </p>
            </div>
            {additionalReports.loading ? <p role="status" className="text-helper text-text-muted">Loading report balances…</p> : null}
            <TopUpErrorNotice error={additionalReports.error} />
            {additionalReports.error || additionalUnavailable ? (
              <Button variant="secondary" size="compact" className="self-start" disabled={isPending || additionalReports.loading} onClick={() => {
                setAdditionalError(null);
                additionalReports.onRetry();
              }}>
                Reload balances
              </Button>
            ) : null}
            {!canChangeAdditional && !additionalReports.loading && !additionalReports.error ? (
              <p className="text-helper text-status-running">Allocation changes require current paid access and must not be paused.</p>
            ) : null}
            {!additionalInputError && canChangeAdditional && additionalChange !== 0 ? (
              <p role="status" aria-live="polite" className="text-helper text-brand">
                {additionalChange > 0
                  ? `Assign ${formatDisplayCount(additionalChange)} reports from the company pool.`
                  : `Return ${formatDisplayCount(-additionalChange)} unused reports to the company pool.`}
              </p>
            ) : null}
          </div>
        ) : null}

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
                      "flex h-14 cursor-pointer items-center justify-center rounded-field border text-body-lg transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand",
                      isSelected
                        ? "border-brand-chip-border bg-brand text-brand-foreground"
                        : "border-border-default bg-surface-default text-white hover:bg-surface-elevated",
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
                        setAdditionalError(null);
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

        {seatChangesLocked || quotaChangesLocked ? (
          <p className="text-helper text-status-running">
            Seat and quota changes are paused while a Custom plan payment is in
            progress.
          </p>
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
