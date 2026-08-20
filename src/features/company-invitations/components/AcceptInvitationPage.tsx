"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { Button } from "@/components/ui";
import {
  AuthFormAlert,
  AuthGradientLink,
  AuthPageShell,
  beginNewAuthSession,
  classifyLoginError,
  establishAuthenticatedSession,
  getPostAuthHomePath,
  LoginForm,
  refetchAuthMe,
  useIsAuthenticated,
  useIsAuthInitializing,
  useLogoutMutation,
  useResendVerificationMutation,
  useSigninMutation,
  type LoginErrorState,
} from "@/features/auth";
import { ApiRequestError } from "@/services/ApiRequestError";

import { useInvitationPreview } from "../hooks/useInvitationPreview";
import {
  useAcceptInvitationMutation,
  useRegisterInvitationMutation,
} from "../hooks/useInvitationRecipientMutations";
import type { InvitationPreview } from "../schemas/companyInvitationSchemas";
import { classifyInvitationRecipientError } from "../utils/classifyInvitationRecipientError";
import {
  captureInvitationTokenFromLocation,
  clearInvitationToken,
  getInvitationToken,
  getInvitationTokenSnapshot,
  getServerInvitationTokenSnapshot,
  subscribeInvitationToken,
  tryBeginInvitationAutoAccept,
} from "../utils/invitationToken";
import { InvitationRegisterForm } from "./InvitationRegisterForm";

const invitationExpiresFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatInvitationExpiry(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return invitationExpiresFormatter.format(date);
}

function InvitationSummary({ preview }: { preview: InvitationPreview }) {
  return (
    <div className="flex flex-col gap-1 text-center">
      <p className="text-label leading-normal text-landing-text-heading">
        You were invited to join {preview.company_name}.
      </p>
      <p className="text-label leading-normal text-white/48">
        Invited email: {preview.email_masked}
      </p>
      <p className="text-label leading-normal text-white/48">
        Expires {formatInvitationExpiry(preview.expires_at)}
      </p>
    </div>
  );
}

