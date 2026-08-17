import { AppHeader } from "@/components/shared/AppHeader";
import {
  DashboardHeaderActions,
  type AccountMenuVariant,
} from "@/features/dashboard";
import { billingPageData } from "../data/billingData";
import { BillingPlanCard } from "./BillingPlanCard";
import { CurrentSubscriptionCard } from "./CurrentSubscriptionCard";
import { PaymentInformationCard } from "./PaymentInformationCard";
import { RecentInvoicesTable } from "./RecentInvoicesTable";

type BillingShellProps = {
  accountMenuVariant?: AccountMenuVariant;
};

export function BillingShell({
  accountMenuVariant = "standard",
}: BillingShellProps) {
  const { subscription, paymentMethod, plans, invoices } = billingPageData;

  return (
    <div className="flex min-h-screen flex-col rounded-b-page bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader
        actions={
          <DashboardHeaderActions accountMenuVariant={accountMenuVariant} />
        }
      />

      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 pt-10 pb-14 sm:px-6 lg:px-12 lg:pt-11">
        <h1 className="text-[clamp(30px,2.083vw,40px)] font-medium text-white">
          Billing &amp; Subscription
        </h1>

        <section
          aria-label="Current subscription and payment information"
          className="mt-12 grid gap-4 xl:grid-cols-[minmax(0,1.568fr)_minmax(400px,1fr)]"
        >
          <CurrentSubscriptionCard subscription={subscription} />
          <PaymentInformationCard paymentMethod={paymentMethod} />
        </section>

        <section
          aria-labelledby="change-plan-heading"
          className="mt-12 max-w-[1488px]"
        >
          <h2
            id="change-plan-heading"
            className="text-card-title font-medium text-white"
          >
            Change plan
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <BillingPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>

        <section aria-label="Billing history" className="mt-12 max-w-[1488px]">
          <RecentInvoicesTable invoices={invoices} />
        </section>
      </main>
    </div>
  );
}
