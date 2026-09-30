"use client";

import { AuthenticatedBoundary, AuthSessionLoading } from "@/features/auth";
import {
  BILLING_PATHS,
  PLAN_INTENT_QUERY_PARAM,
  sanitizePlanIntentParam,
  storePlanIntent,
} from "@/features/billing";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";

function SignupLayoutInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const planIntent = sanitizePlanIntentParam(searchParams.get("plan"));

  if (planIntent) {
    storePlanIntent(planIntent);
  }

  const authenticatedDestination = planIntent
    ? `${BILLING_PATHS.onboarding}?${PLAN_INTENT_QUERY_PARAM}=${planIntent}`
    : BILLING_PATHS.onboarding;

  return (
    <AuthenticatedBoundary
      mode="public-only"
      authenticatedDestination={authenticatedDestination}
    >
      {children}
    </AuthenticatedBoundary>
  );
}

export default function SignupLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AuthSessionLoading />}>
      <SignupLayoutInner>{children}</SignupLayoutInner>
    </Suspense>
  );
}
