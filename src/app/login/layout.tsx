"use client";

import { AuthenticatedBoundary } from "@/features/auth";
import type { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedBoundary mode="public-only">{children}</AuthenticatedBoundary>
  );
}
