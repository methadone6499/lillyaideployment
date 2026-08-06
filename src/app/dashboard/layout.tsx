"use client";

import { AuthenticatedBoundary } from "@/features/auth";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedBoundary>{children}</AuthenticatedBoundary>;
}
