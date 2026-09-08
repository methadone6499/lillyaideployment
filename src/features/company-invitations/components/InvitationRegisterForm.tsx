"use client";

import { useState, type FormEvent } from "react";

import {
  AuthField,
  AuthFormAlert,
  AuthSubmitButton,
} from "@/features/auth";

type InvitationRegisterFormState = {
  fullName: string;
  password: string;
  confirmPassword: string;
};

type InvitationRegisterFormProps = {
  formError?: string | null;
  fieldErrors?: Partial<Record<"full_name" | "password", string>>;
  isSubmitting?: boolean;
  onSubmit?: (values: { full_name: string; password: string }) => void | Promise<void>;
};

export function InvitationRegisterForm({
  formError = null,
  fieldErrors,
  isSubmitting = false,
  onSubmit,
}: InvitationRegisterFormProps) {
  const [form, setForm] = useState<InvitationRegisterFormState>({
    fullName: "",
    password: "",
    confirmPassword: "",
  });
  const [clientErrors, setClientErrors] = useState<
    Partial<Record<keyof InvitationRegisterFormState, string>>
  >({});

  const updateField = (
    field: keyof InvitationRegisterFormState,
    value: string,
  ) => {
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

    const nextClientErrors: Partial<
      Record<keyof InvitationRegisterFormState, string>
    > = {};

    if (!form.fullName.trim()) {
      nextClientErrors.fullName = "Full name is required.";
    } else if (form.fullName.trim().length > 200) {
      nextClientErrors.fullName = "Full name must be 200 characters or fewer.";
    }

    if (form.password.length < 12 || form.password.length > 128) {
      nextClientErrors.password =
        "Password must be between 12 and 128 characters.";
    }

    if (form.password !== form.confirmPassword) {
      nextClientErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(nextClientErrors).length > 0) {
      setClientErrors(nextClientErrors);
      return;
    }

    setClientErrors({});
    await onSubmit?.({
      full_name: form.fullName.trim(),
      password: form.password,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-[var(--layout-auth-signup-link-gap)]"
      noValidate
    >
      <div className="flex flex-col gap-[var(--layout-auth-submit-gap)]">
        <div className="flex flex-col gap-[var(--layout-auth-field-group-gap)]">
          <AuthField
            label="Full Name"
            required
            autoComplete="name"
            placeholder="John Doe"
            value={form.fullName}
            error={clientErrors.fullName ?? fieldErrors?.full_name ?? null}
            onChange={(event) => updateField("fullName", event.target.value)}
          />
          <AuthField
            label="Password"
            required
            showRequiredIndicator={false}
            type="password"
            autoComplete="new-password"
            placeholder="Create your secure password"
            description="Use 12 to 128 characters."
            value={form.password}
            error={clientErrors.password ?? fieldErrors?.password ?? null}
            onChange={(event) => updateField("password", event.target.value)}
          />
          <AuthField
            label="Confirm Password"
            required
            showRequiredIndicator={false}
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            error={clientErrors.confirmPassword ?? null}
            onChange={(event) =>
              updateField("confirmPassword", event.target.value)
            }
          />
        </div>

        {formError ? <AuthFormAlert variant="error">{formError}</AuthFormAlert> : null}

        <AuthSubmitButton isSubmitting={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </AuthSubmitButton>
      </div>
    </form>
  );
}
