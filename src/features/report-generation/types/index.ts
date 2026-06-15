export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export type EvidenceType = "clinical" | "economic";

export type ReportSectionStatus = "complete" | "running" | "in_queue";

export type FilterState = {
  timeRange: string;
  clinicalStudyTypes: string[];
  evidenceSynthesis: string;
  specializedTrialStructures: string;
  populationType: string;
  studyDuration: string;
  economicStudyTypes: string[];
  costPopulationType: string;
  patientRange: string;
  costPopulationTypeSecondary: string;
  costStudyDuration: string;
  averageWeight: string;
  genderDistribution: string;
  treatmentDuration: string;
  dosageFrequency: string;
  regionPricingMarket: string;
  outcomeEvidenceFocus: string;
  geographyRegulatoryRegion: string;
  evidenceQuality: string;
  comparatorType: string;
};

export type EvidenceItem = {
  id: string;
  title: string;
  year: number;
  pmcUrl: string;
  doiUrl: string;
  studyDesign: string;
  journal: string;
  abstract: string;
  type: EvidenceType;
};

export type ComparatorItem = {
  id: string;
  name: string;
  isCustom?: boolean;
};

export type ReportSectionDefinition = {
  id: string;
  title: string;
  description: string;
  isCustom?: boolean;
};

export type GeneratedReportSection = {
  id: string;
  order: number;
  title: string;
  description: string;
  status: ReportSectionStatus;
  content?: ReportSectionContent;
};

export type ReportSectionContent = {
  diseaseCode?: string;
  diseaseDefinition?: string;
  epidemiology?: {
    prevalence?: string;
    incidence?: string;
  };
  clinicalFeatures?: string;
  paragraphs?: Array<{ heading?: string; body: string }>;
};

export type DrugSuggestion = {
  original: string;
  suggestion: string | null;
};

export type GenerateReportResponse = {
  jobId: string;
  reportTitle: string;
  generatedAt: string;
};

export type ReportJobStatus = {
  jobId: string;
  reportTitle: string;
  generatedAt: string;
  sections: GeneratedReportSection[];
};
