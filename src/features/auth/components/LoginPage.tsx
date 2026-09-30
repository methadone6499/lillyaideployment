"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ApiRequestError } from "@/services/ApiRequestError";

import {
  useResendVerificationMutation,
  useSigninMutation,
} from "../hooks/useAuthMutations";
import {
  beginNewAuthSession,
  establishAuthenticatedSession,
} from "../session/authSession";
import {
  classifyLoginError,
  type LoginErrorState,
} from "../utils/classifyLoginError";
import { AuthFormAlert } from "./AuthFormAlert";
import { AuthPageShell } from "./AuthPageShell";
import { LoginForm } from "./LoginForm";

export function LoginPage() {
  const queryClient = useQueryClient();
  const signinMutation = useSigninMutation();
  const resendMutation = useResendVerificationMutation();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorState, setErrorState] = useState<LoginErrorState>({
    type: "none",
  });
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleSubmit = async (values: { email: string; password: string }) => {
    if (isSigningIn) {
      return;
    }

    setIsSigningIn(true);
    setErrorState({ type: "none" });
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
        setErrorState({
          type: "retryable",
          message:
            "Your sign-in could not be completed. Please try again.",
        });
        return;
      }
    } catch (error) {
      setErrorState(classifyLoginError(error, email));
    } finally {
      setIsSigningIn(false);
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

  return (
    <AuthPageShell title="Login">
      {resendMessage ? (
        <div className="mb-4">
          <AuthFormAlert variant="success" role="status">
            {resendMessage}
          </AuthFormAlert>
        </div>
      ) : null}
      {resendError ? (
        <div className="mb-4">
          <AuthFormAlert variant="error">{resendError}</AuthFormAlert>
        </div>
      ) : null}
      <LoginForm
        errorState={errorState}
        isSubmitting={isSigningIn || signinMutation.isPending}
        isResendingVerification={resendMutation.isPending}
        onSubmit={handleSubmit}
        onResendVerification={handleResendVerification}
      />
    </AuthPageShell>
  );
}
