import type {
  CreateReportInput,
  GenerationFilters,
} from "../schemas/platformReportSchemas";

/** AI `section_types` tokens. Never persist these on Platform `custom_sections`. */
const CUSTOM_SECTION_TOKEN_PREFIX = "custom:";

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
  /** Built-in wizard section ids only. `custom:<uuid>` tokens are stripped. */
  selectedSectionIds: string[];
  /**
   * User-facing titles of enabled ready customs, in outline order.
   * Not objects and not `custom:<uuid>` tokens.
   */
  customSectionTitles: string[];
  submittedAt: string;
};

function toPlatformSelectedSectionIds(ids: readonly string[]): string[] {
  return ids.filter(
    (id) => typeof id === "string" && !id.startsWith(CUSTOM_SECTION_TOKEN_PREFIX),
  );
}

function toPlatformCustomSectionTitles(titles: readonly string[]): string[] {
  return titles.flatMap((title) => {
    if (typeof title !== "string") {
      return [];
    }

    const trimmed = title.trim();
    if (!trimmed || trimmed.startsWith(CUSTOM_SECTION_TOKEN_PREFIX)) {
      return [];
    }

    return [trimmed];
  });
}

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
      selected_section_ids: toPlatformSelectedSectionIds(
        params.selectedSectionIds,
      ),
      custom_sections: toPlatformCustomSectionTitles(params.customSectionTitles),
      submitted_at: params.submittedAt,
    },
  };
}
