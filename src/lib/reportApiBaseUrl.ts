export function getReportApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_REPORT_API_BASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_REPORT_API_BASE_URL is not set. Add it to your environment configuration.",
    );
  }
  return url.replace(/\/$/, "");
}
