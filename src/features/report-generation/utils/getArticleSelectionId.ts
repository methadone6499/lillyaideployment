import type { ArticleCandidate } from "../types";

/**
 * PMCID-first selection key for evidence rows.
 * Falls back to PMID for abstract-only (PMID-only) articles.
 */
export function getArticleSelectionId(
  article: Pick<ArticleCandidate, "pmcid" | "pmid">,
): string {
  return article.pmcid ?? article.pmid;
}
