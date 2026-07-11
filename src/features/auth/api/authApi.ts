import {
  meResponseSchema,
  signinRequestSchema,
  signinResponseSchema,
  signupRequestSchema,
  signupResponseSchema,
  type MeResponse,
  type SigninRequest,
  type SigninResponse,
  type SignupRequest,
  type SignupResponse,
} from "../schemas/authSchemas";
import { authFetch } from "./authFetch";

export { AuthApiError } from "./authFetch";

export function signup(input: SignupRequest): Promise<SignupResponse> {
  return authFetch("/auth/signup", {
    method: "POST",
    body: signupRequestSchema.parse(input),
    schema: signupResponseSchema,
  });
}

export function signin(input: SigninRequest): Promise<SigninResponse> {
  return authFetch("/auth/signin", {
    method: "POST",
    body: signinRequestSchema.parse(input),
    schema: signinResponseSchema,
  });
}

export function getMe(): Promise<MeResponse> {
  return authFetch("/auth/me", { schema: meResponseSchema });
}
