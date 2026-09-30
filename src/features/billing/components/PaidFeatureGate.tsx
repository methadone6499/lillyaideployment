"use client";

import { Button } from "@/components/ui";
import {
  AuthFormAlert,
  AuthSessionLoading,
  buildLoginRedirect,
  useAuthUser,
} from "@/features/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useSubscriptionOverview } from "../hooks/useSubscriptionOverview";
import { classifyBillingError } from "../utils/classifyBillingError";
import { resolvePaidActionFailurePath } from "../utils/resolveBillingDestination";
import {
  canUsePaidFeature,
  type PaidFeatureName,
} from "../utils/selectBillingCapabilities";
import { BillingFlowAlert } from "./BillingFlowAlert";
import { BillingRequestId } from "./BillingRequestId";

type PaidFeatureGateProps = {
  feature: PaidFeatureName;
  children: ReactNode;
};

export function PaidFeatureGate({ feature, children }: PaidFeatureGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authMe } = useAuthUser();
  const overviewQuery = useSubscriptionOverview();
  const overview = overviewQuery.data;
  const classified = overviewQuery.error
    ? classifyBillingError(overviewQuery.error)
    : null;
  const hasInvalidSession = classified?.kind === "invalid_session";
  const allowed =
    overview !== undefined && canUsePaidFeature(overview, feature, authMe);

  useEffect(() => {
    if (hasInvalidSession) {
      router.replace(buildLoginRedirect(pathname));
      return;
    }

    if (overview && !allowed) {
      router.replace(
        resolvePaidActionFailurePath("subscription_required", overview),
      );
    }
  }, [allowed, hasInvalidSession, overview, pathname, router]);

  if (overviewQuery.isPending || hasInvalidSession || (overview && !allowed)) {
    return <AuthSessionLoading />;
  }

  if (!overview) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface-default px-6">
        <BillingFlowAlert classified={classified} />
        {classified ? null : (
          <AuthFormAlert variant="error">
            We could not load your billing state. Please try again.
          </AuthFormAlert>
        )}
        {classified?.retryable || !classified ? (
          <Button
            type="button"
            className="h-12 w-fit text-label"
            onClick={() => {
              void overviewQuery.refetch();
            }}
            disabled={overviewQuery.isFetching}
          >
            {overviewQuery.isFetching ? "Refreshing..." : "Try again"}
          </Button>
        ) : null}
        <BillingRequestId requestId={classified?.requestId} />
      </div>
    );
  }

  return children;
}
