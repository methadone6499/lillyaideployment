"use client";

import Link from "next/link";

import { cn } from "@/lib/cn";

import { useOperationLock } from "../hooks/useOperationLock";
import { BILLING_PATHS } from "../utils/billingConstants";
import { getOperationLockMessage } from "../utils/selectOperationLock";

type OperationLockBannerProps = {
  className?: string;
  showManagePayment?: boolean;
};

export function OperationLockBanner({
  className,
  showManagePayment = true,
}: OperationLockBannerProps) {
  const { lock } = useOperationLock();

  if (!lock) {
    return null;
  }

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-surface border border-status-running/[0.12] bg-status-running/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-label text-text-body">
        <span className="font-medium text-status-running">
          Plan update in progress.
        </span>{" "}
        {getOperationLockMessage(lock)}
      </p>
      {showManagePayment && lock.can_manage_payment ? (
        <Link
          href={BILLING_PATHS.custom}
          className="shrink-0 text-label font-medium text-brand no-underline transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Manage payment
        </Link>
      ) : null}
    </div>
  );
}
