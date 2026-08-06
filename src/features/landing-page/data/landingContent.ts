import type {
  FeatureCardContent,
  PricingPlanContent,
  WhyCardContent,
} from "../types";

export const featureCards: FeatureCardContent[] = [
  {
    title: "Disease Burden Analysis",
    description:
      "Comprehensive disease burden assessment and epidemiological context for informed decision-making",
  },
  {
    title: "Prescribing Information",
    description:
      "Basic prescribing information including dosing, administration, and key product characteristics",
  },
  {
    title: "Clinical Evidence Tables",
    description:
      "Detailed summary tables of published relevant clinical evidence and trial outcomes",
  },
  {
    title: "Pharmacoeconomic Studies",
    description:
      "Comprehensive cost-effectiveness analysis and pharmacoeconomic evidence for budget impact",
  },
  {
    title: "GRADE & CASP Assessment",
    description:
      "Direct grading of evidence level and quality assessment using GRADE and CASP checklists",
  },
  {
    title: "HTA Agency Summaries",
    description:
      "Summaries of published HTA reports from internationally recognized agencies worldwide",
  },
];

export const whyCards: WhyCardContent[] = [
  {
    title: "Drug-Specific Search",
    description:
      "Targeted searching by drug name and indication for precise, relevant results",
    imageUrl: "/landing/drugspecificsearch.png",
  },
  {
    title: "Comprehensive Coverage",
    description:
      "Full evaluation packages covering clinical, economic, and HTA agency perspectives",
    imageUrl: "/landing/comprehensivecoverage.png",
  },
  {
    title: "International HTA Insights",
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
    highlight: "30 reports per year",
    price: "£480",
    priceSuffix: "/mo",
    features: [
      "Free data sources (PubMed, Cochrane, FDA, EMA)",
      "Basic AI summarization",
      "PDF & DOCX export",
      "Email support",
    ],
    ctaVariant: "secondary",
  },
  {
    id: "enterprise",
    iconSrc: "/landing/pricing-enterprise.svg",
    name: "Enterprise",
    audience: "Most popular for HTA consultancies",
    highlight: "Up to 10 users. Unlimited Evaluations",
    price: "£2400",
    priceSuffix: "/mo",
    featured: true,
    features: [
      "All free + paid sources (Scopus, Embase, Clarivate)",
      "AI Clinical Intelligence Engine",
      "PDF, DOCX, PowerPoint + AI presenter",
      "Dosage calculator",
      "Multi-HTA compliance",
      "Priority support",
    ],
    ctaVariant: "primary",
  },
  {
    id: "custom",
    iconSrc: "/landing/pricing-custom.svg",
    name: "Custom",
    audience: "Large pharma & enterprise",
    highlight: "Unlimited Users/ Unlimited Evaluations",
    priceLabel: "Contact Us",
    features: [
      "Everything in Enterprise",
      "Human-in-the-loop verification",
      "Dedicated reviewer pool",
      "Custom integrations & SSO",
      "On-prem deployment option",
      "Account manager + SLA",
    ],
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
  { label: "Why Us?", href: "#why-us" },
  { label: "Pricing", href: "#pricing" },
  { label: "Get in Touch", href: "#contact" },
] as const;

export const footerNavLinks = [
  { label: "Login", href: "/login" },
  { label: "Why Us?", href: "#why-us" },
  { label: "Pricing", href: "#pricing" },
  { label: "Get in Touch", href: "#contact" },
  { label: "Terms", href: "#" },
  { label: "Privacy", href: "#" },
] as const;

export const contactDetails = {
  phone: "+971 50 681 0149",
  email: "valuemedconsultants@icloud.com",
} as const;
