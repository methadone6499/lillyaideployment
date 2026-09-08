"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

import { useAuthStatus } from "../hooks/useAuthStatus";
import { useBootstrapAuthSession } from "../hooks/useBootstrapAuthSession";
import { useCurrentUserQuery } from "../hooks/useCurrentUserQuery";
import type { Permission } from "../schemas/authSchemas";
import { AuthSessionUnavailableError } from "../session/authSessionErrors";
import { buildLoginRedirect, sanitizeReturnTo } from "../session/returnTo";
import { getPostAuthHomePath, hasPermission } from "../utils/authAccess";
import { AuthSessionLoading } from "./AuthSessionLoading";
import { AuthSessionUnavailable } from "./AuthSessionUnavailable";

type AuthenticatedBoundaryProps = {
  children: ReactNode;
  mode?: "require-auth" | "public-only";
  requiredPermission?: Permission;
};

function AuthenticatedBoundaryInner({
  children,
  mode = "require-auth",
  requiredPermission,
}: AuthenticatedBoundaryProps) {
  const status = useAuthStatus();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bootstrapQuery = useBootstrapAuthSession();
  const { data: me } = useCurrentUserQuery();
  const homePath = getPostAuthHomePath(me);
  const isWaitingForAuthMe =
    mode === "require-auth" &&
    status === "authenticated" &&
    requiredPermission !== undefined &&
    !me;
  const lacksRequiredPermission =
    mode === "require-auth" &&
    status === "authenticated" &&
    requiredPermission !== undefined &&
    me !== undefined &&
    !hasPermission(me, requiredPermission);

  const isUnavailable =
    bootstrapQuery.isError &&
    bootstrapQuery.error instanceof AuthSessionUnavailableError;

  useEffect(() => {
    if (status === "initializing" || isUnavailable || isWaitingForAuthMe) {
      return;
    }

    if (mode === "require-auth" && status === "unauthenticated") {
      router.replace(buildLoginRedirect(pathname));
      return;
    }

    if (lacksRequiredPermission) {
      const destination = homePath === pathname ? "/dashboard" : homePath;
      router.replace(destination);
      return;
    }

    if (mode === "public-only" && status === "authenticated") {
      router.replace(sanitizeReturnTo(searchParams.get("returnTo"), homePath));
    }
  }, [
    status,
    mode,
    pathname,
    searchParams,
    router,
    isUnavailable,
    isWaitingForAuthMe,
    lacksRequiredPermission,
    homePath,
  ]);

  if (status === "initializing" && !isUnavailable) {
    return <AuthSessionLoading />;
  }

  if (isUnavailable) {
    return (
      <AuthSessionUnavailable
        onRetry={() => {
          void bootstrapQuery.refetch();
        }}
        isRetrying={bootstrapQuery.isFetching}
      />
    );
  }

  if (mode === "require-auth" && status === "unauthenticated") {
    return <AuthSessionLoading />;
  }

  if (mode === "public-only" && status === "authenticated") {
    return <AuthSessionLoading />;
  }

  if (isWaitingForAuthMe || lacksRequiredPermission) {
    return <AuthSessionLoading />;
  }

  return children;
}

export function AuthenticatedBoundary(props: AuthenticatedBoundaryProps) {
  return (
    <Suspense fallback={<AuthSessionLoading />}>
      <AuthenticatedBoundaryInner {...props} />
    </Suspense>
  );
}
