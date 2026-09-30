"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

import { useAuthStatus } from "../hooks/useAuthStatus";
import { useBootstrapAuthSession } from "../hooks/useBootstrapAuthSession";
import { useCurrentUserQuery } from "../hooks/useCurrentUserQuery";
import type { Permission } from "../schemas/authSchemas";
import { AuthSessionUnavailableError } from "../session/authSessionErrors";
import {
  buildLoginRedirect,
  resolveAuthenticatedDestination,
} from "../session/returnTo";
import { getPostAuthHomePath, hasPermission } from "../utils/authAccess";
import { AuthSessionLoading } from "./AuthSessionLoading";
import { AuthSessionUnavailable } from "./AuthSessionUnavailable";

type AuthenticatedBoundaryProps = {
  children: ReactNode;
  mode?: "require-auth" | "public-only";
  requiredPermission?: Permission;
  authenticatedDestination?: string;
  authenticatedContent?: ReactNode;
};

function AuthenticatedBoundaryInner({
  children,
  mode = "require-auth",
  requiredPermission,
  authenticatedDestination,
  authenticatedContent,
}: AuthenticatedBoundaryProps) {
  const status = useAuthStatus();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bootstrapQuery = useBootstrapAuthSession();
  const { data: me } = useCurrentUserQuery();
  const homePath = getPostAuthHomePath(me);
  const hasAuthenticatedContent = authenticatedContent !== undefined;
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
      const search = searchParams.toString();
      router.replace(
        buildLoginRedirect(search ? `${pathname}?${search}` : pathname),
      );
      return;
    }

    if (lacksRequiredPermission) {
      const destination = homePath === pathname ? "/dashboard" : homePath;
      router.replace(destination);
      return;
    }

    if (
      mode === "public-only" &&
      status === "authenticated" &&
      !hasAuthenticatedContent
    ) {
      router.replace(
        resolveAuthenticatedDestination(
          authenticatedDestination,
          searchParams.get("returnTo"),
          homePath,
        ),
      );
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
    authenticatedDestination,
    hasAuthenticatedContent,
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
    return authenticatedContent ?? <AuthSessionLoading />;
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
