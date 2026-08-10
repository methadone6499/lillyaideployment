import { type NextRequest } from "next/server";

import { proxyPlatformReportsCollectionRequest } from "@/services/platformReportsProxy";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return proxyPlatformReportsCollectionRequest(request);
}

export function POST(request: NextRequest) {
  return proxyPlatformReportsCollectionRequest(request);
}

export function HEAD() {
  return new Response(null, { status: 405 });
}

export function OPTIONS() {
  return new Response(null, { status: 405 });
}
