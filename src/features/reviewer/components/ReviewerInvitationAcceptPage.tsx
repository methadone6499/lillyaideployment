"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui";
import {
  AuthFormAlert,
  AuthGradientLink,
  AuthPageShell,
} from "@/features/auth";

import { useRegisterReviewerMutation } from "../hooks/useReviewerMutations";
import { useReviewerInvitationPreview } from "../hooks/useReviewerQueries";
import { classifyReviewerError } from "../utils/classifyReviewerError";
import {
  captureReviewerInvitationToken,
  getReviewerInvitationToken,
  getReviewerInvitationTokenServerSnapshot,
  getReviewerInvitationTokenSnapshot,
  resetReviewerInvitationToken,
  subscribeReviewerInvitationToken,
} from "../utils/reviewerInvitationToken";
import { ReviewerInvitationRegisterForm } from "./ReviewerInvitationRegisterForm";

const expiresFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatExpiry(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : expiresFormatter.format(date);
}

export function ReviewerInvitationAcceptPage() {
  const router = useRouter();
  const tokenSnapshot = useSyncExternalStore(
    subscribeReviewerInvitationToken,
    getReviewerInvitationTokenSnapshot,
    getReviewerInvitationTokenServerSnapshot,
  );
  const registerMutation = useRegisterReviewerMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"full_name" | "password", string>>
  >({});

  useEffect(() => {
    captureReviewerInvitationToken();
  }, []);

  const hasToken = Boolean(tokenSnapshot.token);
  const previewQuery = useReviewerInvitationPreview(hasToken);
  const preview = previewQuery.data ?? null;
  const previewError = previewQuery.isError
    ? classifyReviewerError(previewQuery.error)
    : null;
  const invitationUnavailable =
    (tokenSnapshot.captured && !hasToken) ||
    previewError?.code === "invalid_or_expired_reviewer_invitation";

  const handleSubmit = async (values: {
    full_name: string;
    password: string;
  }) => {
    const token = getReviewerInvitationToken();
    if (!token) {
      setFormError("This reviewer invitation link is invalid or has expired.");
      return;
    }

    setFormError(null);
    setFieldErrors({});

    try {
      await registerMutation.mutateAsync({ token, ...values });
      resetReviewerInvitationToken();
      router.replace("/login");
    } catch (error) {
      const classified = classifyReviewerError(error);
      if (classified.code === "invalid_or_expired_reviewer_invitation") {
        resetReviewerInvitationToken();
      }
      setFieldErrors({
        full_name: classified.fieldErrors.full_name,
        password: classified.fieldErrors.password,
      });
      setFormError(classified.message);
    }
  };

  let body = null;

  if (!tokenSnapshot.captured || (hasToken && previewQuery.isPending)) {
    body = (
      <AuthFormAlert variant="info" role="status">
        Loading reviewer invitation...
      </AuthFormAlert>
    );
  } else if (invitationUnavailable) {
    body = (
      <div className="flex flex-col gap-4">
        <AuthFormAlert variant="error">
          {formError ??
            previewError?.message ??
            "This reviewer invitation link is invalid or has expired."}
        </AuthFormAlert>
        <p className="text-center font-inter text-label leading-normal font-medium text-landing-text-heading">
          <AuthGradientLink href="/login">Go to login</AuthGradientLink>
        </p>
      </div>
    );
  } else if (previewError) {
    body = (
      <div className="flex flex-col gap-4">
        <AuthFormAlert variant="error">{previewError.message}</AuthFormAlert>
        <Button
          type="button"
          onClick={() => void previewQuery.refetch()}
          className="!h-[var(--layout-auth-button-height)] w-full !rounded-[10.5px] border border-white/10 !bg-white/5 px-6 !text-[16px] !font-medium text-white hover:!bg-white/10"
        >
          Try again
        </Button>
      </div>
    );
  } else if (preview) {
    body = (
      <div className="flex w-full flex-col gap-[var(--layout-auth-submit-gap)]">
        <div className="flex flex-col gap-1 text-center">
          <p className="text-label leading-normal text-landing-text-heading">
            Create your reviewer account to access assigned reports.
          </p>
          <p className="text-label leading-normal text-white/48">
            Invited email: {preview.email_masked}
          </p>
          <p className="text-label leading-normal text-white/48">
            Expires {formatExpiry(preview.expires_at)}
          </p>
        </div>
        <ReviewerInvitationRegisterForm
          formError={formError}
          fieldErrors={fieldErrors}
          isSubmitting={registerMutation.isPending}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  return <AuthPageShell title="Accept reviewer invitation">{body}</AuthPageShell>;
}
