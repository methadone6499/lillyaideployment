import { AuthenticatedBoundary } from "@/features/auth";
import { CompanyAdminDashboardShell } from "@/features/dashboard";

type CompanyAdminDashboardPageProps = {
  searchParams: Promise<{
    preview?: string | string[];
  }>;
};

export default async function CompanyAdminDashboardPage({
  searchParams,
}: CompanyAdminDashboardPageProps) {
  const { preview } = await searchParams;
  const isDevelopmentPreview =
    process.env.NODE_ENV === "development" && preview === "1";
  const dashboard = (
    <CompanyAdminDashboardShell previewMode={isDevelopmentPreview} />
  );

  if (isDevelopmentPreview) {
    return dashboard;
  }

  return <AuthenticatedBoundary>{dashboard}</AuthenticatedBoundary>;
}
