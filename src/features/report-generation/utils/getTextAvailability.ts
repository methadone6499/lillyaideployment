import type { ArticleCandidate, TextAvailabilityFilter } from "../types";
export type TextAvailability = "full_text" | "abstract_only";

export function getTextAvailability(item: ArticleCandidate): TextAvailability {
  return (
    item.text_availability ?? (item.pmcid ? "full_text" : "abstract_only")
  );
}

export function matchesTextAvailabilityFilter(
  item: ArticleCandidate,
  filter: TextAvailabilityFilter,
): boolean {
  if (filter === "all") return true;
  return getTextAvailability(item) === filter;
}
