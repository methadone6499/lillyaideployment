export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  console.log("url", url);
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set. Add it to .env.dev for local development.",
    );
  }
  return url.replace(/\/$/, "");
}
