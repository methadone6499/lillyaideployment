"use client";

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
      className="text-label font-medium text-brand no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {children}
    </Link>
  );
}
