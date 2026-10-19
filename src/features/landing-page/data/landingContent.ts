import type {
  FeatureCardContent,
  PricingPlanContent,
  WhyCardContent,
} from "../types";

export const featureCards: FeatureCardContent[] = [
  {
    title: "Disease burden analysis",
    description:
      "Comprehensive disease burden assessment and epidemiological context for informed decision-making",
  },
  {
    title: "Prescribing information",
    description:
      "Basic prescribing information including dosing, administration, and key product characteristics",
  },
  {
    title: "Clinical evidence tables",
    description:
      "Detailed summary tables of published relevant clinical evidence and trial outcomes",
  },
  {
    title: "Pharmacoeconomic studies",
    description:
      "Comprehensive cost-effectiveness analysis and pharmacoeconomic evidence for budget impact analysis",
  },
  {
    title: "GRADE & CASP assessment",
    description:
      "Direct grading of evidence level and quality assessment using GRADE and CASP checklists",
  },
  {
    title: "HTA agency summaries",
    description:
      "Summaries of published HTA reports from internationally recognized agencies worldwide",
  },
];

export const whyCards: WhyCardContent[] = [
  {
    title: "Drug-specific search",
    description:
      "Targeted searching by drug name and indication for precise, relevant results",
    imageUrl: "/landing/drugspecificsearch.png",
  },
  {
    title: "Comprehensive coverage",
    description:
      "Full evaluation packages covering clinical, economic, and HTA agency perspectives",
    imageUrl: "/landing/comprehensivecoverage.png",
  },
  {
    title: "International HTA insights",
    description:
      "Access published reports from recognized HTA agencies in one place",
    imageUrl: "/landing/htainsights.png",
  },
];

export const pricingPlans: PricingPlanContent[] = [
  {
    id: "standard",
    iconSrc: "/landing/pricing-standard.svg",
    name: "Standard",
    audience: "Small teams getting started",
    highlight: "30 monthly reports",
    price: "£480",
    priceSuffix: "/mo",
    features: [
      "Free data sources (PubMed, Cochrane, FDA, EMA)",
      "Basic AI summarization",
      "PDF & DOCX export",
      "Email support",
    ],
    ctaLabel: "Get started",
    ctaHref: "/signup?plan=standard",
    ctaVariant: "secondary",
  },
  {
    id: "enterprise",
    iconSrc: "/landing/pricing-enterprise.svg",
    name: "Enterprise",
    audience: "Most popular for HTA consultancies",
    highlight: "10 seats / 100 company reports",
    price: "£2,400",
    priceSuffix: "/mo",
    featured: true,
    features: [
      "All free + paid sources (Scopus, Embase, Clarivate)",
      "AI clinical intelligence engine",
      "PDF, DOCX, PowerPoint + AI presenter",
      "Dosage calculator",
      "Multi-HTA compliance",
      "Priority support",
    ],
    ctaLabel: "Get started",
    ctaHref: "/signup?plan=enterprise",
    ctaVariant: "primary",
  },
  {
    id: "custom",
    iconSrc: "/landing/pricing-custom.svg",
    name: "Custom",
    audience: "Large pharma & enterprise",
    highlight: "Unlimited users / unlimited evaluations",
    priceLabel: "Contact us",
    features: [
      "Everything in Enterprise",
      "Human-in-the-loop verification",
      "Dedicated reviewer pool",
      "Custom integrations & SSO",
      "On-prem deployment option",
      "Account manager + SLA",
    ],
    ctaLabel: "Contact sales",
    ctaHref: "/#contact",
    ctaVariant: "secondary",
  },
];

export const addOnFeaturesLeft = [
  "Independent expert validation",
  "Methodology consultation",
  "Stakeholder presentation support",
  "Strategic support for managed entry agreement (MEA) discussions",
];

export const addOnFeaturesRight = [
  "Quality assurance review",
  "Report enhancement",
  "Custom evidence synthesis",
  "Evidence gap identification for pricing and reimbursement negotiations",
];

export const headerNavLinks = [
  { label: "Why us?", href: "#why-us" },
  { label: "Pricing", href: "#pricing" },
  { label: "Get in touch", href: "#contact" },
] as const;

export const footerNavLinks = [
  { label: "Log in", href: "/login" },
  { label: "Why us?", href: "#why-us" },
  { label: "Pricing", href: "#pricing" },
  { label: "Get in touch", href: "#contact" },
  { label: "Terms", href: "#" },
  { label: "Privacy", href: "#" },
] as const;

export const contactDetails = {
  phone: "+971 50 681 0149",
  email: "valuemedconsultants@icloud.com",
} as const;
