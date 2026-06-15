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
    imageUrl:
      "https://www.figma.com/api/mcp/asset/1a089515-1970-4312-8d2a-98fd065750db",
    imageClassName: "h-[111.55%] left-[-39.25%] top-[-5.54%] w-[184.16%]",
  },
  {
    title: "Comprehensive Coverage",
    description:
      "Full evaluation packages covering clinical, economic, and HTA agency perspectives",
    imageUrl:
      "https://www.figma.com/api/mcp/asset/c3b4e6fd-e958-43c8-990c-93ec421ddf4a",
    imageClassName: "h-[130.04%] left-[-57.06%] top-[-15.46%] w-[214.7%]",
  },
  {
    title: "International HTA Insights",
    description:
      "Access published reports from recognized HTA agencies in one place",
    imageUrl:
      "https://www.figma.com/api/mcp/asset/71f3aa36-cc04-488e-86b4-2d34f07f07d4",
    imageClassName: "h-[118.24%] left-[-10.11%] top-[-8.49%] w-[120.33%]",
  },
];

export const pricingPlans: PricingPlanContent[] = [
  {
    id: "essentials",
    name: "Essentials",
    audience: "Hospitals and Small Institutions",
    highlight: "30 reports per year",
    price: "£80,000",
    priceSuffix: "/yr",
    features: [
      "Complete HTA evaluation platform",
      "Drug and indication-specific searches",
      "Disease burden analysis",
      "Clinical evidence summaries",
      "GRADE & CASP assessment",
      "International HTA reports",
      "Pharmacoeconomic studies access",
    ],
    ctaVariant: "secondary",
  },
  {
    id: "professional",
    name: "Professional",
    audience: "Large hospitals and ministries",
    highlight: "Up to 10 users. Unlimited Evaluations",
    price: "£120,000",
    priceSuffix: "/yr",
    featured: true,
    features: [
      "Everything in Small Institutions",
      "Multi-user access",
      "Priority support",
      "Advanced reporting features",
      "Custom evaluation templates",
      "Data export capabilities",
      "Quarterly updates and webinars",
    ],
    ctaVariant: "primary",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    audience: "For pharmaceutical companies",
    highlight: "Unlimited Users/ Unlimited Evaluations",
    priceLabel: "Contact Us",
    features: [
      "Dedicated account manager",
      "Everything in Large Institutions",
      "White-label options available",
      "API access for integrations",
      "Custom data analysis",
      "Competitive intelligence insights",
      "Strategic consultation sessions",
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

export const footerNavLinks = [
  { label: "Login", href: "#" },
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
