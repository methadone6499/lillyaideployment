"use client";

import { useState, type FormEvent } from "react";
import { AuthField } from "./AuthField";
import { AuthFormAlert } from "./AuthFormAlert";
import { AuthGradientLink } from "./AuthGradientLink";
import { AuthSubmitButton } from "./AuthSubmitButton";

type ForgotPasswordFormProps = {
  successMessage?: string | null;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onSubmit?: (email: string) => void | Promise<void>;
};

export function ForgotPasswordForm({
  successMessage = null,
  errorMessage = null,
  isSubmitting = false,
  onSubmit,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
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
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-[var(--layout-auth-signup-link-gap)]"
      noValidate
    >
      <AuthFormAlert variant="info" role="status">
        Enter the email associated with your account and we&apos;ll send reset
        instructions if an account exists.
      </AuthFormAlert>

      <div className="flex flex-col gap-[var(--layout-auth-submit-gap)]">
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

        <AuthSubmitButton isSubmitting={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </AuthSubmitButton>
      </div>

      <p className="text-center font-inter text-label leading-normal font-medium text-landing-text-heading">
        Remembered your password?{" "}
        <AuthGradientLink href="/login">Back to login</AuthGradientLink>
      </p>
    </form>
  );
}
