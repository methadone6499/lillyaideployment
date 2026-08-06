"use client";

import { useState, type FormEvent } from "react";
import { AuthField } from "./AuthField";
import { AuthFormAlert } from "./AuthFormAlert";
import { AuthGradientLink } from "./AuthGradientLink";
import { AuthSubmitButton } from "./AuthSubmitButton";

type CheckEmailFormProps = {
  initialEmail?: string | null;
  successMessage?: string | null;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  isCoolingDown?: boolean;
  secondsRemaining?: number;
  onSubmit?: (email: string) => void | Promise<void>;
};

export function CheckEmailForm({
  initialEmail = "",
  successMessage = null,
  errorMessage = null,
  isSubmitting = false,
  isCoolingDown = false,
  secondsRemaining = 0,
  onSubmit,
}: CheckEmailFormProps) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [clientError, setClientError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setClientError("Email is required.");
      return;
    }

    setClientError(null);
    await onSubmit?.(trimmedEmail);
  };

  return (
    <div className="flex w-full flex-col gap-[var(--layout-auth-signup-link-gap)]">
      <AuthFormAlert variant="info" role="status">
        We sent a verification link to your email address. Open the link to
        activate your account before signing in.
      </AuthFormAlert>

      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-[var(--layout-auth-submit-gap)]"
        noValidate
      >
        <AuthField
          label="Email Address"
          required
          type="email"
          autoComplete="email"
          placeholder="john@email.com"
          value={email}
          error={clientError}
          onChange={(event) => {
            setEmail(event.target.value);
            setClientError(null);
          }}
        />

        {successMessage ? (
          <AuthFormAlert variant="success" role="status">
            {successMessage}
          </AuthFormAlert>
        ) : null}

        {errorMessage ? (
          <AuthFormAlert variant="error">{errorMessage}</AuthFormAlert>
        ) : null}

        <AuthSubmitButton isSubmitting={isSubmitting || isCoolingDown}>
          {isSubmitting
            ? "Sending..."
            : isCoolingDown
              ? `Resend available in ${secondsRemaining}s`
              : "Resend Verification Email"}
        </AuthSubmitButton>
      </form>

      <p className="text-center font-inter text-label leading-normal font-medium text-landing-text-heading">
        Used the wrong email?{" "}
        <AuthGradientLink href="/signup">Go back to signup</AuthGradientLink>
      </p>

      <p className="text-center font-inter text-label leading-normal font-medium text-landing-text-heading">
        Already verified?{" "}
        <AuthGradientLink href="/login">Sign in</AuthGradientLink>
      </p>
    </div>
  );
}
