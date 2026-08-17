import { AuthenticatedBoundary } from "@/features/auth";
import { BillingShell } from "@/features/billing";

export default function CompanyAdminBillingPage() {
  return (
    <AuthenticatedBoundary>
      <BillingShell accountMenuVariant="company-admin" />
    </AuthenticatedBoundary>
  );
}
