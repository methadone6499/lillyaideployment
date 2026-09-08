"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
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
import { sanitizeReturnTo } from "../session/returnTo";
import { getPostAuthHomePath } from "../utils/authAccess";
import {
  classifyLoginError,
  type LoginErrorState,
} from "../utils/classifyLoginError";
import { AuthFormAlert } from "./AuthFormAlert";
import { AuthPageShell } from "./AuthPageShell";
import { LoginForm } from "./LoginForm";

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const signinMutation = useSigninMutation();
  const resendMutation = useResendVerificationMutation();
  const [errorState, setErrorState] = useState<LoginErrorState>({
    type: "none",
  });
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleSubmit = async (values: { email: string; password: string }) => {
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

      router.push(
        sanitizeReturnTo(
          searchParams.get("returnTo"),
          getPostAuthHomePath(me),
        ),
      );
    } catch (error) {
      setErrorState(classifyLoginError(error, email));
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
        isSubmitting={signinMutation.isPending}
        isResendingVerification={resendMutation.isPending}
        onSubmit={handleSubmit}
        onResendVerification={handleResendVerification}
      />
    </AuthPageShell>
  );
}
