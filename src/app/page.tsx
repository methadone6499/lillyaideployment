import type { Metadata } from "next";
import { LandingPageShell } from "@/features/landing-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND.name} · ${BRAND.descriptor}`,
};

export default function HomePage() {
  return <LandingPageShell />;
}
