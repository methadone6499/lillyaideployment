"use client";

import { useState } from "react";

import { ApiRequestError } from "@/services/ApiRequestError";

import { useResendVerificationMutation } from "../hooks/useAuthMutations";
import { usePendingSignupEmail } from "../hooks/usePendingSignupEmail";
import { useResendCooldown } from "../hooks/useResendCooldown";
import { getAuthErrorMessage } from "../utils/getAuthErrorMessage";
import { storePendingSignupEmail } from "../utils/pendingSignupEmail";
import { AuthPageShell } from "./AuthPageShell";
import { CheckEmailForm } from "./CheckEmailForm";

export function CheckEmailPage() {
  const resendMutation = useResendVerificationMutation();
  const { secondsRemaining, isCoolingDown, startCooldown } = useResendCooldown();
  const pendingEmail = usePendingSignupEmail();
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (submittedEmail: string) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await resendMutation.mutateAsync({
        email: submittedEmail,
      });
      storePendingSignupEmail(submittedEmail);
      setEmail(submittedEmail);
      setSuccessMessage(response.message);
      startCooldown();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage(getAuthErrorMessage(error));
    }
  };

  return (
    <AuthPageShell title="Check Your Email">
      <CheckEmailForm
        key={email || pendingEmail || "check-email"}
        initialEmail={email || pendingEmail}
        successMessage={successMessage}
        errorMessage={errorMessage}
        isSubmitting={resendMutation.isPending}
        isCoolingDown={isCoolingDown}
        secondsRemaining={secondsRemaining}
        onSubmit={handleSubmit}
      />
    </AuthPageShell>
  );
}
