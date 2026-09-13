import type {
  ReviewerDashboardScenario,
  ReviewerDataSource,
} from "../types";
import {
  emptyReviewerDashboardSnapshot,
  reviewerDashboardSnapshot,
  reviewerReportDetailsById,
} from "./reviewerFixtures";

export function createFixtureReviewerDataSource(
  scenario: ReviewerDashboardScenario = "default",
): ReviewerDataSource {
  if (scenario === "empty") {
    return {
      getDashboard: async () => emptyReviewerDashboardSnapshot,
      getReport: async () => null,
    };
  }

  return {
    getDashboard: async () => reviewerDashboardSnapshot,
    getReport: async (platformReportId) =>
      reviewerReportDetailsById.get(platformReportId) ?? null,
  };
}

export const fixtureReviewerDataSource = createFixtureReviewerDataSource();

export const emptyFixtureReviewerDataSource =
  createFixtureReviewerDataSource("empty");
