"use client";

import { useState, type FormEvent } from "react";
import { resetPasswordRequestSchema } from "../schemas/authSchemas";
import { AuthField } from "./AuthField";
import { AuthFormAlert } from "./AuthFormAlert";
import { AuthGradientLink } from "./AuthGradientLink";
import { AuthSubmitButton } from "./AuthSubmitButton";

type ResetPasswordFormProps = {
  errorMessage?: string | null;
  isSubmitting?: boolean;
  isSuccess?: boolean;
  onSubmit?: (newPassword: string) => void | Promise<void>;
};

export function ResetPasswordForm({
  errorMessage = null,
  isSubmitting = false,
  isSuccess = false,
  onSubmit,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: { password?: string; confirmPassword?: string } = {};

    if (password.length < 12 || password.length > 128) {
      nextErrors.password = "Password must be between 12 and 128 characters.";
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setClientErrors(nextErrors);
      return;
    }

    const parsed = resetPasswordRequestSchema
      .omit({ token: true })
      .safeParse({ new_password: password });

    if (!parsed.success) {
      setClientErrors({
        password: parsed.error.issues[0]?.message ?? "Invalid password.",
      });
      return;
    }

    setClientErrors({});
    await onSubmit?.(password);
  };

  if (isSuccess) {
    return (
      <div className="flex w-full flex-col gap-[var(--layout-auth-signup-link-gap)]">
        <AuthFormAlert variant="success" role="status">
          Your password has been reset. Sign in with your new password.
        </AuthFormAlert>
        <p className="text-center font-inter text-label leading-normal font-medium text-landing-text-heading">
          <AuthGradientLink href="/login">Go to login</AuthGradientLink>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-[var(--layout-auth-signup-link-gap)]"
      noValidate
    >
      <div className="flex flex-col gap-[var(--layout-auth-submit-gap)]">
        <div className="flex flex-col gap-[var(--layout-auth-field-group-gap)]">
          <AuthField
            label="New Password"
            required
            showRequiredIndicator={false}
            type="password"
            autoComplete="new-password"
            placeholder="Create your secure password"
            description="Use 12 to 128 characters."
            value={password}
            error={clientErrors.password ?? null}
            onChange={(event) => {
              setPassword(event.target.value);
              setClientErrors((current) => ({ ...current, password: undefined }));
            }}
          />
          <AuthField
            label="Confirm New Password"
            required
            showRequiredIndicator={false}
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            error={clientErrors.confirmPassword ?? null}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setClientErrors((current) => ({
                ...current,
                confirmPassword: undefined,
              }));
            }}
          />
        </div>

        {errorMessage ? (
          <AuthFormAlert variant="error">{errorMessage}</AuthFormAlert>
        ) : null}

        <AuthSubmitButton isSubmitting={isSubmitting}>
          {isSubmitting ? "Resetting Password..." : "Reset Password"}
        </AuthSubmitButton>
      </div>

      <p className="text-center font-inter text-label leading-normal font-medium text-landing-text-heading">
        Need a new link?{" "}
        <AuthGradientLink href="/forgot-password">
          Request another reset
        </AuthGradientLink>
      </p>
    </form>
  );
}
