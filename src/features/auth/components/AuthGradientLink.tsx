import Link from "next/link";
import type { ReactNode } from "react";

type AuthGradientLinkProps = {
  href: string;
  children: ReactNode;
};

export function AuthGradientLink({ href, children }: AuthGradientLinkProps) {
  return (
    <Link
      href={href}
      className="bg-landing-emerald-gradient bg-clip-text font-medium text-transparent underline decoration-brand underline-offset-2"
    >
      {children}
    </Link>
  );
}
