import { AuthenticatedBoundary } from "@/features/auth";
import { SeatManagementShell } from "@/features/seat-management";

type CompanyAdminSeatsPageProps = {
  searchParams: Promise<{
    preview?: string | string[];
  }>;
};

export default async function CompanyAdminSeatsPage({
  searchParams,
}: CompanyAdminSeatsPageProps) {
  const { preview } = await searchParams;
  const isDevelopmentPreview =
    process.env.NODE_ENV === "development" && preview === "1";
  const seatManagementScreen = <SeatManagementShell />;

  if (isDevelopmentPreview) {
    return seatManagementScreen;
  }

  return (
    <AuthenticatedBoundary>{seatManagementScreen}</AuthenticatedBoundary>
  );
}
