"use client";

import { LogoLink } from "@/components/shared/LogoLink";
import type { ReactNode } from "react";

type AuthPageShellProps = {
  title: string;
  children: ReactNode;
};

export function AuthPageShell({ title, children }: AuthPageShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-landing-background">
      <div
        aria-hidden
        className="pointer-events-none absolute top-[var(--layout-auth-header-height)] bottom-0 left-[var(--layout-auth-guide-inset)] hidden w-px bg-white/10 lg:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[var(--layout-auth-header-height)] right-[var(--layout-auth-guide-inset)] bottom-0 hidden w-px bg-white/10 lg:block"
      />

      <header className="relative z-10 flex h-[var(--layout-auth-header-height)] shrink-0 items-center justify-center border-b-[1.2px] border-white/10">
        <LogoLink
          width={69}
          height={24}
          className="inline-flex [&_img]:h-auto [&_img]:w-[clamp(50px,min(3.594vw,6.389vh),69px)]"
        />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center px-6 pt-[var(--layout-auth-main-top)] pb-[var(--layout-auth-main-bottom)]">
        <div className="flex w-full max-w-[var(--layout-auth-form-width)] flex-col items-stretch gap-[var(--layout-auth-title-form-gap)]">
          <h1 className="text-center text-[length:var(--text-auth-title)] leading-none font-normal text-landing-text-heading">
            {title}
          </h1>
          {children}
        </div>
      </main>

      <p className="relative z-10 shrink-0 px-6 pb-[var(--layout-auth-footer-bottom)] text-center font-inter text-[length:var(--text-auth-footer)] leading-normal text-white/32">
        © 2026 LillyAI - All rights reserved. - Powered by VelueMED Consultants
      </p>
    </div>
  );
}
