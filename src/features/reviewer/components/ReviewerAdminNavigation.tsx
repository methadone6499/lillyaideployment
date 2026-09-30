import { cn } from "@/lib/cn";
import Link from "next/link";

const links = [
  { href: "/super-admin/reviewers", label: "Reviewers" },
  { href: "/super-admin/review-assignments", label: "Review Dashboard" },
  { href: "/super-admin/review-settings", label: "Assignment Settings" },
] as const;

export function ReviewerAdminNavigation({ activeHref }: { activeHref: string }) {
  return (
    <nav aria-label="Reviewer administration" className="mt-8 flex flex-wrap gap-2">
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
