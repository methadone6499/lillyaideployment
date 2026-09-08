"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { ArrowNarrowRightIcon } from "@/components/ui";
import { ApiRequestError } from "@/services/ApiRequestError";

import {
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from "../hooks/useAuthMutations";
import { useResendCooldown } from "../hooks/useResendCooldown";
import type { MessageResponse } from "../schemas/authSchemas";
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

const SUCCESS_REDIRECT_DELAY_MS = 2000;
const DEFAULT_SUCCESS_MESSAGE = "Your email has been verified.";
const DEFAULT_INVALID_MESSAGE =
  "This verification link is invalid, expired, or has already been used.";

const verifiedTokensThisSession = new Set<string>();
const verifyPromisesByToken = new Map<string, Promise<MessageResponse>>();

function isInvalidOrExpiredTokenError(
  error: unknown,
): error is ApiRequestError {
  return (
    error instanceof ApiRequestError &&
    (error.code === "invalid_or_expired_token" || error.status === 400)
  );
}

function getInitialViewState(token: string | null): VerifyEmailViewState {
  if (!token) {
    return { status: "missing-token" };
  }

  if (verifiedTokensThisSession.has(token)) {
    return { status: "success", message: DEFAULT_SUCCESS_MESSAGE };
  }

  return { status: "loading" };
}

export function VerifyEmailClient({ token }: VerifyEmailClientProps) {
  const router = useRouter();
  const { mutateAsync: verifyEmailMutateAsync } = useVerifyEmailMutation();
  const resendMutation = useResendVerificationMutation();
  const { secondsRemaining, isCoolingDown, startCooldown } = useResendCooldown();
  const [persistedToken, setPersistedToken] = useState<string | null>(token);
  const [viewState, setViewState] = useState<VerifyEmailViewState>(() =>
    getInitialViewState(token),
  );
  const verifyStartedRef = useRef(false);
  const verifiedThisSessionRef = useRef(
    Boolean(token && verifiedTokensThisSession.has(token)),
  );
  const [resendEmail, setResendEmail] = useState("");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  if (token && token !== persistedToken) {
    setPersistedToken(token);
  }

  const resolvedViewState: VerifyEmailViewState = !persistedToken
    ? { status: "missing-token" }
    : viewState.status === "missing-token"
      ? { status: "loading" }
      : viewState;

  useEffect(() => {
    if (!persistedToken) {
      return;
    }

    let cancelled = false;
    let verifyPromise = verifyPromisesByToken.get(persistedToken);

    if (!verifyPromise) {
      if (verifiedTokensThisSession.has(persistedToken)) {
        verifyPromise = Promise.resolve({
          message: DEFAULT_SUCCESS_MESSAGE,
        });
        verifyPromisesByToken.set(persistedToken, verifyPromise);
      } else if (verifyStartedRef.current) {
        return;
      } else {
        verifyStartedRef.current = true;
        verifyPromise = verifyEmailMutateAsync({
          token: persistedToken,
        }).then((response) => {
          verifiedTokensThisSession.add(persistedToken);
          return response;
        });
        verifyPromisesByToken.set(persistedToken, verifyPromise);
      }
    }

    void verifyPromise
      .then((response) => {
        verifiedThisSessionRef.current = true;

        if (!cancelled) {
          setViewState({
            status: "success",
            message: response.message,
          });
        }
      })
      .catch((error: unknown) => {
        const alreadyVerified =
          verifiedThisSessionRef.current ||
          verifiedTokensThisSession.has(persistedToken);

        if (alreadyVerified && isInvalidOrExpiredTokenError(error)) {
          if (!cancelled) {
            setViewState({
              status: "success",
              message: DEFAULT_SUCCESS_MESSAGE,
            });
          }
          return;
        }

        if (cancelled) {
          return;
        }

        if (isInvalidOrExpiredTokenError(error)) {
          setViewState({
            status: "invalid",
            message: error.message || DEFAULT_INVALID_MESSAGE,
          });
          return;
        }

        setViewState({
          status: "error",
          message:
            error instanceof ApiRequestError
              ? error.message
              : "We could not verify your email. Please try again.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [persistedToken, verifyEmailMutateAsync]);

  useEffect(() => {
    if (resolvedViewState.status !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.replace("/login");
    }, SUCCESS_REDIRECT_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [resolvedViewState.status, router]);

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
      title={resolvedViewState.status === "success" ? "Email Confirmed" : "Verify Email"}
    >
      {resolvedViewState.status === "loading" ? (
        <AuthFormAlert variant="info" role="status">
          Verifying your email address...
        </AuthFormAlert>
      ) : null}

      {resolvedViewState.status === "success" ? (
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
            <span className="sr-only">{resolvedViewState.message}</span>
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

      {resolvedViewState.status === "missing-token" || resolvedViewState.status === "invalid" ? (
        <div className="flex flex-col gap-[var(--layout-auth-submit-gap)]">
          <AuthFormAlert variant="error">
            {resolvedViewState.status === "missing-token"
              ? "This verification link is missing a token."
              : resolvedViewState.message}
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

      {resolvedViewState.status === "error" ? (
        <div className="flex flex-col gap-4">
          <AuthFormAlert variant="error">{resolvedViewState.message}</AuthFormAlert>
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
