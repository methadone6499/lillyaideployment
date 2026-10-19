"use client";

import {
  getPostAuthHomePath,
  useAuthUser,
  useIsAuthenticated,
  useIsAuthInitializing,
} from "@/features/auth";
import Link from "next/link";

const linkClassName =
  "mt-2 inline-flex h-[52px] items-center justify-center rounded-button border border-border-default bg-surface-default px-6 text-label font-medium text-white transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function NotFoundHomeLink() {
  const { authMe } = useAuthUser();
  const authenticated = useIsAuthenticated();
  const initializing = useIsAuthInitializing();

  if (initializing) {
    return (
      <button type="button" disabled aria-busy="true" className={linkClassName}>
        Loading…
      </button>
    );
  }

  const hasResolvedAccount = authenticated && Boolean(authMe);
  return (
    <Link
      href={hasResolvedAccount ? getPostAuthHomePath(authMe) : "/"}
      className={linkClassName}
    >
      {hasResolvedAccount ? "Go to dashboard" : "Back to home"}
    </Link>
  );
}
