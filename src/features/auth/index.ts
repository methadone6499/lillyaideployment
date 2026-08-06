export { AuthenticatedBoundary } from "./components/AuthenticatedBoundary";
export { CheckEmailPage } from "./components/CheckEmailPage";
export { ForgotPasswordPage } from "./components/ForgotPasswordPage";
export { LoginPage } from "./components/LoginPage";
export { SignupPage } from "./components/SignupPage";
export { AuthSessionProvider } from "./providers/AuthSessionProvider";
export { useCurrentUserQuery } from "./hooks/useCurrentUserQuery";
export { useAuthUser } from "./hooks/useAuthUser";
export {
  useAuthStatus,
  useConfirmedUserId,
  useIsAuthenticated,
  useIsAuthInitializing,
} from "./hooks/useAuthStatus";
export {
  useForgotPasswordMutation,
  useLogoutMutation,
  useResendVerificationMutation,
  useResetPasswordMutation,
  useSigninMutation,
  useSignupMutation,
  useVerifyEmailMutation,
} from "./hooks/useAuthMutations";
export {
  AuthSessionError,
  AuthSessionUnavailableError,
} from "./session/authSessionErrors";
export {
  ensureAuthenticatedSession,
  getCachedAuthMe,
  performLogout,
} from "./session/authSession";
export { buildLoginRedirect, sanitizeReturnTo } from "./session/returnTo";
export {
  getAuthUserDisplayName,
  getAuthUserFromMe,
  getAuthUserId,
  getAuthUserInstitutionName,
} from "./utils/authUserDisplay";
export type { AuthStatus } from "@/store/useAuthStore";
export type {
  AuthMeResponse,
  ForgotPasswordRequest,
  LoginRequest,
  MeResponse,
  MessageResponse,
  PublicUserResponse,
  ResendVerificationRequest,
  ResetPasswordRequest,
  SigninRequest,
  SigninResponse,
  SignupRequest,
  SignupResponse,
  TokenResponse,
  UserStatus,
  VerifyEmailRequest,
} from "./schemas/authSchemas";
