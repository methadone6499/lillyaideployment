import type {
  ArticleUploadResponse,
  ArticleUploadSelection,
  WizardArticleUpload,
} from "../types";

export const ARTICLE_UPLOAD_ACCEPT = "application/pdf,.pdf";
export const ARTICLE_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;

export function validateArticleUploadFile(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return "Upload a PDF file.";
  }
  if (file.size > ARTICLE_UPLOAD_MAX_BYTES) {
    return "PDF files must be 20 MB or smaller.";
  }
  return null;
}

export function getArticleUploadSelectionId(
  upload: Pick<ArticleUploadSelection, "pmcid" | "pmid">,
): string {
  return upload.pmcid || upload.pmid;
}

export function toWizardArticleUpload(
  response: ArticleUploadResponse,
  fileName: string,
  options: { acceptedWarning: boolean; replaceExisting: boolean },
): WizardArticleUpload {
  return {
    upload_id: response.upload_id,
    pmid: response.pmid,
    pmcid: response.pmcid,
    bucket: response.bucket,
    match_status: response.status,
    accepted_warning: options.acceptedWarning,
    replace_existing: options.replaceExisting,
    fileName,
    message: response.message,
    scores: response.scores,
  };
}

export function buildSelectedArticleUploads(
  uploads: readonly WizardArticleUpload[],
  selectedClinicalArticleIds: readonly string[],
  selectedEconomicArticleIds: readonly string[],
): ArticleUploadSelection[] {
  return uploads.flatMap((upload) => {
    const selectionId = getArticleUploadSelectionId(upload);
    const selectedIds =
      upload.bucket === "clinical"
        ? selectedClinicalArticleIds
        : selectedEconomicArticleIds;

    if (!selectionId || !selectedIds.includes(selectionId)) {
      return [];
    }

    return [
      {
        upload_id: upload.upload_id,
        pmid: upload.pmid,
        pmcid: upload.pmcid,
        bucket: upload.bucket,
        match_status: upload.match_status,
        accepted_warning: upload.accepted_warning,
        replace_existing: upload.replace_existing,
      },
    ];
  });
}
