import type {
  ReviewAssignmentStatus,
  ReviewerDashboardFilters,
} from "../schemas/reviewerSchemas";

export type ReviewerAssignmentTab = "current" | "history";
export type ReviewerAssignmentFilter = "all" | ReviewAssignmentStatus | "overdue";

const TAB_STATUSES: Record<
  ReviewerAssignmentTab,
  readonly ReviewAssignmentStatus[]
> = {
  current: ["pending", "in_review"],
  history: ["completed", "superseded"],
};

const FILTER_OPTIONS: readonly {
  value: ReviewerAssignmentFilter;
  label: string;
}[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
  { value: "superseded", label: "Superseded" },
];

export function getReviewerAssignmentFilters(
  tab: ReviewerAssignmentTab,
  filter: ReviewerAssignmentFilter,
): Pick<ReviewerDashboardFilters, "status" | "overdue"> {
  const statuses = TAB_STATUSES[tab];
  const selectedStatus =
    filter !== "all" && filter !== "overdue" &&
    statuses.some((status) => status === filter)
      ? filter
      : statuses;

  return {
    status: selectedStatus,
    overdue: tab === "current" && filter === "overdue" ? true : undefined,
  };
}

export function getReviewerAssignmentFilterOptions(tab: ReviewerAssignmentTab) {
  return FILTER_OPTIONS.filter(
    (option) => option.value === "all" ||
      (option.value === "overdue"
        ? tab === "current"
        : TAB_STATUSES[tab].some((status) => status === option.value)),
  );
}
