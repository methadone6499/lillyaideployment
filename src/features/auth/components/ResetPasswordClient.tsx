"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { clearReportSession } from "@/features/report-generation";
import { ApiRequestError } from "@/services/ApiRequestError";
import { useAuthStore } from "@/store/useAuthStore";

import { useResetPasswordMutation } from "../hooks/useAuthMutations";
import {
  performTerminalAuthCleanup,
  setAuthQueryClient,
} from "../session/authSession";
import { getAuthErrorMessage } from "../utils/getAuthErrorMessage";
import { AuthFormAlert } from "./AuthFormAlert";
import { AuthGradientLink } from "./AuthGradientLink";
import { AuthPageShell } from "./AuthPageShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

type ResetPasswordClientProps = {
  token: string | null;
};

export function ResetPasswordClient({ token }: ResetPasswordClientProps) {
  const queryClient = useQueryClient();
  const resetMutation = useResetPasswordMutation();
  const tokenRef = useRef<string | null>(token);
  const [isInvalidToken, setIsInvalidToken] = useState(!token);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setAuthQueryClient(queryClient);
    tokenRef.current = token;

    if (token) {
      window.history.replaceState({}, "", "/reset-password");
    }
  }, [queryClient, token]);

  const handleSubmit = async (newPassword: string) => {
    const resetToken = tokenRef.current;

    if (!resetToken) {
      setIsInvalidToken(true);
      return;
    }

    const generation = useAuthStore.getState().sessionGeneration;
    setErrorMessage(null);

    try {
      await resetMutation.mutateAsync({
        token: resetToken,
        new_password: newPassword,
      });

      if (performTerminalAuthCleanup(queryClient, generation)) {
        await clearReportSession(queryClient);
      }

      setIsSuccess(true);
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        (error.code === "invalid_or_expired_token" || error.status === 400)
      ) {
        setIsInvalidToken(true);
        setErrorMessage(
          error.message ||
            "This reset link is invalid or has expired. Request a new one.",
        );
        return;
      }

      setErrorMessage(getAuthErrorMessage(error));
    }
  };

  if (isInvalidToken) {
    return (
      <AuthPageShell title="Reset Password">
        <div className="flex flex-col gap-4">
          <AuthFormAlert variant="error">
            {errorMessage ||
              "This reset link is invalid or has expired. Request a new one."}
          </AuthFormAlert>
          <p className="text-center font-inter text-label leading-normal font-medium text-landing-text-heading">
            <AuthGradientLink href="/forgot-password">
              Request a new reset link
            </AuthGradientLink>
          </p>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell title="Reset Password">
      <ResetPasswordForm
        errorMessage={errorMessage}
        isSubmitting={resetMutation.isPending}
        isSuccess={isSuccess}
        onSubmit={handleSubmit}
      />
    </AuthPageShell>
  );
}
