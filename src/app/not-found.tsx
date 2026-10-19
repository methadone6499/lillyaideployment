import { LogoLink } from "@/components/shared/LogoLink";
import { BRAND } from "@/lib/brand";
import type { Metadata } from "next";
import { NotFoundHomeLink } from "./NotFoundHomeLink";

export const metadata: Metadata = {
  title: `Page not found | ${BRAND.name}`,
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-white">
      <header className="px-6 py-6 sm:px-8">
        <LogoLink />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16 text-center">
        <div className="flex max-w-lg flex-col items-center gap-6">
          <p className="text-[96px] leading-none font-medium text-brand sm:text-[128px]">404</p>
          <h1 className="text-page-title font-medium">Page not found</h1>
          <p className="text-label leading-6 text-white">
            The page you’re looking for doesn’t exist or has moved.
          </p>
          <NotFoundHomeLink />
        </div>
      </main>
    </div>
  );
}
