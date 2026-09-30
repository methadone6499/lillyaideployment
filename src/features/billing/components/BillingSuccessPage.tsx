"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui";
import {
  AuthFormAlert,
  AuthPageShell,
  AuthSessionLoading,
  buildLoginRedirect,
  useCurrentUserQuery,
} from "@/features/auth";

import { useSubscriptionReconciliation } from "../hooks/useSubscriptionReconciliation";
import { classifyBillingError } from "../utils/classifyBillingError";
import { resolvePostAuthBillingDestination } from "../utils/resolveBillingDestination";
import { BillingHostedActions } from "./BillingHostedActions";
import { BillingRequestId } from "./BillingRequestId";

export function BillingSuccessPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me } = useCurrentUserQuery();
  const reconciliation = useSubscriptionReconciliation();
  const { uiState } = reconciliation;
  const hasInvalidSession =
    Boolean(reconciliation.error) &&
    classifyBillingError(reconciliation.error).kind === "invalid_session";
  const reconciledOverview =
    uiState.kind === "reconciled" ? uiState.overview : null;

  useEffect(() => {
    if (hasInvalidSession) {
      router.replace(buildLoginRedirect(pathname));
    }
  }, [hasInvalidSession, pathname, router]);

  useEffect(() => {
    if (!me || !reconciledOverview) {
      return;
    }

    router.replace(
      resolvePostAuthBillingDestination({
        me,
        overview: reconciledOverview,
      }),
    );
  }, [me, reconciledOverview, router]);

  if (hasInvalidSession || uiState.kind === "reconciled") {
    return <AuthSessionLoading />;
  }

  if (uiState.kind === "terminal") {
    return (
      <AuthPageShell title="We could not confirm billing">
        <div className="flex flex-col gap-6">
          <AuthFormAlert variant="error">{uiState.message}</AuthFormAlert>
          <p className="text-center text-label text-white/48">
            Payment is not inferred from this page. Refresh to reload the
            server billing state, or contact support with the reference below.
          </p>
          <Button
            type="button"
            onClick={() => {
              reconciliation.restart();
            }}
            disabled={reconciliation.isFetching}
          >
            {reconciliation.isFetching ? "Refreshing..." : "Refresh"}
          </Button>
          <BillingRequestId requestId={uiState.requestId} />
        </div>
      </AuthPageShell>
    );
  }

  if (uiState.kind === "timeout") {
    return (
      <AuthPageShell title="Still confirming your plan">
        <div className="flex flex-col gap-6">
          <AuthFormAlert variant="info" role="status">
            Billing has not confirmed paid access yet. This page does not
            unlock features from the Stripe return URL.
          </AuthFormAlert>
          <BillingHostedActions
            checkoutUrl={uiState.checkoutUrl}
            hostedInvoiceUrl={uiState.hostedInvoiceUrl}
            disabled={reconciliation.isFetching}
          />
          <Button
            type="button"
            onClick={() => {
              reconciliation.restart();
            }}
            disabled={reconciliation.isFetching}
          >
            {reconciliation.isFetching ? "Refreshing..." : "Refresh"}
          </Button>
          <BillingRequestId requestId={uiState.requestId} />
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell title="Confirming your subscription">
      <div className="flex flex-col gap-6">
        <AuthFormAlert variant="info" role="status">
          Waiting for the server to confirm your subscription. Access is not
          granted from this redirect.
        </AuthFormAlert>
        <BillingHostedActions
          checkoutUrl={uiState.checkoutUrl}
          hostedInvoiceUrl={uiState.hostedInvoiceUrl}
          disabled={reconciliation.isFetching}
        />
        <p className="text-center text-label text-white/48">
          This can take a few seconds. You can resume checkout or complete
          payment if those links appear.
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            reconciliation.restart();
          }}
          disabled={reconciliation.isFetching}
        >
          {reconciliation.isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
    </AuthPageShell>
  );
}
