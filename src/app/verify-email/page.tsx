import { VerifyEmailClient } from "@/features/auth/components/VerifyEmailClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  referrer: "no-referrer",
};

type VerifyEmailRoutePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function VerifyEmailRoutePage({
  searchParams,
}: VerifyEmailRoutePageProps) {
  const params = await searchParams;
  const rawToken = params.token;
  const token = typeof rawToken === "string" ? rawToken : null;

  return <VerifyEmailClient token={token} />;
}
