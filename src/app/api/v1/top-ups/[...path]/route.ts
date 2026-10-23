import type { NextRequest } from "next/server";
import { handleAllowlistedPlatformRoute } from "@/services/platformAllowlistProxy";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ path: string[] }> };

export function GET(request: NextRequest, context: RouteContext) {
  return handleAllowlistedPlatformRoute(request, "top-ups", context.params);
}
export function POST(request: NextRequest, context: RouteContext) {
  return handleAllowlistedPlatformRoute(request, "top-ups", context.params);
}
export function PUT(request: NextRequest, context: RouteContext) {
  return handleAllowlistedPlatformRoute(request, "top-ups", context.params);
}
