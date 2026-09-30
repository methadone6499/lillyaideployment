"use client";

import Link from "next/link";

import { hasPermission, useAuthUser } from "@/features/auth";
import { cn } from "@/lib/cn";

const CUSTOM_REQUESTS_HREF = "/super-admin/subscriptions/custom-requests";
const SUBSCRIPTIONS_HREF = "/super-admin/subscriptions";

export function SubscriptionAdminNavigation({
  activeHref,
}: {
  activeHref: string;
}) {
  const { authMe } = useAuthUser();
  const links = [
    hasPermission(authMe, "admin:subscriptions_manage")
      ? { href: CUSTOM_REQUESTS_HREF, label: "Custom requests" }
      : null,
    { href: SUBSCRIPTIONS_HREF, label: "Subscriptions" },
  ].filter((link): link is { href: string; label: string } => link !== null);

  return (
    <nav
      aria-label="Subscription administration"
      className="mt-8 flex flex-wrap gap-2"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.href === activeHref ? "page" : undefined}
          className={cn(
            "rounded-button border px-4 py-2 text-label font-medium transition-colors",
            link.href === activeHref
              ? "border-brand bg-brand-bg text-white"
              : "border-border-default bg-surface-default text-text-body hover:bg-surface-elevated",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
