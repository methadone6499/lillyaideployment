import {
  comparatorListSchema,
  drugSuggestionSchema,
  evidenceListSchema,
  generateReportResponseSchema,
  reportJobStatusSchema,
  reportSectionDefinitionsSchema,
} from "../schemas/reportSchemas";
import type {
  ComparatorItem,
  EvidenceItem,
  EvidenceType,
  FilterState,
  GenerateReportResponse,
  ReportJobStatus,
  ReportSectionDefinition,
} from "../types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DRUG_SUGGESTIONS: Record<string, string> = {
  panedol: "Panadol",
  panadol: "Panadol",
};

const CLINICAL_EVIDENCE: EvidenceItem[] = [
  {
    id: "ev-1",
    title: "Prophylactic drug management for febrile seizures in children.",
    year: 2021,
    pmcUrl: "https://pmc.ncbi.nlm.nih.gov/",
    doiUrl: "https://doi.org/",
    studyDesign:
      "Journal Article, Meta-Analysis, Research Support, Non-U.S. Gov't, Systematic Review",
    journal: "The Cochrane database of systematic reviews",
    abstract:
      "Febrile seizures occurring in a child older than one month during an episode of fever affect 2-4% of children in Great Britain and the United States and recur in 30%. Rapid-acting antiepileptics and antipyretics given during subsequent fever episodes have been used to avoid the adverse effects of continuous antiepileptic drugs. This is an updated version of a Cochrane Review previously published in 2017.",
    type: "clinical",
  },
  {
    id: "ev-2",
    title:
      "Acetaminophen and Ibuprofen in Pediatric Central Nervous System Malaria: A Randomized Clinical Trial.",
    year: 2024,
    pmcUrl: "https://pmc.ncbi.nlm.nih.gov/",
    doiUrl: "https://doi.org/",
    studyDesign: "Randomized Controlled Trial",
    journal: "JAMA Pediatrics",
    abstract:
      "A randomized clinical trial comparing acetaminophen and ibuprofen in pediatric central nervous system malaria.",
    type: "clinical",
  },
  {
    id: "ev-3",
    title:
      "Comparison between Ibuprofen and Acetaminophen in the Treatment of Infectious Fever in Children: A Meta-Analysis.",
    year: 2022,
    pmcUrl: "https://pmc.ncbi.nlm.nih.gov/",
    doiUrl: "https://doi.org/",
    studyDesign: "Meta-Analysis",
    journal: "Pediatric Infectious Disease Journal",
    abstract:
      "Meta-analysis comparing ibuprofen and acetaminophen for infectious fever in children.",
    type: "clinical",
  },
];

const ECONOMIC_EVIDENCE: EvidenceItem[] = [
  {
    id: "ev-e1",
    title: "Cost-effectiveness of antipyretic therapy in pediatric fever management.",
    year: 2023,
    pmcUrl: "https://pmc.ncbi.nlm.nih.gov/",
    doiUrl: "https://doi.org/",
    studyDesign: "Cost-Effectiveness Analysis",
    journal: "Health Economics Review",
    abstract:
      "Economic evaluation of antipyretic therapy options for pediatric fever management.",
    type: "economic",
  },
];

const DEFAULT_COMPARATORS: ComparatorItem[] = [
  { id: "comp-1", name: "Semaglutide (Ozempic)" },
  { id: "comp-2", name: "Dulaglutide (Trulicity)" },
];

const DEFAULT_SECTIONS: ReportSectionDefinition[] = [
  {
    id: "disease-overview",
    title: "Disease Overview",
    description: "Definition, epidemiology, burden, ICD-11 mapping",
  },
  {
    id: "drug-overview",
    title: "Drug Overview",
    description: "MoA, pharmacokinetics, regulatory status, label highlights",
  },
  {
    id: "clinical-evidence",
    title: "Clinical Evidence",
    description: "RCTs, observational, meta-analyses + GRADE assessment",
  },
  {
    id: "economic-evidence",
    title: "Economic Evidence",
    description: "CEA, budget impact, QALY, cost-utility analyses",
  },
  {
    id: "competitor-analysis",
    title: "Competitor Analysis",
    description: "Comparator drugs, head-to-head trials, market positioning",
  },
  {
    id: "environmental-analysis",
    title: "Environmental Analysis",
    description: "Payer landscape, regional access, reimbursement context",
  },
  {
    id: "hta-summary",
    title: "HTA Summary",
    description: "Framework-specific formatting, regulatory language injection",
  },
  {
    id: "executive-summary",
    title: "Executive Summary",
    description: "Plain-language + layperson version, 1-page brief",
  },
];

const jobStatuses = new Map<string, ReportJobStatus>();

