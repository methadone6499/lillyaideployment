import { AuthenticatedBoundary, SignupPage } from "@/features/auth";

export default function SignupRoutePage() {
  return (
    <AuthenticatedBoundary mode="public-only">
      <SignupPage />
    </AuthenticatedBoundary>
  );
}
