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
  id: string;
  name: string;
  audience: string;
  highlight: string;
  price?: string;
  priceSuffix?: string;
  priceLabel?: string;
  features: string[];
  featured?: boolean;
  ctaVariant: "primary" | "secondary";
};
