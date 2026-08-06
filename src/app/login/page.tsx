import { AuthenticatedBoundary, LoginPage } from "@/features/auth";

export default function LoginRoutePage() {
  return (
    <AuthenticatedBoundary mode="public-only">
      <LoginPage />
    </AuthenticatedBoundary>
  );
}
