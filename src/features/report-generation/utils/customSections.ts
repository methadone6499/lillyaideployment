import { ReportApiError } from "../api/reportApiError";
import { getReportRequestErrorMessage } from "./getReportRequestErrorMessage";
import type {
  CustomSectionMode,
  CustomSectionSpec,
  WizardCustomSection,
} from "../types";

export const CUSTOM_SECTION_MAX_FILE_BYTES = 20 * 1024 * 1024;
export const CUSTOM_SECTION_FILE_ACCEPT = ".pdf,.docx";

export function getCustomSectionMode(input: {
  prompt?: string;
  file?: File;
}): CustomSectionMode {
  const hasPrompt = Boolean(input.prompt?.trim());
  const hasFile = Boolean(input.file);
  if (hasPrompt && hasFile) {
    return "both";
  }
  if (hasFile) {
    return "file";
  }
  return "prompt";
}

export function validateCustomSectionFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
    return "Upload a .pdf or .docx file.";
  }
  if (file.size > CUSTOM_SECTION_MAX_FILE_BYTES) {
    return "File must be 20 MB or smaller.";
  }
  return null;
}

export function mapCustomSpecsToWizard(
  specs: readonly CustomSectionSpec[],
): WizardCustomSection[] {
  return specs
    .map((spec, index) => ({ spec, index }))
    .sort((a, b) => {
      const orderA = a.spec.sort_order ?? a.index;
      const orderB = b.spec.sort_order ?? b.index;
      return orderA - orderB;
    })
    .map(({ spec }) => ({
      customId: spec.custom_id,
      title: spec.title,
      enabled: spec.enabled,
    }));
}

/** Platform `generation_snapshot.custom_sections` and viewer fallback labels. */
export function enabledCustomSectionTitles(
  sections: readonly WizardCustomSection[],
): string[] {
  return sections.flatMap((section) => {
    if (!section.enabled) {
      return [];
    }

    const title = section.title.trim();
    return title ? [title] : [];
  });
}

export function specToWizardCustomSection(
  spec: CustomSectionSpec,
): WizardCustomSection {
  return {
    customId: spec.custom_id,
    title: spec.title,
    enabled: spec.enabled,
  };
}

export function getCustomSectionErrorMessage(error: unknown, action: "load" | "add" | "update" | "remove" = "update"): string {
  if (error instanceof ReportApiError) {
    if (error.status === 413) return "This file is larger than the 20 MB limit. Choose a smaller PDF or Word document.";
    if (error.status === 409) return "The custom section could not be changed in the report's current state. Refresh the report and try again.";
    if (error.status === 422 && error.message.includes("lack of structured outline")) return "We could not find a clear section outline in this template. Upload a file with headings or add instructions describing the section you need.";
    if ((error.status === 400 || error.status === 422) && action !== "load") return "Check the section title, instructions, and uploaded file, then try again.";
  }
  return getReportRequestErrorMessage(error, `We could not ${action} the custom section${action === "load" ? "s" : ""}. Try again. If this continues, contact support.`);
}
