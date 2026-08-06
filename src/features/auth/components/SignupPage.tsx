"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiRequestError } from "@/services/ApiRequestError";

import {
  useResendVerificationMutation,
  useSignupMutation,
} from "../hooks/useAuthMutations";
import { useResendCooldown } from "../hooks/useResendCooldown";
import { getAuthErrorMessage } from "../utils/getAuthErrorMessage";
import { storePendingSignupEmail } from "../utils/pendingSignupEmail";
import { DuplicateEmailRecovery } from "./DuplicateEmailRecovery";
import { AuthPageShell } from "./AuthPageShell";
import { SignupForm } from "./SignupForm";

export function SignupPage() {
  const router = useRouter();
  const signupMutation = useSignupMutation();
  const resendMutation = useResendVerificationMutation();
  const { secondsRemaining, isCoolingDown, startCooldown } = useResendCooldown();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string> | undefined
  >(undefined);
  const [duplicateEmail, setDuplicateEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleSubmit = async (values: {
    full_name: string;
    institution_name: string;
    email: string;
    password: string;
  }) => {
    setFormError(null);
    setFieldErrors(undefined);
    setDuplicateEmail(null);
    setResendMessage(null);
    setResendError(null);

    try {
      await signupMutation.mutateAsync(values);
      storePendingSignupEmail(values.email);
      router.push("/check-email");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.code === "duplicate_email" || error.status === 409) {
          storePendingSignupEmail(values.email);
          setDuplicateEmail(values.email);
          return;
        }

        if (Object.keys(error.fieldErrors).length > 0) {
          setFieldErrors(error.fieldErrors);
          setFormError(error.message);
          return;
        }
      }

      setFormError(getAuthErrorMessage(error));
    }
  };

  const handleResendVerification = async () => {
    if (!duplicateEmail) {
      return;
    }

    setResendMessage(null);
    setResendError(null);

    try {
      const response = await resendMutation.mutateAsync({
        email: duplicateEmail,
      });
      storePendingSignupEmail(duplicateEmail);
      setResendMessage(response.message);
      startCooldown();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setResendError(error.message);
        return;
      }

      setResendError(getAuthErrorMessage(error));
    }
  };

  const handleUseDifferentEmail = () => {
    setDuplicateEmail(null);
    setResendMessage(null);
    setResendError(null);
  };

  return (
    <AuthPageShell
      title={duplicateEmail ? "Verify Your Email" : "Join Our Platform"}
    >
      {duplicateEmail ? (
        <DuplicateEmailRecovery
          email={duplicateEmail}
          successMessage={resendMessage}
          errorMessage={resendError}
          isSubmitting={resendMutation.isPending}
          isCoolingDown={isCoolingDown}
          secondsRemaining={secondsRemaining}
          onResendVerification={handleResendVerification}
          onUseDifferentEmail={handleUseDifferentEmail}
        />
      ) : (
        <SignupForm
          formError={formError}
          fieldErrors={fieldErrors}
          isSubmitting={signupMutation.isPending}
          onSubmit={handleSubmit}
        />
      )}
    </AuthPageShell>
  );
}
