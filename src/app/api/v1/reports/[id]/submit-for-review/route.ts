import { type NextRequest } from "next/server";

import { proxyPlatformReportReviewRequest } from "@/services/platformReportsProxy";
import { methodNotAllowedResponse } from "@/services/platformProxyCommon";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function handleSubmit(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  return proxyPlatformReportReviewRequest(
    request,
    id,
    "submit-for-review",
  );
}

export function POST(request: NextRequest, context: RouteContext) {
  return handleSubmit(request, context);
}

export function HEAD() {
  return methodNotAllowedResponse();
}

export function OPTIONS() {
  return methodNotAllowedResponse();
}
