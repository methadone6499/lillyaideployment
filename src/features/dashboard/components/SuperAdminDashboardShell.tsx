"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import { useAuthUser } from "@/features/auth";
import { DashboardActionCard } from "./DashboardActionCard";
import { DashboardGreeting } from "./DashboardGreeting";
import { DashboardHeaderActions } from "./DashboardHeaderActions";
import { SuperAdminReportsTable } from "./SuperAdminReportsTable";

const SUPER_ADMIN_ACTION_CARDS = [
  {
    title: "User Management",
    description:
      "Manage user access, roles, and permissions to ensure secure platform administration.",
    ctaLabel: "Manage Users",
    href: "/super-admin/users",
  },
  {
    title: "Company Management",
    description:
      "Create, organize, and oversee company profiles, settings, and organizational details.",
    ctaLabel: "Manage Company",
    href: "/super-admin/companies",
  },
  {
    title: "Subscription Management",
    description:
      "Monitor subscription plans, licensing, billing status, and account entitlements.",
    ctaLabel: "Manage Subscriptions",
    href: "/super-admin/subscriptions",
  },
  {
    title: "Reviewer Management",
    description:
      "Assign, manage, and track expert reviewers responsible for HTA submission evaluations.",
    ctaLabel: "Manage Reviewers",
    href: "/super-admin/reviewers",
  },
  {
    title: "Reports Management",
    description:
      "Access, generate, and review compliance reports, submission insights, and platform analytics.",
    ctaLabel: "Manage Reports",
    href: "/super-admin/reports",
  },
] as const;

export function SuperAdminDashboardShell() {
  const { displayName } = useAuthUser();

  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader actions={<DashboardHeaderActions />} />

      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 pt-10 pb-14 sm:px-6 lg:px-12 lg:pt-[57px]">
        <DashboardGreeting user={{ displayName }} />

        <section
          aria-label="Super administrator actions"
          className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:mt-[55px] xl:grid-cols-3"
        >
          {SUPER_ADMIN_ACTION_CARDS.map((card) => (
            <DashboardActionCard
              key={card.href}
              variant="admin"
              title={card.title}
              description={card.description}
              ctaLabel={card.ctaLabel}
              href={card.href}
            />
          ))}
        </section>

        <div className="mt-10 xl:mt-[60px]">
          <SuperAdminReportsTable />
        </div>
      </main>
    </div>
  );
}
