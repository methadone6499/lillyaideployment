"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";

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
    <AuthPageShell title="Verify Email">
      {viewState.status === "loading" ? (
        <AuthFormAlert variant="info" role="status">
          Verifying your email address...
        </AuthFormAlert>
      ) : null}

      {viewState.status === "success" ? (
        <div className="flex flex-col gap-4">
          <AuthFormAlert variant="success" role="status">
            {viewState.message}
          </AuthFormAlert>
          <p className="text-center font-inter text-label leading-normal font-medium text-landing-text-heading">
            <AuthGradientLink href="/login">Continue to login</AuthGradientLink>
          </p>
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
