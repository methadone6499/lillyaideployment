"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

import { useAuthStatus } from "../hooks/useAuthStatus";
import { useBootstrapAuthSession } from "../hooks/useBootstrapAuthSession";
import { AuthSessionUnavailableError } from "../session/authSessionErrors";
import { buildLoginRedirect, sanitizeReturnTo } from "../session/returnTo";
import { AuthSessionLoading } from "./AuthSessionLoading";
import { AuthSessionUnavailable } from "./AuthSessionUnavailable";

type AuthenticatedBoundaryProps = {
  children: ReactNode;
  mode?: "require-auth" | "public-only";
};

function AuthenticatedBoundaryInner({
  children,
  mode = "require-auth",
}: AuthenticatedBoundaryProps) {
  const status = useAuthStatus();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bootstrapQuery = useBootstrapAuthSession();

  const isUnavailable =
    bootstrapQuery.isError &&
    bootstrapQuery.error instanceof AuthSessionUnavailableError;

  useEffect(() => {
    if (status === "initializing" || isUnavailable) {
      return;
    }

    if (mode === "require-auth" && status === "unauthenticated") {
      router.replace(buildLoginRedirect(pathname));
      return;
    }

    if (mode === "public-only" && status === "authenticated") {
      router.replace(sanitizeReturnTo(searchParams.get("returnTo")));
    }
  }, [status, mode, pathname, searchParams, router, isUnavailable]);

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

  return children;
}

export function AuthenticatedBoundary(props: AuthenticatedBoundaryProps) {
  return (
    <Suspense fallback={<AuthSessionLoading />}>
      <AuthenticatedBoundaryInner {...props} />
    </Suspense>
  );
}
