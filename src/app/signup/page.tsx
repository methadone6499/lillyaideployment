import { SignupPage } from "@/features/auth";
import { sanitizePlanIntentParam } from "@/features/billing";

type SignupRoutePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SignupRoutePage({
  searchParams,
}: SignupRoutePageProps) {
  const params = await searchParams;
  const planIntent = sanitizePlanIntentParam(params.plan);

  return <SignupPage planIntent={planIntent} />;
}
