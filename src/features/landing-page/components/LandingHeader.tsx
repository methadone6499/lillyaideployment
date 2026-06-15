import Image from "next/image";
import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-landing-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-landing-header w-full max-w-layout-max items-center px-landing-section-x">
        <Link href="/" aria-label="Lilly AI home" className="inline-flex">
          <Image
            src="/lillyailogo.svg"
            alt="Lilly AI"
            width={69}
            height={24}
            priority
          />
        </Link>
      </div>
    </header>
  );
}
