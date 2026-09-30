import type { PlanIntent } from "@/features/billing";

export type FeatureCardContent = {
  title: string;
  description: string;
};

export type WhyCardContent = {
  title: string;
  description: string;
  imageUrl: string;
  imageClassName?: string;
};

export type PricingPlanContent = {
  id: PlanIntent;
  iconSrc: string;
  name: string;
  audience: string;
  highlight: string;
  price?: string;
  priceSuffix?: string;
  priceLabel?: string;
  features: string[];
  featured?: boolean;
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: "primary" | "secondary";
};
