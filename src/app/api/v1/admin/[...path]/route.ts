import { type NextRequest } from "next/server";

import { handleAllowlistedPlatformRoute } from "@/services/platformAllowlistProxy";
import { methodNotAllowedResponse } from "@/services/platformProxyCommon";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export function GET(request: NextRequest, context: RouteContext) {
  return handleAllowlistedPlatformRoute(request, "admin", context.params);
}

export function POST(request: NextRequest, context: RouteContext) {
  return handleAllowlistedPlatformRoute(request, "admin", context.params);
}

export function PUT(request: NextRequest, context: RouteContext) {
  return handleAllowlistedPlatformRoute(request, "admin", context.params);
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return handleAllowlistedPlatformRoute(request, "admin", context.params);
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return handleAllowlistedPlatformRoute(request, "admin", context.params);
}

export function HEAD() {
  return methodNotAllowedResponse();
}

export function OPTIONS() {
  return methodNotAllowedResponse();
}
