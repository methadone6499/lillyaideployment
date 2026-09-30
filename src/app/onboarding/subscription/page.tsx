import {
  sanitizePlanIntentParam,
  SubscriptionOnboardingPage,
} from "@/features/billing";

export const dynamic = "force-dynamic";

type SubscriptionOnboardingRoutePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function SubscriptionOnboardingRoutePage({
  searchParams,
}: SubscriptionOnboardingRoutePageProps) {
  const params = await searchParams;

  return (
    <SubscriptionOnboardingPage
      returnTo={firstSearchParam(params.returnTo) ?? null}
      planIntent={sanitizePlanIntentParam(params.plan)}
    />
  );
}
