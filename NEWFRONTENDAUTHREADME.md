# Frontend Auth Integration

This guide describes the frontend work required for LillyAI signup, email
verification, login handling, and password recovery.

The examples are framework-agnostic TypeScript. They can be used from React,
Next.js, Vue, or another JavaScript frontend. The backend API reference remains
in the repository's main [README](../../README.md).

## 1. URLs and environment configuration

The backend routes are under `/api/v1`. Configure the frontend with the backend
origin:

```env
VITE_API_URL=http://localhost:8000
```

For Next.js, use an appropriate public variable such as:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The backend must point email links at the frontend and allow its browser origin:

```env
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
```

Use the frontend's real port. For example, use `http://localhost:5173` for the
default Vite development server.

The backend generates these browser links:

```text
{FRONTEND_URL}/verify-email?token=...
{FRONTEND_URL}/reset-password?token=...
```

Therefore, the frontend must provide `/verify-email` and `/reset-password`
routes.

## 2. Shared API client

Create a small API client so all auth calls handle errors consistently:

```ts
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type ApiErrorBody = {
  code: string;
  message: string;
  details: unknown;
  request_id: string | null;
};

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;
  requestId: string | null;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details;
    this.requestId = body.request_id;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorBody;
    throw new ApiError(response.status, error);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
```

`credentials: "include"` is important for login and refresh because the backend
stores the refresh token in an HttpOnly cookie. JavaScript cannot and should not
read that cookie directly.

## 3. Auth API functions

```ts
import { apiRequest } from "./api";

export type SignupInput = {
  full_name: string;
  institution_name: string;
  email: string;
  password: string;
};

export type SignupResponse = {
  id: string;
  email: string;
  full_name: string;
  institution_name: string;
  status: "pending_verification";
  email_verified: false;
  created_at: string;
};

export type MessageResponse = {
  message: string;
};

export function signup(input: SignupInput) {
  return apiRequest<SignupResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyEmail(token: string) {
  return apiRequest<MessageResponse>("/auth/email/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendVerification(email: string) {
  return apiRequest<MessageResponse>("/auth/email/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function forgotPassword(email: string) {
  return apiRequest<MessageResponse>("/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, newPassword: string) {
  return apiRequest<MessageResponse>("/auth/password/reset", {
    method: "POST",
    body: JSON.stringify({
      token,
      new_password: newPassword,
    }),
  });
}
```

Passwords must contain 12–128 characters. The frontend may validate this for
immediate feedback, but the backend remains authoritative.

## 4. Signup page

The signup form now needs:

- Full name
- Company or institution name
- Email
- Password
- Confirm password (frontend-only)

Submit:

```http
POST /api/v1/auth/signup
```

```json
{
  "full_name": "Mustafa Khalid",
  "institution_name": "Example Pharma",
  "email": "mustafa@example.com",
  "password": "secure-password-12"
}
```

Successful signup returns `201` with a pending user. It does not return an access
token and does not log the user in.

After success:

1. Navigate to a "Check your email" screen.
2. Display the submitted email.
3. Provide a resend button.
4. Provide a way to correct the email by returning to signup.

The resend button should have a 60-second visual cooldown. The backend also
enforces its own cooldown.

Important signup errors:

| Code | Status | Frontend behavior |
| --- | ---: | --- |
| `duplicate_email` | `409` | Explain that the email is already registered, prominently offer verification resend, and offer login as a secondary action for already verified users. |
| `validation_error` | `422` | Display the validation information near the relevant fields. |

Do not present password recovery as the primary resolution for
`duplicate_email`. A pending user cannot recover access through the
forgot-password flow because the account still requires email verification.
The duplicate-email state should therefore lead with the generic
resend-verification action, which is safe whether the address belongs to a
pending or already verified account.

Avoid encouraging the user to retry signup with a different email as the main
escape path. Each retry can leave another pending account behind. Those stale
pending accounts remain a backend lifecycle concern until an explicit expiry or
cleanup policy is implemented.

## 5. Verify-email page

Route:

```text
/verify-email?token=...
```

On page load:

1. Read `token` using `URLSearchParams`.
2. If it is missing, show an invalid-link state.
3. Call `verifyEmail(token)` exactly once.
4. On success, show a verified state and a login button.
5. On failure, show an expired/invalid state and a resend form.

Basic token extraction:

```ts
const params = new URLSearchParams(window.location.search);
const token = params.get("token");
```

Do not log the token or place it in analytics events. After reading it into
memory, the page may remove it from the visible URL:

