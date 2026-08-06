"use client";

import { Button } from "@/components/ui";

import { AuthFormAlert } from "./AuthFormAlert";
import { AuthGradientLink } from "./AuthGradientLink";

type DuplicateEmailRecoveryProps = {
  email: string;
  successMessage?: string | null;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  isCoolingDown?: boolean;
  secondsRemaining?: number;
  onResendVerification?: () => void | Promise<void>;
  onUseDifferentEmail?: () => void;
};

export function DuplicateEmailRecovery({
  email,
  successMessage = null,
  errorMessage = null,
  isSubmitting = false,
  isCoolingDown = false,
  secondsRemaining = 0,
  onResendVerification,
  onUseDifferentEmail,
}: DuplicateEmailRecoveryProps) {
  const isResendDisabled = isSubmitting || isCoolingDown;

  return (
    <div className="flex w-full flex-col gap-[var(--layout-auth-submit-gap)]">
      <AuthFormAlert variant="info" role="status">
        An account with {email} already exists. If it is still awaiting
        verification, request a new verification link below.
      </AuthFormAlert>

      {successMessage ? (
        <AuthFormAlert variant="success" role="status">
          {successMessage}
        </AuthFormAlert>
      ) : null}

      {errorMessage ? (
        <AuthFormAlert variant="error">{errorMessage}</AuthFormAlert>
      ) : null}

      <Button
        type="button"
        disabled={isResendDisabled}
        onClick={() => {
          void onResendVerification?.();
        }}
        className="!h-[var(--layout-auth-button-height)] w-full !rounded-[10.5px] border-[1.75px] border-[rgba(1,176,89,0.72)] !bg-landing-emerald-gradient px-6 !text-[16px] !font-medium text-white shadow-landing-emerald-glow hover:!bg-landing-emerald-gradient hover:!opacity-95"
      >
        {isSubmitting
          ? "Sending Verification Email..."
          : isCoolingDown
            ? `Resend available in ${secondsRemaining}s`
            : "Resend Verification Email"}
      </Button>

      <p className="text-center font-inter text-label leading-normal font-medium text-landing-text-heading">
        Already verified? <AuthGradientLink href="/login">Sign in</AuthGradientLink>
      </p>

      <button
        type="button"
        onClick={onUseDifferentEmail}
        className="text-center font-inter text-label leading-normal font-medium text-landing-text-heading underline decoration-white/40 underline-offset-2 transition-colors hover:text-white"
      >
        Use a different email
      </button>
    </div>
  );
}
