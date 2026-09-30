import { type NextRequest } from "next/server";

import { proxyPlatformReportReviewRequest } from "@/services/platformReportsProxy";
import { methodNotAllowedResponse } from "@/services/platformProxyCommon";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function handleNotes(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  return proxyPlatformReportReviewRequest(request, id, "review-notes");
}

export function GET(request: NextRequest, context: RouteContext) {
  return handleNotes(request, context);
}

export function HEAD() {
  return methodNotAllowedResponse();
}

export function OPTIONS() {
  return methodNotAllowedResponse();
}
