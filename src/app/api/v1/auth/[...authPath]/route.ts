import { type NextRequest } from "next/server";

import { proxyPlatformAuthRequest } from "@/services/platformAuthProxy";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ authPath: string[] }>;
};

async function handleAuthProxyRequest(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  const { authPath } = await context.params;

  return proxyPlatformAuthRequest(request, authPath);
}

export function GET(request: NextRequest, context: RouteContext) {
  return handleAuthProxyRequest(request, context);
}

export function POST(request: NextRequest, context: RouteContext) {
  return handleAuthProxyRequest(request, context);
}

export function HEAD() {
  return new Response(null, { status: 405 });
}

export function OPTIONS() {
  return new Response(null, { status: 405 });
}
