import { z } from "zod";

export const drugSuggestionSchema = z.object({
  original: z.string(),
  suggestion: z.string().nullable(),
});

export const evidenceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number(),
  pmcUrl: z.string().url(),
  doiUrl: z.string().url(),
  studyDesign: z.string(),
  journal: z.string(),
  abstract: z.string(),
  type: z.enum(["clinical", "economic"]),
});

export const evidenceListSchema = z.array(evidenceItemSchema);

export const comparatorItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  isCustom: z.boolean().optional(),
});

export const comparatorListSchema = z.array(comparatorItemSchema);

export const reportSectionDefinitionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  isCustom: z.boolean().optional(),
});

export const reportSectionDefinitionsSchema = z.array(
  reportSectionDefinitionSchema,
);

export const reportSectionContentSchema = z.object({
  diseaseCode: z.string().optional(),
  diseaseDefinition: z.string().optional(),
  epidemiology: z
    .object({
      prevalence: z.string().optional(),
      incidence: z.string().optional(),
    })
    .optional(),
  clinicalFeatures: z.string().optional(),
  paragraphs: z
    .array(
      z.object({
        heading: z.string().optional(),
        body: z.string(),
      }),
    )
    .optional(),
});

export const generatedReportSectionSchema = z.object({
  id: z.string(),
  order: z.number(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["complete", "running", "in_queue"]),
  content: reportSectionContentSchema.optional(),
});

export const generateReportResponseSchema = z.object({
  jobId: z.string(),
  reportTitle: z.string(),
  generatedAt: z.string(),
});

export const reportJobStatusSchema = z.object({
  jobId: z.string(),
  reportTitle: z.string(),
  generatedAt: z.string(),
  sections: z.array(generatedReportSectionSchema),
});

export const filterStateSchema = z.object({
  timeRange: z.string(),
  clinicalStudyTypes: z.array(z.string()),
  evidenceSynthesis: z.string(),
  specializedTrialStructures: z.string(),
  populationType: z.string(),
  studyDuration: z.string(),
  economicStudyTypes: z.array(z.string()),
  costPopulationType: z.string(),
  patientRange: z.string(),
  costPopulationTypeSecondary: z.string(),
  costStudyDuration: z.string(),
  averageWeight: z.string(),
  genderDistribution: z.string(),
  treatmentDuration: z.string(),
  dosageFrequency: z.string(),
  regionPricingMarket: z.string(),
  outcomeEvidenceFocus: z.string(),
  geographyRegulatoryRegion: z.string(),
  evidenceQuality: z.string(),
  comparatorType: z.string(),
});
