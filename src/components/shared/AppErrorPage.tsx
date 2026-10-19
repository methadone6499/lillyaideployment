"use client";

import { Button, SpinnerIcon } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";

export function AppErrorPage({ onRetry }: { onRetry: () => void }) {
  const [isRetrying, startTransition] = useTransition();

  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter,Arial,sans-serif)] text-white">
      <header className="px-6 py-6 sm:px-8">
        <Link href="/" aria-label={`${BRAND.name} home`} className="inline-flex">
          <Image src="/formulary-hta-logo.png" alt={BRAND.name} width={180} height={27} loading="eager" />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16 text-center">
        <div className="flex max-w-lg flex-col items-center gap-6">
          <h1 className="text-page-title font-medium">Something went wrong</h1>
          <p className="text-label leading-6 text-text-primary">
            We couldn’t display this page. Try again, or return to the home page.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => startTransition(onRetry)}
              disabled={isRetrying}
              aria-busy={isRetrying}
              leadingIcon={isRetrying ? <SpinnerIcon /> : undefined}
            >
              {isRetrying ? "Trying again…" : "Try again"}
            </Button>
            <Link href="/" className="inline-flex h-[52px] items-center justify-center rounded-button border border-border-default bg-surface-default px-5 text-body-lg font-medium text-white transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
