"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";

import { Button } from "@/components/ui";
import {
  AuthField,
  AuthFormAlert,
  AuthGradientLink,
  AuthPageShell,
  AuthSessionLoading,
  AuthSubmitButton,
  buildLoginRedirect,
  getAuthUserInstitutionName,
  getReviewerDestination,
  useCurrentUserQuery,
} from "@/features/auth";

import { useCreateCheckoutMutation } from "../hooks/useBillingMutations";
import { useSubscriptionOverview } from "../hooks/useSubscriptionOverview";
import {
  companyNameSchema,
  type PlanIntent,
} from "../schemas/billingSchemas";
import { assignHostedBillingUrl } from "../utils/assignHostedBillingUrl";
import { BILLING_PATHS } from "../utils/billingConstants";
import {
  classifyBillingError,
  type ClassifiedBillingError,
} from "../utils/classifyBillingError";
import {
  readPlanIntent,
  storePlanIntent,
} from "../utils/planIntent";
import { resolveOnboardingExitPath } from "../utils/resolveBillingDestination";
import { canRequestCustomPlan } from "../utils/selectBillingCapabilities";
import {
  getBillingOverviewPollInterval,
  getHostedInvoiceUrl,
  getResumableCheckoutUrl,
  selectBillingOverviewUiState,
  selectCheckoutActionState,
} from "../utils/selectBillingOverviewUi";
import { BillingFlowAlert } from "./BillingFlowAlert";
import { BillingHostedActions } from "./BillingHostedActions";
import { BillingRequestId } from "./BillingRequestId";

type SubscriptionOnboardingPageProps = {
  returnTo?: string | null;
  planIntent?: PlanIntent | null;
};

const ONBOARDING_PLANS: ReadonlyArray<{
  id: PlanIntent;
  name: string;
  highlight: string;
  priceLabel: string;
  ctaLabel: string;
}> = [
  {
    id: "standard",
    name: "Standard",
    highlight: "30 monthly reports",
    priceLabel: "£480/mo",
    ctaLabel: "Continue with Standard",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    highlight: "10 seats / 100 company reports",
    priceLabel: "£2,400/mo",
    ctaLabel: "Continue with Enterprise",
  },
  {
    id: "custom",
    name: "Custom",
    highlight: "Negotiated seats and monthly reports",
    priceLabel: "Custom pricing",
    ctaLabel: "Request a Custom plan",
  },
];

function subscribePlanIntent() {
  return () => {};
}

function formatPlanLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function SubscriptionOnboardingPage({
  returnTo = null,
  planIntent = null,
}: SubscriptionOnboardingPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me } = useCurrentUserQuery();
  const reviewerDestination = getReviewerDestination(me, returnTo);
  const checkoutMutation = useCreateCheckoutMutation();
  const overviewQuery = useSubscriptionOverview({
    enabled: Boolean(me) && !reviewerDestination,
    staleTime: 0,
    refetchInterval: (query) =>
      getBillingOverviewPollInterval(query.state.data),
  });
  const [intentOverride, setIntentOverride] = useState<
    PlanIntent | "picker" | null
  >(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyNameError, setCompanyNameError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<ClassifiedBillingError | null>(
    null,
  );
  const storedIntent = useSyncExternalStore(
    subscribePlanIntent,
    readPlanIntent,
    () => planIntent,
  );
  const selectedIntent =
    intentOverride === "picker"
      ? null
      : (intentOverride ?? planIntent ?? storedIntent);
  const institutionName = getAuthUserInstitutionName(me?.user);
  const companyNameValue = companyName ?? institutionName;
  const overview = overviewQuery.data;
  const exitPath =
    reviewerDestination ??
    (me && overview
      ? resolveOnboardingExitPath({ me, overview, returnTo })
      : null);
  const overviewClassified = !reviewerDestination && overviewQuery.error
    ? classifyBillingError(overviewQuery.error)
    : null;
  const hasInvalidSession =
    overviewClassified?.kind === "invalid_session" ||
    actionError?.kind === "invalid_session";

  useEffect(() => {
    if (hasInvalidSession) {
      router.replace(buildLoginRedirect(pathname));
    }
  }, [hasInvalidSession, pathname, router]);

  useEffect(() => {
    if (exitPath) {
      router.replace(exitPath);
    }
  }, [exitPath, router]);

  if (planIntent && !reviewerDestination) {
    storePlanIntent(planIntent);
  }

  const selectIntent = (intent: PlanIntent | "picker") => {
    if (intent === "picker") {
      setIntentOverride("picker");
      setActionError(null);
      setCompanyNameError(null);
      return;
    }

    storePlanIntent(intent);
    setIntentOverride(intent);
    setActionError(null);
    setCompanyNameError(null);
  };

  const handleCheckoutError = (error: unknown) => {
    const classified = classifyBillingError(error);
    setActionError(classified);
    setCompanyNameError(classified.fieldErrors.company_name ?? null);
  };

  const startStandardCheckout = async () => {
    setActionError(null);
    setCompanyNameError(null);
    selectIntent("standard");

    try {
      const response = await checkoutMutation.mutateAsync({
        plan_type: "standard",
      });

      if (!assignHostedBillingUrl(response.checkout_url)) {
        setActionError(
          classifyBillingError(
            new Error("Checkout opened, but the hosted payment page could not be started."),
          ),
        );
      }
    } catch (error) {
      handleCheckoutError(error);
    }
  };

  const startEnterpriseCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);

    const parsed = companyNameSchema.safeParse(companyNameValue);
    if (!parsed.success) {
      setCompanyNameError(
        parsed.error.issues[0]?.message ??
          "Enter a company name between 1 and 200 characters.",
      );
      return;
    }

    setCompanyNameError(null);
    selectIntent("enterprise");

    try {
      const response = await checkoutMutation.mutateAsync({
        plan_type: "enterprise",
        company_name: parsed.data,
      });

      if (!assignHostedBillingUrl(response.checkout_url)) {
        setActionError(
          classifyBillingError(
            new Error("Checkout opened, but the hosted payment page could not be started."),
          ),
        );
      }
    } catch (error) {
      handleCheckoutError(error);
    }
  };

  if (!me || overviewQuery.isPending || exitPath || hasInvalidSession) {
    return <AuthSessionLoading />;
  }

  if (!overview) {
    return (
      <AuthPageShell title="Choose a plan">
        <div className="flex flex-col gap-6">
          <BillingFlowAlert classified={overviewClassified} />
          {overviewClassified ? null : (
            <AuthFormAlert variant="error">
              We could not load your billing state. Please try again.
            </AuthFormAlert>
          )}
          {overviewClassified?.retryable ? (
            <Button
              type="button"
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
      </AuthPageShell>
    );
  }

  const uiState = selectBillingOverviewUiState(overview);
  const classifiedAlert =
    actionError && actionError.kind !== "invalid_session" ? actionError : overviewClassified;
  const checkoutUrl = getResumableCheckoutUrl(overview.checkout);
  const hostedInvoiceUrl = getHostedInvoiceUrl(overview.plan_change);
  const isCheckoutPending = checkoutMutation.isPending;

  if (uiState.kind === "subscription") {
    return (
      <AuthPageShell title="Subscription required">
        <div className="flex flex-col gap-6">
          <AuthFormAlert variant="info" role="status">
            Your {formatPlanLabel(uiState.subscription.plan_type)} plan is{" "}
            {uiState.subscription.status.replace(/_/g, " ")}, but paid
            features are not currently available.
          </AuthFormAlert>
          <BillingFlowAlert classified={classifiedAlert} />
          <BillingHostedActions
            checkoutUrl={checkoutUrl}
            hostedInvoiceUrl={hostedInvoiceUrl}
            disabled={isCheckoutPending}
          />
          {uiState.subscription.scope_type === "company" &&
          canRequestCustomPlan(me) ? (
            <AuthGradientLink href={BILLING_PATHS.custom}>
              Restart with a Custom plan
            </AuthGradientLink>
          ) : null}
          <BillingRequestId requestId={classifiedAlert?.requestId} />
        </div>
      </AuthPageShell>
    );
  }

  if (uiState.kind === "plan_change") {
    return (
      <AuthPageShell title="Enterprise upgrade pending">
        <div className="flex flex-col gap-6">
          <AuthFormAlert variant="info" role="status">
            An upgrade to {formatPlanLabel(uiState.planChange.to_plan)} for{" "}
            {uiState.planChange.company_name} is still processing. Complete
            payment if prompted, then wait for access to refresh.
          </AuthFormAlert>
          <BillingFlowAlert classified={classifiedAlert} />
          <BillingHostedActions
            hostedInvoiceUrl={hostedInvoiceUrl}
            disabled={isCheckoutPending}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void overviewQuery.refetch();
            }}
            disabled={overviewQuery.isFetching}
          >
            {overviewQuery.isFetching ? "Refreshing..." : "Refresh status"}
          </Button>
          <BillingRequestId requestId={classifiedAlert?.requestId} />
        </div>
      </AuthPageShell>
    );
  }

  if (uiState.kind === "checkout") {
    const checkoutAction = selectCheckoutActionState(uiState.checkout);
    const checkoutTitle =
      checkoutAction === "creating"
        ? "Preparing checkout"
        : checkoutAction === "payment_pending"
          ? "Payment processing"
          : "Resume checkout";
    const checkoutMessage =
      checkoutAction === "creating"
        ? "Your checkout session is being created. This page will update automatically."
        : checkoutAction === "payment_pending"
          ? "Stripe has not confirmed the initial payment yet. You can wait here or resume the hosted checkout."
          : `A ${formatPlanLabel(uiState.checkout.plan_type)} checkout session is still open. Resume it to finish subscribing.`;

    return (
      <AuthPageShell title={checkoutTitle}>
        <div className="flex flex-col gap-6">
          <AuthFormAlert variant="info" role="status">
            {checkoutMessage}
          </AuthFormAlert>
          <BillingFlowAlert classified={classifiedAlert} />
          <BillingHostedActions
            checkoutUrl={checkoutUrl}
            disabled={isCheckoutPending || checkoutAction === "creating"}
          />
          {checkoutAction !== "creating" ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void overviewQuery.refetch();
              }}
              disabled={overviewQuery.isFetching}
            >
              {overviewQuery.isFetching ? "Refreshing..." : "Refresh status"}
            </Button>
          ) : null}
          <BillingRequestId requestId={classifiedAlert?.requestId} />
        </div>
      </AuthPageShell>
    );
  }

  const focusedPlan = ONBOARDING_PLANS.find((plan) => plan.id === selectedIntent);

  return (
    <AuthPageShell title="Choose a plan">
      <div className="flex flex-col gap-6">
        <AuthFormAlert variant="info" role="status">
          Select a plan to continue. Access stays locked until billing confirms
          a paid subscription.
        </AuthFormAlert>
        <BillingFlowAlert classified={classifiedAlert} />
        {classifiedAlert?.kind === "subscription_payment_pending" ? (
          <AuthGradientLink href={BILLING_PATHS.custom}>
            Open Custom plan payment
          </AuthGradientLink>
        ) : null}

        {focusedPlan && selectedIntent === "standard" ? (
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void startStandardCheckout();
            }}
          >
            <p className="text-center text-label text-landing-text-heading">
              {focusedPlan.name} · {focusedPlan.highlight} · {focusedPlan.priceLabel}
            </p>
            <AuthSubmitButton isSubmitting={isCheckoutPending}>
              {isCheckoutPending ? "Starting checkout..." : focusedPlan.ctaLabel}
            </AuthSubmitButton>
            <button
              type="button"
              className="text-center text-label text-white/48 underline underline-offset-2"
              onClick={() => selectIntent("picker")}
            >
              Choose a different plan
            </button>
          </form>
        ) : null}

        {focusedPlan && selectedIntent === "enterprise" ? (
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={startEnterpriseCheckout}
          >
            <p className="text-center text-label text-landing-text-heading">
              {focusedPlan.name} · {focusedPlan.highlight} · {focusedPlan.priceLabel}
            </p>
            <AuthField
              label="Company name"
              required
              autoComplete="organization"
              maxLength={200}
              value={companyNameValue}
              error={companyNameError}
              placeholder="Example Pharma"
              onChange={(event) => {
                setCompanyName(event.target.value);
                setCompanyNameError(null);
              }}
            />
            <AuthSubmitButton isSubmitting={isCheckoutPending}>
              {isCheckoutPending ? "Starting checkout..." : focusedPlan.ctaLabel}
            </AuthSubmitButton>
            <button
              type="button"
              className="text-center text-label text-white/48 underline underline-offset-2"
              onClick={() => selectIntent("picker")}
            >
              Choose a different plan
            </button>
          </form>
        ) : null}

        {focusedPlan && selectedIntent === "custom" ? (
          <div className="flex flex-col gap-4">
            <p className="text-center text-label text-landing-text-heading">
              {focusedPlan.name} · {focusedPlan.highlight}
            </p>
            <p className="text-center text-label text-white/48">
              Tell us the seats and reports you need. We&apos;ll review your
              request and email you an offer that is valid for 7 days.
            </p>
            <AuthGradientLink href={BILLING_PATHS.custom}>
              {focusedPlan.ctaLabel}
            </AuthGradientLink>
            <button
              type="button"
              className="text-center text-label text-white/48 underline underline-offset-2"
              onClick={() => selectIntent("picker")}
            >
              Choose a different plan
            </button>
          </div>
        ) : null}

        {selectedIntent === null ? (
          <div className="flex flex-col gap-4">
            {ONBOARDING_PLANS.map((plan) =>
              plan.id === "custom" ? (
                <Button
                  key={plan.id}
                  type="button"
                  variant="secondary"
                  onClick={() => selectIntent("custom")}
                >
                  {plan.name} · {plan.priceLabel}
                </Button>
              ) : plan.id === "standard" ? (
                <Button
                  key={plan.id}
                  type="button"
                  disabled={isCheckoutPending}
                  onClick={() => selectIntent("standard")}
                >
                  {plan.name} · {plan.priceLabel}
                </Button>
              ) : (
                <Button
                  key={plan.id}
                  type="button"
                  variant="secondary"
                  disabled={isCheckoutPending}
                  onClick={() => selectIntent("enterprise")}
                >
                  {plan.name} · {plan.priceLabel}
                </Button>
              ),
            )}
          </div>
        ) : null}

        <BillingRequestId requestId={classifiedAlert?.requestId} />
      </div>
    </AuthPageShell>
  );
}