function createInitialJobStatus(
  jobId: string,
  drugName: string,
  indications: string,
  selectedSectionIds: string[],
): ReportJobStatus {
  const sections = DEFAULT_SECTIONS.filter((s) =>
    selectedSectionIds.includes(s.id),
  ).map((section, index) => ({
    id: section.id,
    order: index + 1,
    title:
      section.id === "disease-overview"
        ? "Disease Details"
        : section.id === "drug-overview"
          ? "Drug Details"
          : section.id === "competitor-analysis"
            ? "Key Competitor (Comp Analysis)"
            : section.title,
    description:
      section.id === "disease-overview"
        ? "Comprehensive overview of the medical condition"
        : section.id === "drug-overview"
          ? "Detailed pharmaceutical data and specifications"
          : "Synthesizing evidence, validating citations…",
    status:
      index === 0
        ? ("complete" as const)
        : index < 5
          ? ("complete" as const)
          : index === 5
            ? ("running" as const)
            : ("in_queue" as const),
    content:
      section.id === "disease-overview"
        ? {
            diseaseCode: "1A00: Fever",
            diseaseDefinition:
              "Fever is a temporary increase in body temperature, often due to an illness. It is a common symptom of many medical conditions, particularly infections.",
            epidemiology: {
              prevalence:
                "FMF is particularly common in Mediterranean populations, with a significant incidence reported among individuals of Turkish, Armenian, Jewish, and Arab descent.",
              incidence:
                "The onset of FMF is primarily in childhood, with a mean age of onset reported at 32.5 years for adult cases.",
            },
            clinicalFeatures:
              "FMF presents with variable clinical features influenced by genetic heterogeneity and environmental factors. The hallmark symptoms include recurrent fever, systemic inflammation, serositis, and arthritis.",
          }
        : undefined,
  }));

  return {
    jobId,
    reportTitle: `${drugName} for ${indications}`,
    generatedAt: new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }),
    sections,
  };
}

export async function fetchDrugSuggestion(
  drugName: string,
): Promise<{ original: string; suggestion: string | null }> {
  await delay(300);
  const normalized = drugName.trim().toLowerCase();
  const suggestion = DRUG_SUGGESTIONS[normalized] ?? null;
  const result = { original: drugName, suggestion };
  return drugSuggestionSchema.parse(result);
}

export async function fetchEvidence(
  type: EvidenceType,
  _filters: FilterState,
): Promise<EvidenceItem[]> {
  await delay(400);
  const items = type === "clinical" ? CLINICAL_EVIDENCE : ECONOMIC_EVIDENCE;
  return evidenceListSchema.parse(items);
}

export async function fetchComparators(
  _drugName: string,
  _indications: string,
): Promise<ComparatorItem[]> {
  await delay(350);
  return comparatorListSchema.parse(DEFAULT_COMPARATORS);
}

export async function validateComparatorName(
  name: string,
): Promise<ComparatorItem | null> {
  await delay(250);
  const trimmed = name.trim();
  if (!trimmed) return null;
  return comparatorListSchema.element.parse({
    id: `custom-${Date.now()}`,
    name: trimmed,
    isCustom: true,
  });
}

export async function fetchReportSections(): Promise<ReportSectionDefinition[]> {
  await delay(200);
  return reportSectionDefinitionsSchema.parse(DEFAULT_SECTIONS);
}

export async function generateReport(input: {
  drugName: string;
  indications: string;
  selectedSectionIds: string[];
}): Promise<GenerateReportResponse> {
  await delay(600);
  const jobId = `job-${Date.now()}`;
  const response = {
    jobId,
    reportTitle: `${input.drugName} for ${input.indications}`,
    generatedAt: new Date().toISOString(),
  };
  const parsed = generateReportResponseSchema.parse(response);
  jobStatuses.set(
    jobId,
    createInitialJobStatus(
      jobId,
      input.drugName,
      input.indications,
      input.selectedSectionIds,
    ),
  );
  return parsed;
}

export async function fetchReportJobStatus(
  jobId: string,
): Promise<ReportJobStatus> {
  await delay(300);
  const status = jobStatuses.get(jobId);
  if (!status) {
    throw new Error("Report job not found");
  }

  const updatedSections = status.sections.map((section) => {
    if (section.status === "running" && Math.random() > 0.7) {
      return { ...section, status: "complete" as const };
    }
    if (section.status === "in_queue") {
      const runningExists = status.sections.some((s) => s.status === "running");
      if (!runningExists && Math.random() > 0.5) {
        return { ...section, status: "running" as const };
      }
    }
    return section;
  });

  const updated = { ...status, sections: updatedSections };
  jobStatuses.set(jobId, updated);
  return reportJobStatusSchema.parse(updated);
}
