import type {
  CreateReportInput,
  GenerationFilters,
} from "../schemas/platformReportSchemas";

export type BuildCreateReportInputParams = {
  reportServiceId: string;
  generationJobId: string | null;
  drugName: string;
  indications: string;
  filters: GenerationFilters;
  selectedClinicalArticleIds: string[];
  selectedEconomicArticleIds: string[];
  selectedComparators: string[];
  customComparators: string[];
  selectedSectionIds: string[];
  customSections: string[];
  submittedAt: string;
};

export function buildCreateReportInput(
  params: BuildCreateReportInputParams,
): CreateReportInput {
  const drugName = params.drugName.trim();
  const indications = params.indications.trim();

  return {
    report_service_id: params.reportServiceId,
    generation_job_id: params.generationJobId,
    title: `${drugName} - ${indications}`,
    drug_name: drugName,
    indications,
    generation_snapshot: {
      filters: params.filters,
      selected_clinical_article_ids: params.selectedClinicalArticleIds,
      selected_economic_article_ids: params.selectedEconomicArticleIds,
      selected_comparators: params.selectedComparators,
      custom_comparators: params.customComparators,
      selected_section_ids: params.selectedSectionIds,
      custom_sections: params.customSections,
      submitted_at: params.submittedAt,
    },
  };
}
