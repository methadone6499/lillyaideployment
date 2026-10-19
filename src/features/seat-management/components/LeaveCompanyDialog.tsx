"use client";

import { Button } from "@/components/ui";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { ApiRequestError } from "@/services/ApiRequestError";

import { useLeaveCompany } from "../hooks/useLeaveCompany";

type LeaveCompanyDialogProps = {
  companyName?: string;
  onClose: () => void;
  onCannotLeave?: () => void;
};

export function LeaveCompanyDialog({
  companyName,
  onClose,
  onCannotLeave,
}: LeaveCompanyDialogProps) {
  const mutation = useLeaveCompany();
  const error = mutation.error instanceof ApiRequestError ? mutation.error : null;
  const cannotLeave = error?.code === "company_admin_cannot_leave";
  const message = cannotLeave
    ? "Company administrators must transfer ownership before leaving."
    : error?.code === "custom_subscription_payment_in_progress"
      ? "Leaving is temporarily blocked while a Custom plan payment is in progress. Try again after the payment completes or is cancelled."
      : error?.code === "seat_not_found"
        ? "Your company membership is unavailable. Refresh your account or contact support."
        : error?.message ??
          (mutation.error instanceof Error
            ? mutation.error.message
            : "Unable to leave the company. Please retry.");

  const confirm = async () => {
    if (mutation.isLeaving || cannotLeave) {
      return;
    }

    try {
      await mutation.mutateAsync();
      onClose();
    } catch (failure) {
      if (
        failure instanceof ApiRequestError &&
        failure.code === "company_admin_cannot_leave" &&
        onCannotLeave
      ) {
        onCannotLeave();
        onClose();
      }
    }
  };

  return (
    <ModalDialog
      title={companyName ? `Leave ${companyName}?` : "Leave company?"}
      busy={mutation.isLeaving}
      onClose={onClose}
    >
      <p className="text-label leading-relaxed text-text-body">
        You will immediately lose access to this company&apos;s workspace and
        company reports. Your personal account will remain active. You will need
        a new invitation from a company administrator to rejoin.
      </p>
      {mutation.isError ? (
        <div role="alert" className="mt-4 text-label text-status-running">
          <p>{message}</p>
          {error?.requestId ? (
            <p className="mt-2 break-all text-helper">Reference: {error.requestId}</p>
          ) : null}
        </div>
      ) : null}
      <footer className="mt-6 flex flex-wrap justify-end gap-3">
        <Button
          data-autofocus
          variant="secondary"
          disabled={mutation.isLeaving}
          onClick={onClose}
        >
          Stay in company
        </Button>
        <Button
          variant="destructiveSolid"
          disabled={mutation.isLeaving || cannotLeave}
          onClick={() => void confirm()}
        >
          {mutation.isLeaving ? "Leaving…" : "Leave company"}
        </Button>
      </footer>
    </ModalDialog>
  );
}