export function AcceptInvitationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useIsAuthenticated();
  const isAuthInitializing = useIsAuthInitializing();
  const signinMutation = useSigninMutation();
  const logoutMutation = useLogoutMutation();
  const resendMutation = useResendVerificationMutation();
  const acceptMutation = useAcceptInvitationMutation();
  const registerMutation = useRegisterInvitationMutation();
  const tokenSnapshot = useSyncExternalStore(
    subscribeInvitationToken,
    getInvitationTokenSnapshot,
    getServerInvitationTokenSnapshot,
  );
  const tokenReady = tokenSnapshot.captured;
  const hasToken = Boolean(tokenSnapshot.token);
  const [registered, setRegistered] = useState(false);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);
  const [forceLogin, setForceLogin] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [canRetryAccept, setCanRetryAccept] = useState(false);
  const [registerFieldErrors, setRegisterFieldErrors] = useState<
    Partial<Record<"full_name" | "password", string>>
  >({});
  const [loginErrorState, setLoginErrorState] = useState<LoginErrorState>({
    type: "none",
  });
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    captureInvitationTokenFromLocation();
  }, []);

  const previewQuery = useInvitationPreview(hasToken);
  const preview = previewQuery.data ?? null;
  const previewError = previewQuery.isError
    ? classifyInvitationRecipientError(previewQuery.error, {
        publicToken: true,
      })
    : null;

  const completeAccept = useCallback(async () => {
    const token = getInvitationToken();

    if (!token) {
      clearInvitationToken();
      setIsAccepting(false);
      return;
    }

    setRecipientError(null);
    setCanRetryAccept(false);
    setIsAccepting(true);

    try {
      await acceptMutation.mutateAsync();
      const me = await refetchAuthMe();
      router.replace(getPostAuthHomePath(me));
    } catch (error) {
      setIsAccepting(false);
      const classified = classifyInvitationRecipientError(error);

      if (classified.code === "invalid_or_expired_invitation") {
        clearInvitationToken();
        setRecipientError(classified.message);
        return;
      }

      if (classified.code === "invitation_email_mismatch") {
        setForceLogin(true);
        setRecipientError(classified.message);

        if (isAuthenticated) {
          try {
            await logoutMutation.mutateAsync();
          } catch {
            // The next sign-in starts a new session.
          }
        }

        return;
      }

      setCanRetryAccept(classified.code === "retryable");
      setRecipientError(classified.message);
    }
  }, [acceptMutation, isAuthenticated, logoutMutation, router]);

  const shouldAutoAccept =
    tokenReady &&
    hasToken &&
    preview?.acceptance_mode === "login" &&
    isAuthenticated &&
    !isAuthInitializing &&
    !forceLogin &&
    !registered &&
    !isAccepting;

  useEffect(() => {
    if (!shouldAutoAccept) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (!tryBeginInvitationAutoAccept()) {
        return;
      }

      void completeAccept();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [completeAccept, shouldAutoAccept]);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoginErrorState({ type: "none" });
    setRecipientError(null);
    setResendMessage(null);
    setResendError(null);

    const email = values.email.trim();

    try {
      const generation = beginNewAuthSession();
      const token = await signinMutation.mutateAsync({
        email,
        password: values.password,
      });
      const me = await establishAuthenticatedSession(
        queryClient,
        generation,
        token,
      );

      if (!me) {
        setLoginErrorState({
          type: "retryable",
          message: "Your sign-in could not be completed. Please try again.",
        });
        return;
      }

      if (registered) {
        router.replace(getPostAuthHomePath(me));
        return;
      }

      await completeAccept();
    } catch (error) {
      setLoginErrorState(classifyLoginError(error, email));
    }
  };

  const handleResendVerification = async (email: string) => {
    setResendMessage(null);
    setResendError(null);

    try {
      const response = await resendMutation.mutateAsync({ email });
      setResendMessage(response.message);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setResendError(error.message);
        return;
      }

      setResendError("Something went wrong. Please try again.");
    }
  };

  const handleRegister = async (values: {
    full_name: string;
    password: string;
  }) => {
    const token = getInvitationToken();

    if (!token) {
      clearInvitationToken();
      return;
    }

    setRecipientError(null);
    setRegisterFieldErrors({});

    try {
      const result = await registerMutation.mutateAsync({
        full_name: values.full_name,
        password: values.password,
      });
      setRegisterMessage(
        result.message ||
          "Your account is ready. Sign in to join the company workspace.",
      );
      setRegistered(true);
      setForceLogin(true);
    } catch (error) {
      const classified = classifyInvitationRecipientError(error, {
        publicToken: true,
      });

      if (classified.code === "invalid_or_expired_invitation") {
        clearInvitationToken();
        setRecipientError(classified.message);
        return;
      }

      if (classified.code === "account_already_exists") {
        setForceLogin(true);
        setRecipientError(classified.message);
        return;
      }

      if (classified.fieldErrors) {
        setRegisterFieldErrors({
          full_name: classified.fieldErrors.full_name,
          password: classified.fieldErrors.password,
        });
      }

      setRecipientError(classified.message);
    }
  };

  const isInvalidInvitation =
    (tokenReady && !hasToken && !registered) ||
    previewError?.code === "invalid_or_expired_invitation";
  const waitingForPreview = hasToken && previewQuery.isPending;
  const waitingForAuthDecision =
    hasToken &&
    preview?.acceptance_mode === "login" &&
    isAuthInitializing;
  const isLoading =
    !tokenReady || waitingForPreview || waitingForAuthDecision;
  const showRegister =
    Boolean(preview) &&
    preview?.acceptance_mode === "create_account" &&
    !registered &&
    !forceLogin;
  const showLogin =
    Boolean(preview) &&
    !isAuthInitializing &&
    !isAccepting &&
    (registered ||
      forceLogin ||
      (preview?.acceptance_mode === "login" && !isAuthenticated));
  const title = registered
    ? "Log in to continue"
    : preview
      ? `Join ${preview.company_name}`
      : isInvalidInvitation
        ? "Invitation unavailable"
        : "Accept invitation";

  let body = null;

  if (isLoading) {
    body = (
      <AuthFormAlert variant="info" role="status">
        Loading invitation...
      </AuthFormAlert>
    );
  } else if (isInvalidInvitation) {
    body = (
      <div className="flex flex-col gap-4">
        <AuthFormAlert variant="error">
          {recipientError ||
            previewError?.message ||
            "This invitation link is invalid or has expired."}
        </AuthFormAlert>
        <p className="text-center font-inter text-label leading-normal font-medium text-landing-text-heading">
          <AuthGradientLink href="/login">Go to login</AuthGradientLink>
        </p>
      </div>
    );
  } else if (previewError?.code === "retryable") {
    body = (
      <div className="flex flex-col gap-4">
        <AuthFormAlert variant="error">{previewError.message}</AuthFormAlert>
        <Button
          type="button"
          onClick={() => {
            void previewQuery.refetch();
          }}
          className="!h-[var(--layout-auth-button-height)] w-full !rounded-[10.5px] border border-white/10 !bg-white/5 px-6 !text-[16px] !font-medium text-white hover:!bg-white/10"
        >
          Try again
        </Button>
      </div>
    );
  } else if (preview) {
    body = (
      <div className="flex w-full flex-col gap-[var(--layout-auth-submit-gap)]">
        <InvitationSummary preview={preview} />

        {registerMessage ? (
          <AuthFormAlert variant="success" role="status">
            {registerMessage}
          </AuthFormAlert>
        ) : null}

        {recipientError && !showRegister ? (
          <AuthFormAlert variant="error">{recipientError}</AuthFormAlert>
        ) : null}

        {isAccepting ? (
          <AuthFormAlert variant="info" role="status">
            Joining {preview.company_name}...
          </AuthFormAlert>
        ) : null}

        {canRetryAccept && !isAccepting ? (
          <Button
            type="button"
            onClick={() => {
              void completeAccept();
            }}
            className="!h-[var(--layout-auth-button-height)] w-full !rounded-[10.5px] border border-white/10 !bg-white/5 px-6 !text-[16px] !font-medium text-white hover:!bg-white/10"
          >
            Try again
          </Button>
        ) : null}

        {showRegister ? (
          <InvitationRegisterForm
            formError={recipientError}
            fieldErrors={registerFieldErrors}
            isSubmitting={registerMutation.isPending}
            onSubmit={handleRegister}
          />
        ) : null}

        {showLogin ? (
          <>
            {resendMessage ? (
              <AuthFormAlert variant="success" role="status">
                {resendMessage}
              </AuthFormAlert>
            ) : null}
            {resendError ? (
              <AuthFormAlert variant="error">{resendError}</AuthFormAlert>
            ) : null}
            <LoginForm
              errorState={loginErrorState}
              isSubmitting={signinMutation.isPending || isAccepting}
              isResendingVerification={resendMutation.isPending}
              showSignUpLink={false}
              emailDescription={`Sign in with the invited email (${preview.email_masked}).`}
              onSubmit={handleLogin}
              onResendVerification={handleResendVerification}
            />
          </>
        ) : null}
      </div>
    );
  }

  return <AuthPageShell title={title}>{body}</AuthPageShell>;
}
