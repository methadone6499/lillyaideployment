"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/ui";
import { ReportViewer } from "@/features/report-generation";
import { usePlatformReport } from "@/features/reports";
import { ApiRequestError } from "@/services/ApiRequestError";
import { useRouter } from "next/navigation";

type PlatformReportDetailProps = {
  platformReportId: string;
};

function getPlatformDetailErrorMessage(error: unknown): {
  title: string;
  message: string;
} {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) {
      return {
        title: "Access denied",
        message:
          "You do not have permission to view this report.",
      };
    }

    if (error.status === 404) {
      return {
        title: "Report unavailable",
        message:
          "This report could not be found or is no longer available.",
      };
    }

    return {
      title: "Unable to load report",
      message: error.message || "Something went wrong. Please try again.",
    };
  }

  if (error instanceof Error) {
    return {
      title: "Unable to load report",
      message: error.message,
    };
  }

  return {
    title: "Unable to load report",
    message: "Something went wrong. Please try again.",
  };
}

export function PlatformReportDetail({
  platformReportId,
}: PlatformReportDetailProps) {
  const router = useRouter();
  const reportQuery = usePlatformReport(platformReportId);

  if (reportQuery.isLoading && !reportQuery.data) {
    return (
      <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-white">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-[var(--layout-page-padding)] py-6">
          <p className="text-body-lg text-text-muted">Loading report…</p>
        </main>
      </div>
    );
  }

  if (reportQuery.isError) {
    const { title, message } = getPlatformDetailErrorMessage(reportQuery.error);

    return (
      <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-white">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col gap-8 px-[var(--layout-page-padding)] py-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-page-title font-medium text-text-heading">
              {title}
            </h1>
            <p className="text-body-lg text-text-body" role="alert">
              {message}
            </p>
          </div>
          <div>
            <Button
              variant="secondary"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!reportQuery.data) {
    return (
      <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-white">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-[var(--layout-page-padding)] py-6">
          <p className="text-body-lg text-text-muted">Loading report…</p>
        </main>
      </div>
    );
  }

  const report = reportQuery.data;

  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-white">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-[var(--layout-page-padding)] py-6">
        <ReportViewer
          reportServiceId={report.report_service_id}
          title={report.title}
          filters={report.generation_snapshot.filters}
          selectedSectionIds={
            report.generation_snapshot.selected_section_ids
          }
          onBack={() => router.push("/dashboard")}
        />
      </main>
    </div>
  );
}
