"use client";

import { AuthFormAlert } from "@/features/auth";

import type { ClassifiedBillingError } from "../utils/classifyBillingError";
import { BillingRequestId } from "./BillingRequestId";

type BillingFlowAlertProps = {
  classified: ClassifiedBillingError | null;
  variant?: "error" | "info";
};

export function BillingFlowAlert({
  classified,
  variant = "error",
}: BillingFlowAlertProps) {
  if (!classified || classified.kind === "aborted" || !classified.message) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <AuthFormAlert variant={variant}>{classified.message}</AuthFormAlert>
      {classified.showRequestId ? (
        <BillingRequestId requestId={classified.requestId} />
      ) : null}
    </div>
  );
}
