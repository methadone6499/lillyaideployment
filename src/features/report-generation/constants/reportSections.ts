import type { SectionType, WizardSectionId } from "../types";

export type ReportSectionDefinition = {
  id: WizardSectionId;
  title: string;
  description: string;
};

export const REPORT_SECTION_DEFINITIONS: ReportSectionDefinition[] = [
  {
    id: "disease",
    title: "Disease Overview",
    description:
      "Epidemiology, pathophysiology, and standard-of-care context for the indication.",
  },
  {
    id: "drug",
    title: "Drug Details",
    description:
      "Product characteristics, dosing, and regulatory label information.",
  },
  {
    id: "clinical",
    title: "Clinical Evidence",
    description:
      "Trial design, endpoints, demographics, and safety from selected clinical literature.",
  },
  {
    id: "economic",
    title: "Economic Evidence",
    description:
      "Cost-effectiveness, budget impact, and pharmacoeconomic findings from selected studies.",
  },
  {
    id: "critical_appraisal",
    title: "Critical Appraisal",
    description:
      "Source-level internal and external validity of selected clinical and economic evidence. Available when Clinical and/or Economic Evidence is included.",
  },
  {
    id: "comparator",
    title: "Competitor Analysis",
    description:
      "Head-to-head and indirect comparisons against selected standard-of-care agents.",
  },
  {
    id: "environmental",
    title: "Environmental Analysis",
    description:
      "Environmental impact considerations related to treatment, manufacturing, and disposal.",
  },
  {
    id: "hta",
    title: "HTA Summary",
    description:
      "Health technology assessment findings and reimbursement considerations.",
  },
  {
    id: "compliance",
    title: "Evidence Scope & Compliance",
    description:
      "Evidence search methodology, inclusion criteria, and HTA compliance documentation.",
  },
  {
    id: "executive",
    title: "Executive Summary",
    description:
      "Key messages and formulary assessment recommendations for decision makers.",
  },
];

/** All Step 5 section IDs in display order. */
export const ALL_WIZARD_SECTION_IDS: WizardSectionId[] =
  REPORT_SECTION_DEFINITIONS.map((section) => section.id);

/** Default section IDs — all except environmental and compliance (hidden/opt-in).
 * Critical Appraisal stays only when Clinical and/or Economic Evidence is selected. */
export const DEFAULT_SECTION_IDS: SectionType[] = ALL_WIZARD_SECTION_IDS.filter(
  (id) => id !== "environmental" && id !== "compliance",
);
