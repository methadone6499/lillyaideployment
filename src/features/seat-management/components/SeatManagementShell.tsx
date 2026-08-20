import { AppHeader } from "@/components/shared/AppHeader";
import {
  ArrowNarrowLeftIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";
import { DashboardHeaderActions } from "@/features/dashboard";
import Link from "next/link";
import { SeatManagementContent } from "./SeatManagementContent";

export function SeatManagementShell() {
  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader
        actions={<DashboardHeaderActions />}
      />

      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 pt-8 pb-14 sm:px-6 sm:pt-10 lg:px-12 lg:pt-11">
        <nav aria-label="Seat management navigation" className="flex items-center">
          <Link
            href="/company-admin/dashboard"
            className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2.5 rounded-button border border-border-default bg-surface-default pr-5 pl-3.5 text-label font-medium text-white transition-colors hover:bg-surface-elevated sm:pr-[22px] sm:text-body-lg"
          >
            <ArrowNarrowLeftIcon />
            <span>Back to Dashboard</span>
          </Link>

          <span
            aria-hidden
            className="mx-9 hidden h-9 w-px bg-border-default md:block"
          />

          <ol className="hidden items-center gap-2 text-body-lg md:flex">
            <li>
              <Link
                href="/company-admin/dashboard"
                className="font-medium text-text-step transition-colors hover:text-white"
              >
                Dashboard
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRightIcon className="size-[18px] text-text-step" />
            </li>
            <li aria-current="page" className="font-medium text-white">
              Seat Management
            </li>
          </ol>
        </nav>

        <SeatManagementContent />
      </main>
    </div>
  );
}
