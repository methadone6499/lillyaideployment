"use client";

import { useState, type FormEvent } from "react";
import { signupRequestSchema } from "../schemas/authSchemas";
import { AuthField } from "./AuthField";
import { AuthFormAlert } from "./AuthFormAlert";
import { AuthGradientLink } from "./AuthGradientLink";
import { AuthSubmitButton } from "./AuthSubmitButton";

type SignupFormState = {
  fullName: string;
  institutionName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type SignupFormProps = {
  formError?: string | null;
  fieldErrors?: Partial<Record<keyof SignupFormState | "full_name" | "institution_name", string>>;
  isSubmitting?: boolean;
  onSubmit?: (values: {
    full_name: string;
    institution_name: string;
    email: string;
    password: string;
  }) => void | Promise<void>;
};

function mapServerFieldError(
  fieldErrors: SignupFormProps["fieldErrors"],
  field: keyof SignupFormState | "full_name" | "institution_name",
): string | null {
  if (!fieldErrors) {
    return null;
  }

  if (field === "fullName" && fieldErrors.full_name) {
    return fieldErrors.full_name;
  }

  if (field === "institutionName" && fieldErrors.institution_name) {
    return fieldErrors.institution_name;
  }

  return fieldErrors[field as keyof SignupFormState] ?? null;
}

export function SignupForm({
  formError = null,
  fieldErrors,
  isSubmitting = false,
  onSubmit,
}: SignupFormProps) {
  const [form, setForm] = useState<SignupFormState>({
    fullName: "",
    institutionName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [clientErrors, setClientErrors] = useState<
    Partial<Record<keyof SignupFormState, string>>
  >({});

  const updateField = (field: keyof SignupFormState, value: string) => {
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

    const nextClientErrors: Partial<Record<keyof SignupFormState, string>> = {};

    if (!form.fullName.trim()) {
      nextClientErrors.fullName = "Full name is required.";
    }

    if (!form.institutionName.trim()) {
      nextClientErrors.institutionName = "Institution name is required.";
    }

    if (!form.email.trim()) {
      nextClientErrors.email = "Email is required.";
    }

    if (form.password.length < 12 || form.password.length > 128) {
      nextClientErrors.password = "Password must be between 12 and 128 characters.";
    }

    if (form.password !== form.confirmPassword) {
      nextClientErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(nextClientErrors).length > 0) {
      setClientErrors(nextClientErrors);
      return;
    }

    const payload = {
      full_name: form.fullName.trim(),
      institution_name: form.institutionName.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    const parsed = signupRequestSchema.safeParse(payload);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (field === "full_name") {
          nextClientErrors.fullName = issue.message;
        } else if (field === "institution_name") {
          nextClientErrors.institutionName = issue.message;
        } else if (field === "email") {
          nextClientErrors.email = issue.message;
        } else if (field === "password") {
          nextClientErrors.password = issue.message;
        }
      }

      setClientErrors(nextClientErrors);
      return;
    }

    setClientErrors({});
    await onSubmit?.(parsed.data);
  };

  const resolveError = (
    field: keyof SignupFormState | "full_name" | "institution_name",
  ) => clientErrors[field as keyof SignupFormState] ?? mapServerFieldError(fieldErrors, field);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-[var(--layout-auth-signup-link-gap)]"
      noValidate
    >
      <div className="flex flex-col gap-[var(--layout-auth-submit-gap)]">
        <div className="flex flex-col gap-[var(--layout-auth-field-group-gap)]">
          <div className="grid grid-cols-1 gap-[var(--layout-auth-field-group-gap)] sm:grid-cols-2 sm:gap-3">
            <AuthField
              label="Full Name"
              required
              autoComplete="name"
              placeholder="John Doe"
              value={form.fullName}
              error={resolveError("fullName")}
              onChange={(event) => updateField("fullName", event.target.value)}
            />
            <AuthField
              label="Institution Name"
              required
              autoComplete="organization"
              placeholder="Example Pharma"
              value={form.institutionName}
              error={resolveError("institutionName")}
              onChange={(event) =>
                updateField("institutionName", event.target.value)
              }
            />
          </div>
          <AuthField
            label="Email Address"
            required
            type="email"
            autoComplete="email"
            placeholder="john@email.com"
            value={form.email}
            error={resolveError("email")}
            onChange={(event) => updateField("email", event.target.value)}
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
            error={resolveError("password")}
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
            error={resolveError("confirmPassword")}
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

      <p className="text-center font-inter text-label leading-normal font-medium text-landing-text-heading">
        Already have an account?{" "}
        <AuthGradientLink href="/login">Sign In</AuthGradientLink>
      </p>
    </form>
  );
}
