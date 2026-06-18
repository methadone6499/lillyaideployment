"use client";

import {
  AuthApiError,
  useSigninMutation,
  useSignupMutation,
} from "@/features/auth";
import {
  beginReportWizardSession,
  clearAllReportQueries,
} from "@/features/report-generation";
import { cn } from "@/lib/cn";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type ComponentProps, type FormEvent } from "react";
import { GradientText } from "./GradientText";
import { LandingCtaButton } from "./LandingCtaButton";
import { LandingSection } from "./LandingSection";

type AuthMode = "signup" | "signin";

type AuthFormState = {
  name: string;
  institution: string;
  email: string;
  password: string;
};

function AuthField({
  label,
  required,
  className,
  ...props
}: ComponentProps<"input"> & {
  label: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-5", className)}>
      <span className="text-landing-body-size text-text-muted tracking-[-0.01em]">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      <input
        className="h-14 w-full rounded-field border-0 bg-landing-surface-input px-6 text-input text-white placeholder:text-[#686868] outline-none focus:ring-1 focus:ring-brand-chip-border"
        {...props}
      />
    </label>
  );
}

function splitName(name: string): { first_name: string; last_name: string } {
  const trimmed = name.trim();
  const spaceIndex = trimmed.indexOf(" ");

  if (spaceIndex === -1) {
    return { first_name: trimmed, last_name: "" };
  }

  return {
    first_name: trimmed.slice(0, spaceIndex),
    last_name: trimmed.slice(spaceIndex + 1).trim(),
  };
}

function AuthForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [form, setForm] = useState<AuthFormState>({
    name: "",
    institution: "",
    email: "",
    password: "",
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signupMutation = useSignupMutation();
  const signinMutation = useSigninMutation();
  const isSubmitting = signupMutation.isPending || signinMutation.isPending;

  const updateField = (field: keyof AuthFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const switchToSignIn = () => {
    setMode("signin");
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const switchToSignUp = () => {
    setMode("signup");
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (mode === "signup") {
        const { first_name, last_name } = splitName(form.name);
        await signupMutation.mutateAsync({
          email: form.email.trim(),
          password: form.password,
          first_name,
          last_name,
          institution: form.institution.trim(),
        });
        setSuccessMessage("Account created. Sign in to continue.");
        setForm((current) => ({ ...current, password: "" }));
        setMode("signin");
        return;
      }

      const signinResponse = await signinMutation.mutateAsync({
        email: form.email.trim(),
        password: form.password,
      });
      clearAllReportQueries(queryClient);
      beginReportWizardSession(signinResponse.user_id);
      router.push("/reports/new");
    } catch (error) {
      setErrorMessage(
        error instanceof AuthApiError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <div className="w-full max-w-landing-hero-form shrink-0">
      <form onSubmit={handleSubmit} className="flex flex-col gap-[42px]">
        <h2 className="text-[32px] text-landing-text-heading">
          {mode === "signup" ? "Join Our Platform" : "Sign In"}
        </h2>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6">
            {mode === "signup" && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <AuthField
                  label="Name"
                  required
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
                <AuthField
                  label="Institution Name"
                  placeholder="ATR"
                  value={form.institution}
                  onChange={(event) =>
                    updateField("institution", event.target.value)
                  }
                />
              </div>
            )}
            <AuthField
              label="Email Address"
              required
              type="email"
              placeholder="john@email.com"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
            <AuthField
              label="Password"
              required
              type="password"
              placeholder={
                mode === "signup"
                  ? "Create your secure password"
                  : "Enter your password"
              }
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
          </div>

          {successMessage && (
            <p className="text-center text-label text-brand">{successMessage}</p>
          )}

          {errorMessage && (
            <p className="text-center text-label text-red-400">{errorMessage}</p>
          )}

          <LandingCtaButton type="submit" fullWidth showArrow={!isSubmitting}>
            {isSubmitting
              ? mode === "signup"
                ? "Creating Account..."
                : "Signing In..."
              : mode === "signup"
                ? "Create Account"
                : "Sign In"}
          </LandingCtaButton>
        </div>

        <p className="text-center text-label font-medium text-landing-text-heading">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchToSignIn}
                className="font-medium underline decoration-brand underline-offset-2"
              >
                <GradientText as="span">Sign In</GradientText>
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={switchToSignUp}
                className="font-medium underline decoration-brand underline-offset-2"
              >
                <GradientText as="span">Create Account</GradientText>
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}

export function HeroSection() {
  return (
    <LandingSection className="pt-12 pb-landing-section-y">
      <div className="grid grid-cols-1 items-start gap-12 xl:grid-cols-[minmax(0,1fr)_480px] xl:gap-16">
        <div className="flex max-w-3xl flex-col gap-12">
          <h1 className="text-landing-hero-size leading-landing-hero-line text-landing-text-heading">
            <span className="block">
              Comprehensive <GradientText>HTA</GradientText>
            </span>
            <span className="block">
              <GradientText>Evaluation</GradientText> Platform
            </span>
          </h1>
          <p className="max-w-2xl text-[20px] leading-8 text-landing-text-subtle">
            Eliminate evidence gaps and streamline collaborative HTA and
            formulary decision-making with comprehensive, committee-ready
            evaluations.
          </p>
        </div>
        <AuthForm />
      </div>
    </LandingSection>
  );
}
