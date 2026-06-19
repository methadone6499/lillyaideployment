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
    id: "comparator",
    title: "Comparator Analysis",
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
    id: "appraisal",
    title: "Critical Appraisal",
    description:
      "Evidence quality scoring using GRADE, CASP, and Drummond frameworks.",
  },
  {
    id: "discussion",
    title: "Discussion",
    description:
      "Synthesis of clinical, economic, and HTA evidence with key implications.",
  },
  {
    id: "compliance",
    title: "Evidence Scope & Compliance",
    description:
      "Scope of included evidence and alignment with HTA submission requirements.",
  },
  {
    id: "executive",
    title: "Executive Summary",
    description:
      "Key messages and formulary assessment recommendations for decision makers.",
  },
];

export const ENVIRONMENTAL_SECTION_STUB_MARKDOWN =
  "Nothing was found for this section.";

/** All Step 5 section IDs in display order, including frontend-only sections. */
export const ALL_WIZARD_SECTION_IDS: WizardSectionId[] =
  REPORT_SECTION_DEFINITIONS.map((section) => section.id);

/** Default API-backed section IDs (excludes frontend-only sections). */
export const DEFAULT_SECTION_IDS: SectionType[] = ALL_WIZARD_SECTION_IDS.filter(
  (id): id is SectionType => id !== "environmental",
);
