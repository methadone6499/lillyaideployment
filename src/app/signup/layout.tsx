"use client";

import { AuthenticatedBoundary } from "@/features/auth";
import type { ReactNode } from "react";

export default function SignupLayout({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedBoundary mode="public-only">{children}</AuthenticatedBoundary>
  );
}
