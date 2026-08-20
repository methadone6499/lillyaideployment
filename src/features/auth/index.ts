export { AuthField } from "./components/AuthField";
export { AuthFormAlert } from "./components/AuthFormAlert";
export { AuthGradientLink } from "./components/AuthGradientLink";
export { AuthPageShell } from "./components/AuthPageShell";
export { AuthSubmitButton } from "./components/AuthSubmitButton";
export { AuthenticatedBoundary } from "./components/AuthenticatedBoundary";
export { CheckEmailPage } from "./components/CheckEmailPage";
export { ForgotPasswordPage } from "./components/ForgotPasswordPage";
export { LoginForm } from "./components/LoginForm";
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
export { authenticatedAuthRequest } from "./session/authenticatedAuthRequest";
export {
  beginNewAuthSession,
  ensureAuthenticatedSession,
  establishAuthenticatedSession,
  getCachedAuthMe,
  performLogout,
  refetchAuthMe,
} from "./session/authSession";
export {
  classifyLoginError,
  type LoginErrorState,
} from "./utils/classifyLoginError";
export { buildLoginRedirect, sanitizeReturnTo } from "./session/returnTo";
export {
  getActiveContext,
  getPostAuthHomePath,
  hasPermission,
} from "./utils/authAccess";
export {
  getAuthUserDisplayName,
  getAuthUserFromMe,
  getAuthUserId,
  getAuthUserInstitutionName,
} from "./utils/authUserDisplay";
export type { AuthStatus } from "@/store/useAuthStore";
export type {
  AuthMeResponse,
  ContextResponse,
  ContextType,
  EffectiveRole,
  ForgotPasswordRequest,
  LoginRequest,
  MeResponse,
  MessageResponse,
  Permission,
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
