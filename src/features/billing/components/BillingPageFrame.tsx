import type { ReactNode } from "react";

import { AppHeader } from "@/components/shared/AppHeader";
import { DashboardHeaderActions } from "@/features/dashboard";

type BillingPageFrameProps = {
  title?: string;
  children: ReactNode;
};

export function BillingPageFrame({
  title = "Billing & Subscription",
  children,
}: BillingPageFrameProps) {
  return (
    <div className="flex min-h-screen flex-col rounded-b-page bg-base-black font-[family-name:var(--font-inter)] text-text-body lg:[--layout-header-height:108px]">
      <AppHeader actions={<DashboardHeaderActions />} />
      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 pt-10 pb-14 sm:px-6 lg:pr-10 lg:pl-12 lg:pt-11">
        <h1 className="text-[clamp(30px,2.083vw,40px)] font-medium text-white">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
