import { type NextRequest } from "next/server";

import { proxyPlatformReportDetailRequest } from "@/services/platformReportsProxy";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function handleReportDetailProxyRequest(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;

  return proxyPlatformReportDetailRequest(request, id);
}

export function GET(request: NextRequest, context: RouteContext) {
  return handleReportDetailProxyRequest(request, context);
}

export function HEAD() {
  return new Response(null, { status: 405 });
}

export function OPTIONS() {
  return new Response(null, { status: 405 });
}
