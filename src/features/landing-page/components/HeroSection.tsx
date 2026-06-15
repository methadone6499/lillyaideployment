"use client";

import { cn } from "@/lib/cn";
import { useState, type ComponentProps, type FormEvent } from "react";
import { GradientText } from "./GradientText";
import { LandingCtaButton } from "./LandingCtaButton";
import { LandingSection } from "./LandingSection";

type SignupFormState = {
  name: string;
  institution: string;
  email: string;
  password: string;
};

function SignupField({
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

function SignupForm() {
  const [form, setForm] = useState<SignupFormState>({
    name: "",
    institution: "",
    email: "",
    password: "",
  });

  const updateField = (field: keyof SignupFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="w-full max-w-landing-hero-form shrink-0">
      <form onSubmit={handleSubmit} className="flex flex-col gap-[42px]">
        <h2 className="text-[32px] text-landing-text-heading">
          Join Our Platform
        </h2>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <SignupField
                label="Name"
                required
                placeholder="John Doe"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
              <SignupField
                label="Institution Name"
                placeholder="ATR"
                value={form.institution}
                onChange={(event) =>
                  updateField("institution", event.target.value)
                }
              />
            </div>
            <SignupField
              label="Email Address"
              required
              type="email"
              placeholder="john@email.com"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
            <SignupField
              label="Password"
              type="password"
              placeholder="Create your secure password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
          </div>

          <LandingCtaButton type="submit" fullWidth>
            Create Account
          </LandingCtaButton>
        </div>

        <p className="text-center text-label font-medium text-landing-text-heading">
          Already have an account?{" "}
          <button
            type="button"
            className="font-medium underline decoration-brand underline-offset-2"
          >
            <GradientText as="span">Sign In</GradientText>
          </button>
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
        <SignupForm />
      </div>
    </LandingSection>
  );
}
