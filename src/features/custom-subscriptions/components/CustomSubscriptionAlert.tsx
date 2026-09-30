"use client";

import type { ReactNode } from "react";

import { AuthFormAlert } from "@/features/auth";
import { BillingRequestId } from "@/features/billing";

import type { ClassifiedCustomSubscriptionError } from "../utils/classifyCustomSubscriptionError";

type CustomSubscriptionAlertProps = {
  classified: ClassifiedCustomSubscriptionError | null;
  variant?: "error" | "info";
  children?: ReactNode;
};

export function CustomSubscriptionAlert({
  classified,
  variant = "error",
  children,
}: CustomSubscriptionAlertProps) {
  if (!classified || classified.kind === "aborted" || !classified.message) {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <AuthFormAlert variant={variant} className="text-left">
        {classified.message}
      </AuthFormAlert>
      {children}
      {classified.showRequestId ? (
        <BillingRequestId requestId={classified.requestId} />
      ) : null}
    </div>
  );
}
