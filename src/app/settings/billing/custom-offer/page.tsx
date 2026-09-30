import { CustomSubscriptionPage } from "@/features/custom-subscriptions";

export const dynamic = "force-dynamic";

type CustomOfferRoutePageProps = {
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

/** Email-link entry point; `offer_id` is informational only. */
export default async function CustomOfferRoutePage({
  searchParams,
}: CustomOfferRoutePageProps) {
  const params = await searchParams;

  return (
    <CustomSubscriptionPage
      offerIdHint={firstSearchParam(params.offer_id) ?? null}
    />
  );
}
