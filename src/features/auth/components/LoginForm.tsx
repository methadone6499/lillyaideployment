"use client";

import { Button } from "@/components/ui";
import { useState, type FormEvent } from "react";
import type { LoginErrorState } from "../utils/classifyLoginError";
import { AuthField } from "./AuthField";
import { AuthFormAlert } from "./AuthFormAlert";
import { AuthGradientLink } from "./AuthGradientLink";
import { AuthSubmitButton } from "./AuthSubmitButton";

type LoginFormState = {
  email: string;
  password: string;
};

type LoginFormProps = {
  errorState?: LoginErrorState;
  fieldErrors?: Partial<Record<keyof LoginFormState | "email" | "password", string>>;
  isSubmitting?: boolean;
  isResendingVerification?: boolean;
  showSignUpLink?: boolean;
  emailDescription?: string;
  onSubmit?: (values: LoginFormState) => void | Promise<void>;
  onResendVerification?: (email: string) => void | Promise<void>;
};

function mapServerFieldError(
  fieldErrors: LoginFormProps["fieldErrors"],
  field: keyof LoginFormState,
): string | null {
  return fieldErrors?.[field] ?? null;
}

export function LoginForm({
  errorState = { type: "none" },
  fieldErrors,
  isSubmitting = false,
  isResendingVerification = false,
  showSignUpLink = true,
  emailDescription,
  onSubmit,
  onResendVerification,
}: LoginFormProps) {
  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [clientErrors, setClientErrors] = useState<
    Partial<Record<keyof LoginFormState, string>>
  >({});

  const updateField = (field: keyof LoginFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setClientErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextClientErrors: Partial<Record<keyof LoginFormState, string>> = {};

    if (!form.email.trim()) {
      nextClientErrors.email = "Email is required.";
    }

    if (!form.password) {
      nextClientErrors.password = "Password is required.";
    }

    if (Object.keys(nextClientErrors).length > 0) {
      setClientErrors(nextClientErrors);
      return;
    }

    setClientErrors({});
    await onSubmit?.(form);
  };

  const resolveError = (field: keyof LoginFormState) =>
    clientErrors[field] ?? mapServerFieldError(fieldErrors, field);

  const formMessage =
    errorState.type === "invalid_credentials" ||
    errorState.type === "account_disabled" ||
    errorState.type === "retryable" ||
    errorState.type === "form"
      ? errorState.message
      : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-[var(--layout-auth-login-link-gap)]"
      noValidate
    >
      <div className="flex flex-col gap-[var(--layout-auth-submit-gap)]">
        <div className="flex flex-col gap-[var(--layout-auth-login-detail-gap)]">
          <div className="flex flex-col gap-[var(--layout-auth-field-group-gap)]">
            <AuthField
              label="Email Address"
              required
              type="email"
              autoComplete="email"
              placeholder="johndoe@example.com"
              value={form.email}
              description={emailDescription}
              error={resolveError("email") ?? fieldErrors?.email ?? null}
              onChange={(event) => updateField("email", event.target.value)}
            />
            <AuthField
              label="Password"
              required
              showRequiredIndicator={false}
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              error={resolveError("password") ?? fieldErrors?.password ?? null}
              onChange={(event) => updateField("password", event.target.value)}
            />
          </div>
          <p className="text-label leading-normal text-landing-text-heading">
            <AuthGradientLink href="/forgot-password">
              Forgot Password?
            </AuthGradientLink>
          </p>
        </div>

        {errorState.type === "email_not_verified" ? (
          <div className="flex flex-col gap-3">
            <AuthFormAlert variant="info">{errorState.message}</AuthFormAlert>
            <Button
              type="button"
              disabled={isResendingVerification}
              onClick={() => {
                void onResendVerification?.(errorState.email);
              }}
              className="!h-[var(--layout-auth-button-height)] w-full !rounded-[10.5px] border border-white/10 !bg-white/5 px-6 !text-[16px] !font-medium text-white hover:!bg-white/10"
            >
              {isResendingVerification
                ? "Sending Verification Email..."
                : "Resend Verification Email"}
            </Button>
          </div>
        ) : null}

        {formMessage ? <AuthFormAlert variant="error">{formMessage}</AuthFormAlert> : null}

        <AuthSubmitButton isSubmitting={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Login"}
        </AuthSubmitButton>
      </div>

      {showSignUpLink ? (
        <p className="text-center font-inter text-label leading-normal font-medium text-landing-text-heading">
          Don&apos;t have an account?{" "}
          <AuthGradientLink href="/signup">Sign Up</AuthGradientLink>
        </p>
      ) : null}
    </form>
  );
}
