import type { ReactNode } from "react";
import Link from "next/link";

import { AppHeader } from "@/components/shared/AppHeader";
import {
  ArrowNarrowLeftIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";
import { DashboardHeaderActions } from "@/features/dashboard";

type AdminManagementPageShellProps = {
  title: string;
  parentLabel?: string;
  parentHref?: string;
  children: ReactNode;
};

export function AdminManagementPageShell({
  title,
  parentLabel = "Super Admin Dashboard",
  parentHref = "/super-admin/dashboard",
  children,
}: AdminManagementPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader actions={<DashboardHeaderActions />} />

      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 pt-8 pb-14 sm:px-6 sm:pt-10 lg:px-12 lg:pt-11">
        <nav aria-label={`${title} navigation`} className="flex items-center">
          <Link
            href={parentHref}
            className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2.5 rounded-button border border-border-default bg-surface-default pr-5 pl-3.5 text-label font-medium text-white transition-colors hover:bg-surface-elevated sm:pr-[22px] sm:text-body-lg"
          >
            <ArrowNarrowLeftIcon />
            <span>Back to {parentLabel}</span>
          </Link>

          <span aria-hidden className="mx-9 hidden h-9 w-px bg-border-default md:block" />

          <ol className="hidden items-center gap-2 text-body-lg md:flex">
            <li>
              <Link href={parentHref} className="font-medium text-text-step transition-colors hover:text-white">
                {parentLabel}
              </Link>
            </li>
            <li aria-hidden><ChevronRightIcon className="size-[18px] text-text-step" /></li>
            <li aria-current="page" className="font-medium text-white">{title}</li>
          </ol>
        </nav>

        <h1 className="mt-11 text-[32px] leading-tight font-medium text-white sm:text-page-title lg:mt-12">
          {title}
        </h1>

        {children}
      </main>
    </div>
  );
}
