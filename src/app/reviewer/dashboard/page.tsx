import {
  ReviewerDashboardShell,
  fixtureReviewerDataSource,
} from "@/features/reviewer";

export default async function ReviewerDashboardPage() {
  const snapshot = await fixtureReviewerDataSource.getDashboard();

  return <ReviewerDashboardShell snapshot={snapshot} />;
}
