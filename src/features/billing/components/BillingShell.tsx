"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, Card } from "@/components/ui";
import {
  AuthFormAlert,
  buildLoginRedirect,
  getAuthUserInstitutionName,
  useCurrentUserQuery,
} from "@/features/auth";

import {
  useCancelEnterpriseDowngradeMutation,
  useCreatePortalMutation,
  useScheduleEnterpriseDowngradeMutation,
  useUpgradeSubscriptionMutation,
} from "../hooks/useBillingMutations";
import { useSubscriptionOverview } from "../hooks/useSubscriptionOverview";
import type { PlanType } from "../schemas/billingSchemas";
import { assignHostedBillingUrl } from "../utils/assignHostedBillingUrl";
import { BILLING_PATHS } from "../utils/billingConstants";
import {
  classifyBillingError,
  type ClassifiedBillingError,
} from "../utils/classifyBillingError";
import { formatPlanName } from "../utils/formatBilling";
import {
  hasScheduledEnterpriseDowngrade,
  selectBillingOwnerCapabilities,
  selectBillingQuotaView,
  type BillingOwnerCapabilities,
} from "../utils/selectBillingCapabilities";
import {
  getBillingOverviewPollInterval,
  getHostedInvoiceUrl,
  getResumableCheckoutUrl,
  selectBillingSettingsKind,
  selectCheckoutActionState,
} from "../utils/selectBillingOverviewUi";
import {
  selectBillingPlanCards,
  type BillingPlanCardAction,
} from "../utils/selectBillingPlanCards";
import { BillingFlowAlert } from "./BillingFlowAlert";
import { BillingHostedActions } from "./BillingHostedActions";
import { BillingOwnerActions } from "./BillingOwnerActions";
import { BillingPageFrame } from "./BillingPageFrame";
import { BillingPlansSection } from "./BillingPlansSection";
import { BillingRequestId } from "./BillingRequestId";
import { CurrentSubscriptionCard } from "./CurrentSubscriptionCard";
import { EnterpriseDowngradeDialog } from "./EnterpriseDowngradeDialog";
import { OperationLockBanner } from "./OperationLockBanner";
import { PaymentInformationCard } from "./PaymentInformationCard";
import { RecentInvoicesTable } from "./RecentInvoicesTable";
import { ScheduledDowngradeCard } from "./ScheduledDowngradeCard";

const ALERT_DESTINATION_LABELS: Partial<
  Record<ClassifiedBillingError["kind"], string>
> = {
  subscription_payment_pending: "Open Custom plan payment",
  enterprise_capacity_exceeded: "Manage seats and invitations",
  custom_subscription_request_active: "Open Custom plan request",
};

function BillingAlertDestination({
  classified,
}: {
  classified: ClassifiedBillingError | null;
}) {
  const label = classified ? ALERT_DESTINATION_LABELS[classified.kind] : null;

  if (!label || !classified?.destination) {
    return null;
  }

  return (
    <Link
      href={classified.destination}
      className="w-fit text-label font-medium text-brand underline underline-offset-2"
    >
      {label}
    </Link>
  );
}

function hiddenOwnerCapabilities(
  capabilities: BillingOwnerCapabilities,
): BillingOwnerCapabilities {
  return {
    ...capabilities,
    isOwner: false,
    canOpenPortal: false,
    canUpgradeToEnterprise: false,
    requiresPortalBeforeUpgrade: false,
    canRequestCustom: false,
    canScheduleEnterpriseDowngrade: false,
    canCancelEnterpriseDowngrade: false,
  };
}

