"use client";

import { AppErrorPage } from "@/components/shared/AppErrorPage";
import { BRAND } from "@/lib/brand";
import "./globals.css";

export default function GlobalError({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <html lang="en">
      <body>
        <title>{`${BRAND.name} | Something went wrong`}</title>
        <AppErrorPage onRetry={unstable_retry} />
      </body>
    </html>
  );
}
