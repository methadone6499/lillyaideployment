"use client";

import { useState } from "react";

import { ApiRequestError } from "@/services/ApiRequestError";

import { useForgotPasswordMutation } from "../hooks/useAuthMutations";
import { getAuthErrorMessage } from "../utils/getAuthErrorMessage";
import { AuthPageShell } from "./AuthPageShell";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export function ForgotPasswordPage() {
  const forgotMutation = useForgotPasswordMutation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (email: string) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await forgotMutation.mutateAsync({ email });
      setSuccessMessage(response.message);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage(getAuthErrorMessage(error));
    }
  };

  return (
    <AuthPageShell title="Forgot Password">
      <ForgotPasswordForm
        successMessage={successMessage}
        errorMessage={errorMessage}
        isSubmitting={forgotMutation.isPending}
        onSubmit={handleSubmit}
      />
    </AuthPageShell>
  );
}
