import { Button, Card } from "@/components/ui";
import type { BillingSubscription } from "../schemas/billingSchemas";

type CurrentSubscriptionCardProps = {
  subscription: BillingSubscription;
};

export function CurrentSubscriptionCard({
  subscription,
}: CurrentSubscriptionCardProps) {
  return (
    <Card className="flex min-h-[247px] flex-col rounded-button p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-card bg-brand/12 px-2.5 py-2 text-input font-medium leading-none text-brand">
          {subscription.planName}
        </span>
        <span className="text-input font-medium text-white">
          {subscription.renewalLabel}
        </span>
      </div>

      <p className="mt-4 leading-none font-medium text-brand">
        <span className="text-[42px]">{subscription.price}</span>
        <span className="text-card-title text-brand/40">
          {subscription.priceSuffix}
        </span>
      </p>

      <p className="mt-3 text-input font-medium text-text-body">
        {subscription.billingSummary}
      </p>

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Button
          className="h-12 text-label"
          title="Available when billing services are connected"
        >
          {subscription.primaryActionLabel}
        </Button>
        <Button
          variant="secondary"
          className="h-12 border-transparent bg-white/4 text-label"
          title="Available when billing services are connected"
        >
          {subscription.secondaryActionLabel}
        </Button>
      </div>
    </Card>
  );
}

