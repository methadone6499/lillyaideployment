import type { ReportSectionStatus } from "@/components/ui";
import type { SectionStatus } from "../types";

export function mapSectionStatusToPill(
  status: SectionStatus,
): ReportSectionStatus {
  switch (status) {
    case "completed":
      return "complete";
    case "processing":
      return "running";
    case "queued":
    case "pending":
    case "blocked":
      return "in_queue";
    case "failed":
      return "failed";
  }
}