export function BillingShell() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me } = useCurrentUserQuery();
  const overviewQuery = useSubscriptionOverview({
    staleTime: 0,
    refetchInterval: (query) =>
      getBillingOverviewPollInterval(query.state.data),
  });
  const portalMutation = useCreatePortalMutation();
  const upgradeMutation = useUpgradeSubscriptionMutation();
  const downgradeMutation = useScheduleEnterpriseDowngradeMutation();
  const cancelDowngradeMutation = useCancelEnterpriseDowngradeMutation();
  const [upgradeFormOpen, setUpgradeFormOpen] = useState(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<ClassifiedBillingError | null>(
    null,
  );
  const overview = overviewQuery.data;
  const overviewClassified = overviewQuery.error
    ? classifyBillingError(overviewQuery.error)
    : null;
  const classifiedAlert =
    actionError && actionError.kind !== "invalid_session"
      ? actionError
      : overviewClassified;
  const hasInvalidSession =
    overviewClassified?.kind === "invalid_session" ||
    actionError?.kind === "invalid_session";
  const hideOwnerControls = Boolean(classifiedAlert?.hideOwnerControls);

  useEffect(() => {
    if (hasInvalidSession) {
      router.replace(buildLoginRedirect(pathname));
    }
  }, [hasInvalidSession, pathname, router]);

  const handlePortal = async () => {
    try {
      const response = await portalMutation.mutateAsync();
      setActionError(null);

      if (!assignHostedBillingUrl(response.url)) {
        setActionError(
          classifyBillingError(
            new Error("The billing portal opened, but the hosted page could not be started."),
          ),
        );
      }
    } catch (error) {
      setActionError(classifyBillingError(error));
    }
  };

  const handleUpgrade = async (companyName: string) => {
    try {
      const response = await upgradeMutation.mutateAsync({
        company_name: companyName,
      });
      setActionError(null);
      setUpgradeFormOpen(false);

      if (
        response.hosted_invoice_url &&
        !assignHostedBillingUrl(response.hosted_invoice_url)
      ) {
        setActionError(
          classifyBillingError(
            new Error("The upgrade started, but the hosted invoice page could not be opened."),
          ),
        );
      }
    } catch (error) {
      setActionError(classifyBillingError(error));
    }
  };

  const handleScheduleDowngrade = async () => {
    try {
      await downgradeMutation.mutateAsync();
      setActionError(null);
      setDowngradeDialogOpen(false);
    } catch (error) {
      setActionError(classifyBillingError(error));
    }
  };

  const handleCancelDowngrade = async () => {
    try {
      await cancelDowngradeMutation.mutateAsync();
      setActionError(null);
    } catch (error) {
      setActionError(classifyBillingError(error));
    }
  };

  if (!me || overviewQuery.isPending || hasInvalidSession) {
    return (
      <BillingPageFrame>
        <p className="mt-12 text-input text-text-muted" role="status">
          Loading billing…
        </p>
      </BillingPageFrame>
    );
  }

  if (!overview) {
    return (
      <BillingPageFrame>
        <div className="mt-12 flex max-w-xl flex-col gap-4">
          <BillingFlowAlert classified={overviewClassified} />
          {overviewClassified ? null : (
            <AuthFormAlert variant="error" className="text-left">
              We could not load your billing state. Please try again.
            </AuthFormAlert>
          )}
          {overviewClassified?.retryable ? (
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
          <BillingRequestId requestId={overviewClassified?.requestId} />
        </div>
      </BillingPageFrame>
    );
  }

  const settingsKind = selectBillingSettingsKind(overview, me);
  const quotaView = selectBillingQuotaView(overview, me);
  const ownerCapabilities = hideOwnerControls
    ? hiddenOwnerCapabilities(selectBillingOwnerCapabilities(overview, me))
    : selectBillingOwnerCapabilities(overview, me);
  const checkoutUrl = getResumableCheckoutUrl(overview.checkout);
  const hostedInvoiceUrl = getHostedInvoiceUrl(overview.plan_change);
  const checkoutAction = overview.checkout
    ? selectCheckoutActionState(overview.checkout)
    : null;
  const isBusy =
    portalMutation.isPending ||
    upgradeMutation.isPending ||
    downgradeMutation.isPending ||
    cancelDowngradeMutation.isPending;
  const scheduledDowngrade = hasScheduledEnterpriseDowngrade(overview);
  const plans = selectBillingPlanCards(overview, ownerCapabilities, isBusy);
  const showPlanComparison =
    !hideOwnerControls &&
    (settingsKind === "picker" ||
      (settingsKind === "subscription" && ownerCapabilities.isOwner));
  const companyNameError = classifiedAlert?.fieldErrors.company_name ?? null;
  const showAlert =
    Boolean(classifiedAlert?.message) &&
    classifiedAlert?.kind !== "aborted" &&
    classifiedAlert?.kind !== "invalid_session";

  const openPortal = () => {
    if (!isBusy && ownerCapabilities.canOpenPortal) {
      void handlePortal();
    }
  };
  const openUpgrade = () => {
    if (!isBusy && ownerCapabilities.canUpgradeToEnterprise) {
      setUpgradeFormOpen(true);
    }
  };
  const openCustomRequest = () => router.push(BILLING_PATHS.custom);
  const openDowngrade = () => {
    if (!isBusy && ownerCapabilities.canScheduleEnterpriseDowngrade) {
      setActionError(null);
      setDowngradeDialogOpen(true);
    }
  };
  const handlePlanAction = (action: BillingPlanCardAction, plan: PlanType) => {
    const selectedPlan = plans.find((option) => option.id === plan);
    if (!selectedPlan || selectedPlan.disabled || selectedPlan.action !== action) {
      return;
    }

    switch (action) {
      case "subscribe":
        router.push(`${BILLING_PATHS.onboarding}?plan=${plan}`);
        break;
      case "upgrade":
        openUpgrade();
        break;
      case "portal":
        openPortal();
        break;
      case "custom":
        openCustomRequest();
        break;
      case "downgrade":
        openDowngrade();
        break;
      case "none":
        break;
    }
  };

  return (
    <BillingPageFrame>
      <OperationLockBanner className="mt-8 max-w-[1488px]" />
      {showAlert && !downgradeDialogOpen ? (
        <div className="mt-12 flex flex-col gap-4">
          <BillingFlowAlert classified={classifiedAlert} />
          <BillingAlertDestination classified={classifiedAlert} />
          {classifiedAlert?.retryable ? (
            <Button
              type="button"
              className="h-12 w-fit text-label"
              onClick={() => {
                setActionError(null);
                void overviewQuery.refetch();
              }}
              disabled={overviewQuery.isFetching}
            >
              {overviewQuery.isFetching ? "Refreshing..." : "Try again"}
            </Button>
          ) : null}
          <BillingRequestId requestId={classifiedAlert?.requestId} />
        </div>
      ) : null}

      {settingsKind === "super_admin" ? (
        <Card className="mt-12 max-w-xl rounded-button p-6">
          <p className="text-input font-medium text-white">
            A subscription is not required for this account.
          </p>
          <p className="mt-3 text-helper text-text-muted">
            Super Admin access is not billed or quota-limited. There is no
            portal, upgrade, or Custom purchase from this page.
          </p>
        </Card>
      ) : null}

      {settingsKind === "subscription" && overview.subscription ? (
        <section
          aria-label="Current subscription and payment information"
          className="mt-12 grid gap-4 xl:grid-cols-[minmax(0,1.568fr)_minmax(400px,1fr)]"
        >
          <CurrentSubscriptionCard
            subscription={overview.subscription}
            canUsePaidFeatures={overview.can_use_paid_features}
            quotaView={quotaView}
            capabilities={ownerCapabilities}
            disabled={isBusy}
            isPortalPending={portalMutation.isPending}
            onOpenPortal={openPortal}
            onUpgrade={openUpgrade}
            onRequestCustom={openCustomRequest}
          />
          <PaymentInformationCard
            canManage={ownerCapabilities.canOpenPortal}
            disabled={isBusy}
            isPortalPending={portalMutation.isPending}
            onOpenPortal={openPortal}
          />
        </section>
      ) : null}

      {overview.plan_change && scheduledDowngrade ? (
        <ScheduledDowngradeCard
          planChange={overview.plan_change}
          subscription={overview.subscription}
          canCancel={
            !hideOwnerControls && ownerCapabilities.canCancelEnterpriseDowngrade
          }
          isCancelPending={cancelDowngradeMutation.isPending}
          disabled={isBusy}
          onCancelDowngrade={() => {
            void handleCancelDowngrade();
          }}
        />
      ) : null}

      {overview.plan_change &&
      !scheduledDowngrade &&
      overview.plan_change.status !== "cancelled" ? (
        <Card className="mt-12 flex max-w-[1488px] flex-col gap-4 rounded-button p-6">
          <h2 className="text-card-title font-medium text-white">
            Enterprise upgrade pending
          </h2>
          <p className="text-input text-text-body">
            An upgrade to {formatPlanName(overview.plan_change.to_plan)} for{" "}
            {overview.plan_change.company_name} is still processing.
          </p>
          <BillingHostedActions
            hostedInvoiceUrl={hostedInvoiceUrl}
            disabled={isBusy}
          />
          <Button
            type="button"
            variant="secondary"
            className="h-12 w-fit text-label"
            onClick={() => {
              void overviewQuery.refetch();
            }}
            disabled={overviewQuery.isFetching}
          >
            {overviewQuery.isFetching ? "Refreshing..." : "Refresh status"}
          </Button>
        </Card>
      ) : null}

      {overview.checkout && settingsKind !== "subscription" ? (
        <Card className="mt-12 flex max-w-[1488px] flex-col gap-4 rounded-button p-6">
          <h2 className="text-card-title font-medium text-white">
            {checkoutAction === "creating"
              ? "Preparing checkout"
              : checkoutAction === "payment_pending"
                ? "Payment processing"
                : "Resume checkout"}
          </h2>
          <p className="text-input text-text-body">
            A {formatPlanName(overview.checkout.plan_type)} checkout session is
            still active. Access stays locked until billing confirms a paid
            subscription.
          </p>
          <BillingHostedActions
            checkoutUrl={checkoutUrl}
            disabled={isBusy || checkoutAction === "creating"}
          />
          {checkoutAction !== "creating" ? (
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-fit text-label"
              onClick={() => {
                void overviewQuery.refetch();
              }}
              disabled={overviewQuery.isFetching}
            >
              {overviewQuery.isFetching ? "Refreshing..." : "Refresh status"}
            </Button>
          ) : null}
        </Card>
      ) : null}

      {overview.checkout && settingsKind === "subscription" && checkoutUrl ? (
        <Card className="mt-12 flex max-w-[1488px] flex-col gap-4 rounded-button p-6">
          <h2 className="text-card-title font-medium text-white">
            Open checkout
          </h2>
          <BillingHostedActions checkoutUrl={checkoutUrl} disabled={isBusy} />
        </Card>
      ) : null}

      {settingsKind === "subscription" &&
      overview.subscription &&
      !ownerCapabilities.isOwner ? (
        <p className="mt-8 text-helper text-text-muted">
          Only the billing owner can open the portal or start an Enterprise
          upgrade.
        </p>
      ) : null}

      {settingsKind === "subscription" && upgradeFormOpen ? (
        <BillingOwnerActions
          capabilities={ownerCapabilities}
          institutionName={getAuthUserInstitutionName(me.user)}
          disabled={isBusy}
          companyNameError={companyNameError}
          isUpgradePending={upgradeMutation.isPending}
          feedback={
            showAlert ? <BillingFlowAlert classified={classifiedAlert} /> : null
          }
          onCancel={() => setUpgradeFormOpen(false)}
          onUpgrade={(companyName) => {
            void handleUpgrade(companyName);
          }}
          onCompanyNameChange={() => {
            if (actionError?.kind === "validation_error") {
              setActionError(null);
            }
          }}
        />
      ) : null}

      {downgradeDialogOpen && overview.subscription ? (
        <EnterpriseDowngradeDialog
          subscription={overview.subscription}
          isPending={downgradeMutation.isPending}
          feedback={
            showAlert ? (
              <div className="flex flex-col gap-2">
                <BillingFlowAlert classified={classifiedAlert} />
                <BillingAlertDestination classified={classifiedAlert} />
              </div>
            ) : null
          }
          onConfirm={() => {
            void handleScheduleDowngrade();
          }}
          onCancel={() => {
            setActionError(null);
            setDowngradeDialogOpen(false);
          }}
        />
      ) : null}

      {showPlanComparison ? (
        <BillingPlansSection plans={plans} onAction={handlePlanAction} />
      ) : null}

      {settingsKind === "subscription" ? (
        <RecentInvoicesTable
          canManage={ownerCapabilities.canOpenPortal}
          disabled={isBusy}
          isPortalPending={portalMutation.isPending}
          onOpenPortal={openPortal}
        />
      ) : null}
    </BillingPageFrame>
  );
}
