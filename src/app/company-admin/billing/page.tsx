import { BILLING_PATHS } from "@/features/billing";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function CompanyAdminBillingPage() {
  redirect(BILLING_PATHS.settings);
}
