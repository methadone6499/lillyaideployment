import { LogoLink } from "@/components/shared/LogoLink";
import Image from "next/image";
import Link from "next/link";
import { headerNavLinks } from "../data/landingContent";
import { LandingCtaButton } from "./LandingCtaButton";
import styles from "./LandingPage.module.css";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-default bg-base-black">
      <div className="mx-auto flex h-landing-header w-full max-w-[calc(var(--layout-landing-section-width)+2*var(--layout-landing-header-padding-x))] items-center justify-between gap-3 px-[var(--layout-landing-header-padding-x)] sm:gap-6">
        <LogoLink className="inline-flex shrink-0 [&_img]:h-auto [&_img]:w-[160px]" />

        <div className="flex min-w-0 items-center gap-3 sm:gap-6 md:gap-8">
          <nav
            aria-label="Primary"
            className="hidden items-center gap-6 text-label text-landing-text-subtle md:flex md:gap-8"
          >
            {headerNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-[var(--landing-radius-button)] whitespace-nowrap underline-offset-4 transition-colors duration-150 hover:text-white hover:underline motion-reduce:transition-none"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <LandingCtaButton
            href="/login"
            size="compact"
            showArrow={false}
            className={styles.loginButton}
          >
            Login
            <Image
              src="/landing/login-arrow.svg"
              alt=""
              width={18}
              height={18}
              className="shrink-0"
              aria-hidden
            />
          </LandingCtaButton>
        </div>
      </div>
    </header>
  );
}
