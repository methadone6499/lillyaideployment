import { PlatformReportDetail } from "./PlatformReportDetail";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ platformReportId: string }>;
}) {
  const { platformReportId } = await params;

  return <PlatformReportDetail platformReportId={platformReportId} />;
}
