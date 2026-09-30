"use client";

import { AuthenticatedBoundary } from "@/features/auth";
import { PostAuthBillingRedirect } from "@/features/billing";
import type { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedBoundary
      mode="public-only"
      authenticatedContent={<PostAuthBillingRedirect />}
    >
      {children}
    </AuthenticatedBoundary>
  );
}
