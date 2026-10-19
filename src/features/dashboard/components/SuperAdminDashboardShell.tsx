"use client";

import { hasPermission, useAuthUser, type Permission } from "@/features/auth";
import { DashboardActionCard } from "./DashboardActionCard";
import { DashboardActionGrid, DashboardPageFrame } from "./DashboardPageFrame";
import { SuperAdminReportsTable } from "./SuperAdminReportsTable";

const SUPER_ADMIN_ACTION_CARDS = [
  {
    title: "User Management",
    description:
      "Manage user access, roles, and permissions to ensure secure platform administration.",
    ctaLabel: "Manage Users",
    href: "/admin/users",
    permission: "admin:users_read",
  },
  {
    title: "Company Management",
    description:
      "Create, organize, and oversee company profiles, settings, and organizational details.",
    ctaLabel: "Manage Company",
    href: "/admin/companies",
    permission: "admin:companies_read",
  },
  {
    title: "Subscription Management",
    description:
      "Monitor subscription plans, licensing, billing status, and account entitlements.",
    ctaLabel: "Manage Subscriptions",
    href: "/super-admin/subscriptions",
    permission: "admin:subscriptions_manage",
  },
  {
    title: "Reviewer Management",
    description:
      "Assign, manage, and track expert reviewers responsible for HTA submission evaluations.",
    ctaLabel: "Manage Reviewers",
    href: "/super-admin/reviewers",
    permission: "admin:reviewers_manage",
  },
  {
    title: "Reports Management",
    description:
      "Access, generate, and review compliance reports, submission insights, and platform analytics.",
    ctaLabel: "Manage Reports",
    href: "/super-admin/reports",
    permission: "admin:reports_read",
  },
] as const satisfies readonly {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  permission: Permission;
}[];

export function SuperAdminDashboardShell() {
  const { authMe, displayName } = useAuthUser();
  const visibleCards = SUPER_ADMIN_ACTION_CARDS.filter((card) =>
    hasPermission(authMe, card.permission),
  );

  return (
    <DashboardPageFrame
      displayName={displayName}
      summary={
        <DashboardActionGrid label="Super administrator actions">
          {visibleCards.map((card) => (
            <DashboardActionCard
              key={card.href}
              variant="admin"
              title={card.title}
              description={card.description}
              ctaLabel={card.ctaLabel}
              href={card.href}
            />
          ))}
        </DashboardActionGrid>
      }
    >
      <SuperAdminReportsTable />
    </DashboardPageFrame>
  );
}
