"use client";

import type { ReactNode } from "react";

import { AuthenticatedBoundary } from "@/features/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedBoundary>{children}</AuthenticatedBoundary>;
}
