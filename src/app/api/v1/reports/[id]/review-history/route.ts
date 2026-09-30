import { type NextRequest } from "next/server";

import { proxyPlatformReportReviewRequest } from "@/services/platformReportsProxy";
import { methodNotAllowedResponse } from "@/services/platformProxyCommon";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyPlatformReportReviewRequest(request, id, "review-history");
}

export function HEAD() { return methodNotAllowedResponse(); }
export function OPTIONS() { return methodNotAllowedResponse(); }
