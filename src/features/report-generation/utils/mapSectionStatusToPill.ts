import type { ReportSectionStatus } from "@/components/ui";
import type { SectionStatus } from "../types";

export function mapSectionStatusToPill(
  status: SectionStatus,
): ReportSectionStatus {
  switch (status) {
    case "completed":
    case "partially_completed":
      return "complete";
    case "running":
      return "running";
    case "pending":
      return "in_queue";
    case "failed":
      return "failed";
  }
}
