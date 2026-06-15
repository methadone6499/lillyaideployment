import Image from "next/image";
import Link from "next/link";
import { footerNavLinks } from "../data/landingContent";
import {
  SocialInstagramIcon,
  SocialLinkedInIcon,
  SocialXIcon,
} from "./LandingIcons";

export function LandingFooter() {
  return (
    <footer className="w-full bg-[#111111]">
      <div className="mx-auto flex w-full max-w-[941px] flex-col items-center gap-[104px] px-landing-section-x py-16">
        <div className="flex w-full flex-col items-center gap-[72px]">
          <div className="flex flex-col items-center gap-14">
            <Image
              src="/lillyailogo.svg"
              alt="Lilly AI"
              width={115}
              height={40}
            />
            <div className="flex items-center gap-14">
              <a href="#" aria-label="X" className="hover:text-white/50">
                <SocialXIcon />
              </a>
              <a href="#" aria-label="Instagram" className="hover:text-white/50">
                <SocialInstagramIcon />
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-white/50">
                <SocialLinkedInIcon />
              </a>
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-x-14 gap-y-4 text-landing-body-size text-landing-text-subtle"
          >
            {footerNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="text-center text-landing-body-size text-white/32">
          © 2026 LillyAI, Riyadh, Saudi Arabia - All rights reserved.
        </p>
      </div>
    </footer>
  );
}
