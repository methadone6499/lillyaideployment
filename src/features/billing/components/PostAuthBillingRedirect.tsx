"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui";
import {
  AuthFormAlert,
  AuthPageShell,
  AuthSessionLoading,
  getReviewerDestination,
  useCurrentUserQuery,
} from "@/features/auth";

import { useSubscriptionOverview } from "../hooks/useSubscriptionOverview";
import { classifyBillingError } from "../utils/classifyBillingError";
import { resolvePostAuthBillingDestination } from "../utils/resolveBillingDestination";
import { BillingFlowAlert } from "./BillingFlowAlert";

export function PostAuthBillingRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: me } = useCurrentUserQuery();
  const returnTo = searchParams.get("returnTo");
  const reviewerDestination = getReviewerDestination(me, returnTo);
  const overviewQuery = useSubscriptionOverview({
    enabled: Boolean(me) && !reviewerDestination,
    staleTime: 0,
  });
  const classified = overviewQuery.error
    ? classifyBillingError(overviewQuery.error)
    : null;
  const billingDestination =
    me &&
    overviewQuery.data &&
    !overviewQuery.isFetching &&
    !overviewQuery.isError
      ? resolvePostAuthBillingDestination({
          me,
          overview: overviewQuery.data,
          returnTo,
        })
      : null;
  const destination = reviewerDestination ?? billingDestination;

  useEffect(() => {
    if (destination) {
      router.replace(destination);
    }
  }, [destination, router]);

  if (!me || overviewQuery.isPending || destination) {
    return <AuthSessionLoading />;
  }

  if (overviewQuery.isError) {
    return (
      <AuthPageShell title="We could not check your subscription">
        <div className="flex flex-col gap-6">
          <BillingFlowAlert classified={classified} />
          {classified ? null : (
            <AuthFormAlert variant="error">
              Please try again to check your subscription.
            </AuthFormAlert>
          )}
          {!classified || classified.retryable ? (
            <Button
              disabled={overviewQuery.isFetching}
              onClick={() => {
                void overviewQuery.refetch();
              }}
            >
              {overviewQuery.isFetching ? "Checking..." : "Try again"}
            </Button>
          ) : null}
        </div>
      </AuthPageShell>
    );
  }

  return <AuthSessionLoading />;
}
