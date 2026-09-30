import { type NextRequest } from "next/server";

import { handleAllowlistedPlatformRoute } from "@/services/platformAllowlistProxy";
import { methodNotAllowedResponse } from "@/services/platformProxyCommon";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export function POST(request: NextRequest, context: RouteContext) {
  return handleAllowlistedPlatformRoute(
    request,
    "reviewer-invitations",
    context.params,
  );
}

export function HEAD() {
  return methodNotAllowedResponse();
}

export function OPTIONS() {
  return methodNotAllowedResponse();
}
