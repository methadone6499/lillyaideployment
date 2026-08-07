"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { ArrowNarrowRightIcon } from "@/components/ui";
import { ApiRequestError } from "@/services/ApiRequestError";

import { verifyEmail } from "../api/authApi";
import { authQueryKeys } from "../api/authQueryKeys";
import { useResendVerificationMutation } from "../hooks/useAuthMutations";
import { useResendCooldown } from "../hooks/useResendCooldown";
import { createVerifyEmailTokenFingerprint } from "../utils/verifyEmailTokenFingerprint";
import { AuthField } from "./AuthField";
import { AuthFormAlert } from "./AuthFormAlert";
import { AuthGradientLink } from "./AuthGradientLink";
import { AuthPageShell } from "./AuthPageShell";
import { AuthSubmitButton } from "./AuthSubmitButton";

type VerifyEmailClientProps = {
  token: string | null;
};

type VerifyEmailViewState =
  | { status: "missing-token" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export function VerifyEmailClient({ token }: VerifyEmailClientProps) {
  const [tokenFingerprint, setTokenFingerprint] = useState<string | null>(null);
  const resendMutation = useResendVerificationMutation();
  const { secondsRemaining, isCoolingDown, startCooldown } = useResendCooldown();
  const [resendEmail, setResendEmail] = useState("");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    window.history.replaceState({}, "", "/verify-email");

    void createVerifyEmailTokenFingerprint(token).then(setTokenFingerprint);
  }, [token]);

  const verifyQuery = useQuery({
    queryKey: tokenFingerprint
      ? authQueryKeys.verifyEmail(tokenFingerprint)
      : ["auth", "verify-email", "pending"],
    queryFn: ({ signal }) => {
      if (!token) {
        throw new Error("Missing verification token.");
      }

      return verifyEmail({ token }, signal);
    },
    enabled: Boolean(token && tokenFingerprint),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 60,
  });

  const viewState = useMemo((): VerifyEmailViewState => {
    if (!token) {
      return { status: "missing-token" };
    }

    if (verifyQuery.isPending) {
      return { status: "loading" };
    }

    if (verifyQuery.isSuccess) {
      return {
        status: "success",
        message: verifyQuery.data.message,
      };
    }

    if (verifyQuery.isError) {
      const error = verifyQuery.error;

      if (
        error instanceof ApiRequestError &&
        (error.code === "invalid_or_expired_token" || error.status === 400)
      ) {
        return {
          status: "invalid",
          message:
            error.message ||
            "This verification link is invalid, expired, or has already been used.",
        };
      }

      return {
        status: "error",
        message:
          error instanceof ApiRequestError
            ? error.message
            : "We could not verify your email. Please try again.",
      };
    }

    return { status: "loading" };
  }, [token, verifyQuery.data, verifyQuery.error, verifyQuery.isError, verifyQuery.isPending, verifyQuery.isSuccess]);

  const handleResend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResendMessage(null);
    setResendError(null);

    const trimmedEmail = resendEmail.trim();

    if (!trimmedEmail) {
      setResendError("Email is required.");
      return;
    }

    try {
      const response = await resendMutation.mutateAsync({ email: trimmedEmail });
      setResendMessage(response.message);
      startCooldown();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setResendError(error.message);
        return;
      }

      setResendError("Something went wrong. Please try again.");
    }
  };

  return (
    <AuthPageShell
      title={viewState.status === "success" ? "Email Confirmed" : "Verify Email"}
    >
      {viewState.status === "loading" ? (
        <AuthFormAlert variant="info" role="status">
          Verifying your email address...
        </AuthFormAlert>
      ) : null}

      {viewState.status === "success" ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-6 rounded-2xl border border-brand/25 bg-landing-surface-card px-6 py-8 text-center"
        >
          <div
            aria-hidden
            className="flex size-16 items-center justify-center rounded-full border border-brand/35 bg-brand/10 text-brand shadow-landing-emerald-glow"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-8"
            >
              <path
                d="M5 12.5L9.25 16.5L19 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[20px] leading-tight font-medium text-landing-text-heading">
              Your email has been verified
            </p>
            <p className="text-label leading-normal text-landing-text-subtle">
              Your LillyAI account is ready. Sign in to continue.
            </p>
            <span className="sr-only">{viewState.message}</span>
          </div>

          <Link
            href="/login"
            className="inline-flex h-[var(--layout-auth-button-height)] w-full items-center justify-center gap-1.5 rounded-[10.5px] border-[1.75px] border-[rgba(1,176,89,0.72)] bg-landing-emerald-gradient px-6 text-[16px] font-medium text-white shadow-landing-emerald-glow transition-opacity hover:opacity-95"
          >
            Continue to Login
            <ArrowNarrowRightIcon className="size-[18px]" />
          </Link>
        </div>
      ) : null}

      {viewState.status === "missing-token" || viewState.status === "invalid" ? (
        <div className="flex flex-col gap-[var(--layout-auth-submit-gap)]">
          <AuthFormAlert variant="error">
            {viewState.status === "missing-token"
              ? "This verification link is missing a token."
              : viewState.message}
          </AuthFormAlert>

          <form
            onSubmit={handleResend}
            className="flex flex-col gap-[var(--layout-auth-submit-gap)]"
            noValidate
          >
            <AuthField
              label="Email Address"
              required
              type="email"
              autoComplete="email"
              placeholder="john@email.com"
              value={resendEmail}
              error={resendError === "Email is required." ? resendError : null}
              onChange={(event) => {
                setResendEmail(event.target.value);
                setResendError(null);
              }}
            />

            {resendMessage ? (
              <AuthFormAlert variant="success" role="status">
                {resendMessage}
              </AuthFormAlert>
            ) : null}

            {resendError && resendError !== "Email is required." ? (
              <AuthFormAlert variant="error">{resendError}</AuthFormAlert>
            ) : null}

            <AuthSubmitButton
              isSubmitting={resendMutation.isPending || isCoolingDown}
            >
              {resendMutation.isPending
                ? "Sending..."
                : isCoolingDown
                  ? `Resend available in ${secondsRemaining}s`
                  : "Resend Verification Email"}
            </AuthSubmitButton>
          </form>
        </div>
      ) : null}

      {viewState.status === "error" ? (
        <div className="flex flex-col gap-4">
          <AuthFormAlert variant="error">{viewState.message}</AuthFormAlert>
          <p className="text-center font-inter text-label leading-normal font-medium text-landing-text-heading">
            <AuthGradientLink href="/check-email">
              Go to check email
            </AuthGradientLink>
          </p>
        </div>
      ) : null}
    </AuthPageShell>
  );
}
