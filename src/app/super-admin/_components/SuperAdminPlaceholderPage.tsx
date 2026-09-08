import { AppHeader } from "@/components/shared/AppHeader";
import { DashboardHeaderActions } from "@/features/dashboard";

type SuperAdminPlaceholderPageProps = {
  title: string;
};

export function SuperAdminPlaceholderPage({
  title,
}: SuperAdminPlaceholderPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader actions={<DashboardHeaderActions />} />

      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 pt-10 pb-14 sm:px-6 lg:px-12 lg:pt-[57px]">
        <h1 className="text-page-title font-medium text-text-heading">{title}</h1>
      </main>
    </div>
  );
}
