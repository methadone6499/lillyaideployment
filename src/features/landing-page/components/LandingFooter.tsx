import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { footerNavLinks } from "../data/landingContent";
import {
  SocialInstagramIcon,
  SocialLinkedInIcon,
  SocialXIcon,
} from "./LandingIcons";

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-border-default bg-landing-background">
      <div className="mx-auto flex w-full max-w-[960px] flex-col items-center gap-8 px-landing-section-x py-16">
        <div className="flex w-full flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-6">
            <Image
              src="/formulary-hta-logo.png"
              alt="Formulary HTA"
              width={737}
              height={111}
              className="h-auto w-[220px]"
            />
            <div className="flex items-center gap-6">
              <a href="#" aria-label="X" className="inline-flex size-10 items-center justify-center rounded-[var(--landing-radius-badge)] text-landing-text-subtle transition-colors duration-150 hover:bg-surface-default hover:text-white motion-reduce:transition-none">
                <SocialXIcon />
              </a>
              <a href="#" aria-label="Instagram" className="inline-flex size-10 items-center justify-center rounded-[var(--landing-radius-badge)] text-landing-text-subtle transition-colors duration-150 hover:bg-surface-default hover:text-white motion-reduce:transition-none">
                <SocialInstagramIcon />
              </a>
              <a href="#" aria-label="LinkedIn" className="inline-flex size-10 items-center justify-center rounded-[var(--landing-radius-badge)] text-landing-text-subtle transition-colors duration-150 hover:bg-surface-default hover:text-white motion-reduce:transition-none">
                <SocialLinkedInIcon />
              </a>
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-landing-body-size text-landing-text-subtle"
          >
            {footerNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-[var(--landing-radius-button)] whitespace-nowrap underline-offset-4 transition-colors duration-150 hover:text-white hover:underline motion-reduce:transition-none"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 text-center text-input leading-5 text-text-muted">
          <p>© 2026 {BRAND.name} - All rights reserved.</p>
          <p>Powered by {BRAND.partner}.</p>
        </div>
      </div>
    </footer>
  );
}
