import { ResetPasswordClient } from "@/features/auth/components/ResetPasswordClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  referrer: "no-referrer",
};

type ResetPasswordRoutePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ResetPasswordRoutePage({
  searchParams,
}: ResetPasswordRoutePageProps) {
  const params = await searchParams;
  const rawToken = params.token;
  const token = typeof rawToken === "string" ? rawToken : null;

  return <ResetPasswordClient token={token} />;
}
