"use client";

import type { FormEvent } from "react";

import type { Invitation } from "@/features/company-invitations";

import { SeatFormDialog } from "./SeatFormDialog";

type RevokeInvitationDialogProps = {
  open: boolean;
  invitation: Invitation;
  isPending?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: (invitation: Invitation) => Promise<void>;
};

export function RevokeInvitationDialog({
  open,
  invitation,
  isPending = false,
  errorMessage = null,
  onClose,
  onConfirm,
}: RevokeInvitationDialogProps) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending) {
      return;
    }

    await onConfirm(invitation);
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
      title="Revoke invitation"
      confirmLabel={isPending ? "Revoking..." : "Revoke invitation"}
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
          Revoke the invitation for{" "}
          <span className="font-medium text-white">{invitation.email}</span>?
          This frees the reserved seat. They will no longer be able to accept
          this invite.
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
