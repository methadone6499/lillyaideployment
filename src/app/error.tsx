"use client";

import { AppErrorPage } from "@/components/shared/AppErrorPage";
import { BRAND } from "@/lib/brand";

export default function ErrorPage({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <>
      <title>{`${BRAND.name} | Something went wrong`}</title>
      <AppErrorPage onRetry={unstable_retry} />
    </>
  );
}
