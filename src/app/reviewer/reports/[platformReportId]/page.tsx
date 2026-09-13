import {
  ReviewerReportShell,
  fixtureReviewerDataSource,
} from "@/features/reviewer";

export default async function ReviewerReportPage({
  params,
}: {
  params: Promise<{ platformReportId: string }>;
}) {
  const { platformReportId } = await params;
  const [report, snapshot] = await Promise.all([
    fixtureReviewerDataSource.getReport(platformReportId),
    fixtureReviewerDataSource.getDashboard(),
  ]);

  return (
    <ReviewerReportShell
      report={report}
      notifications={snapshot.notifications}
    />
  );
}
