"use client";

import type { FormEvent } from "react";

import type { Seat } from "../schemas/seatManagementSchemas";
import { SeatFormDialog } from "./SeatFormDialog";

type RemoveSeatDialogProps = {
  open: boolean;
  seat: Seat;
  isPending?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: (seat: Seat) => Promise<void>;
};

export function RemoveSeatDialog({
  open,
  seat,
  isPending = false,
  errorMessage = null,
  onClose,
  onConfirm,
}: RemoveSeatDialogProps) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending) {
      return;
    }

    await onConfirm(seat);
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
      title="Remove seat"
      confirmLabel={isPending ? "Removing..." : "Remove seat"}
      confirmDisabled={isPending}
      confirmTone="danger"
      closeDisabled={isPending}
      onClose={handleClose}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <div className="flex flex-col gap-4">
        <p className="text-label leading-relaxed text-text-body">
          Remove{" "}
          <span className="font-medium text-white">{seat.full_name}</span> (
          {seat.email}) from this company? This releases the seat. Their user
          record and report history are kept.
        </p>
        {errorMessage ? (
          <p role="alert" className="text-helper text-status-running">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </SeatFormDialog>
  );
}
