"use client";

import { AuthenticatedBoundary } from "@/features/auth";
import type { ReactNode } from "react";

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedBoundary>{children}</AuthenticatedBoundary>;
}
