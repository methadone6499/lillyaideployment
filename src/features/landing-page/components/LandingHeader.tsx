import { LogoLink } from "@/components/shared/LogoLink";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-landing-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-landing-header w-full max-w-layout-max items-center px-landing-section-x">
        <LogoLink width={69} height={24} className="inline-flex" />
      </div>
    </header>
  );
}
