import { LogoLink } from "@/components/shared/LogoLink";
import Link from "next/link";
import { headerNavLinks } from "../data/landingContent";
import { LandingCtaButton } from "./LandingCtaButton";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-landing-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-landing-header w-full max-w-layout-max items-center justify-between gap-3 px-[var(--layout-landing-header-padding-x)] sm:gap-6">
        <LogoLink width={69} height={24} className="inline-flex shrink-0" />

        <div className="flex min-w-0 items-center gap-3 sm:gap-6 md:gap-12">
          <nav
            aria-label="Primary"
            className="hidden items-center gap-6 text-landing-body-size text-landing-text-subtle md:flex md:gap-10"
          >
            {headerNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="whitespace-nowrap transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <LandingCtaButton
            href="/login"
            className="!h-[clamp(32px,min(2.083vw,3.704vh),40px)] shrink-0 !pl-[clamp(18px,1.25vw,24px)] !pr-[clamp(14px,0.938vw,18px)] !text-[clamp(14px,0.833vw,16px)] [&_svg]:!size-[clamp(14px,0.938vw,18px)]"
          >
            Login
          </LandingCtaButton>
        </div>
      </div>
    </header>
  );
}