```ts
window.history.replaceState({}, "", "/verify-email");
```

### React Strict Mode warning

Do not allow a development `useEffect` to submit verification twice. The token
is single-use, so the first request can succeed and the second can return an
invalid-token error. Guard the request with a ref or use a data-fetching
mutation that deduplicates the call:

```ts
const started = useRef(false);

useEffect(() => {
  if (!token || started.current) return;
  started.current = true;
  void verifyEmail(token);
}, [token]);
```

Responses:

| Result | Status/code | Frontend behavior |
| --- | --- | --- |
| Verified | `200` | Show success and link to login. |
| Invalid, expired, revoked, or reused | `400 invalid_or_expired_token` | Show an invalid-link state and offer resend. |

## 6. Resend-verification form

Submit:

```http
POST /api/v1/auth/email/resend-verification
```

```json
{
  "email": "mustafa@example.com"
}
```

The endpoint returns `202` and intentionally uses the same message whether the
account exists or not:

```json
{
  "message": "If an account requires verification for that email, a new verification link has been sent"
}
```

Always display that message. Do not change the UI based on whether the email is
registered because the backend intentionally does not reveal that information.

## 7. Login behavior for unverified users

The login request remains the same. Correct credentials for an unverified
account return:

```json
{
  "code": "email_not_verified",
  "message": "Email address has not been verified",
  "details": null,
  "request_id": "..."
}
```

When `error.code === "email_not_verified"`:

1. Explain that verification is required.
2. Show a resend-verification button or form.
3. Do not store authentication state; no session was created.

Disabled accounts continue to return `account_disabled`.

## 8. Forgot-password page

Submit:

```http
POST /api/v1/auth/password/forgot
```

```json
{
  "email": "mustafa@example.com"
}
```

The endpoint returns `202` with:

```json
{
  "message": "If an account exists for that email, a password reset link has been sent"
}
```

Always show this message. Do not display whether an account was found.

## 9. Reset-password page

Route:

```text
/reset-password?token=...
```

The page needs:

- New password
- Confirm new password

Before submitting:

1. Read the token from the query string.
2. Confirm both password fields match.
3. Confirm the password contains 12–128 characters.

Submit:

```http
POST /api/v1/auth/password/reset
```

```json
{
  "token": "token-from-the-email",
  "new_password": "new-secure-password-12"
}
```

On `200`, show a success state and direct the user to login. The backend revokes
all of the user's existing sessions, so the user must authenticate with the new
password.

On `400 invalid_or_expired_token`, show that the link is invalid or expired and
provide a link to the forgot-password page.

Do not log the reset token or send it to analytics.

## 10. Recommended page states

Each asynchronous page should explicitly support:

```text
idle → submitting → success
                  ↘ error
```

Disable submit buttons while a request is running. This prevents accidental
double submissions and makes the result easier to understand.

Recommended routes:

| Frontend route | Purpose |
| --- | --- |
| `/signup` | Create the pending account. |
| `/check-email` | Explain that verification is required and offer resend. |
| `/verify-email` | Consume the verification token from the email. |
| `/login` | Authenticate only after verification. |
| `/forgot-password` | Request a reset email. |
| `/reset-password` | Consume the reset token and set a new password. |

## 11. Manual testing checklist

1. Sign up with a new email and institution name.
2. Confirm the UI moves to the check-email state without logging in.
3. Open the verification email.
4. Confirm `/verify-email` verifies once and offers login.
5. Log in successfully.
6. Retry signup with the same pending email and confirm the duplicate-email
   state prominently offers verification resend rather than password recovery.
7. Test resend verification from the duplicate-email state.
8. Try logging in before verification and confirm the resend option appears.
9. Request a password-reset email.
10. Open `/reset-password`, set a new password, and confirm login works with it.
11. Reuse a verification or reset link and confirm the UI shows the invalid-link state.
12. Try forgot-password with an unknown email and confirm the UI shows the same generic result.

## 12. Backend endpoints summary

| Method | Endpoint | Success |
| --- | --- | ---: |
| `POST` | `/api/v1/auth/signup` | `201` |
| `POST` | `/api/v1/auth/email/verify` | `200` |
| `POST` | `/api/v1/auth/email/resend-verification` | `202` |
| `POST` | `/api/v1/auth/login` | `200` |
| `POST` | `/api/v1/auth/password/forgot` | `202` |
| `POST` | `/api/v1/auth/password/reset` | `200` |
