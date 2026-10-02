# Super Admin Management Frontend Handoff

## Overview

This backend change supports:

1. Listing and inspecting all companies.
2. Opening a company and listing its current or removed members.
3. Disabling and re-enabling non-Super-Admin user accounts.

All endpoints use the existing `/api/v1` prefix and require a Super Admin Bearer token.

## Important disable-account warning

Show a confirmation warning before calling the disable endpoint. Suggested copy:

> Disabling this account immediately blocks sign-in and invalidates active sessions. It does not
> cancel subscriptions or billing, remove company membership, release seats or quota, delete
> reports, or change company status.

If the selected user's `access.effective_role` is `company_admin`, additionally warn that disabling
the account can leave that company without a functioning administrator.

There is currently no administrative-reason field. Both mutation endpoints have no request body.

## Permissions

The backend resolves permissions from the authenticated account; do not derive them from client
state.

- Company reads: `admin:companies_read`
- User reads: `admin:users_read`
- User disable/enable: `admin:users_manage`

## Company list

### Request

```http
GET /api/v1/admin/companies
Authorization: Bearer <access-token>
```

Optional query parameters:

| Parameter | Values / constraints |
| --- | --- |
| `search` | Up to 100 characters; searches company, billing email, and primary admin identity |
| `status` | `active`, `suspended`, `disabled` |
| `type` | `enterprise`, `custom` |
| `plan_type` | `standard`, `enterprise`, `custom` |
| `subscription_status` | `trialing`, `active`, `past_due`, `cancelled`, `expired`, `suspended`, `inactive` |
| `limit` | `1`–`50`; default `20` |
| `cursor` | Opaque cursor returned by the previous response |

### Response

```ts
type AdminCompanyListResponse = {
  items: AdminCompany[];
  next_cursor: string | null;
};

type AdminCompany = {
  id: string;
  name: string;
  type: "enterprise" | "custom";
  status: "active" | "suspended" | "disabled";
  billing_email: string;
  primary_admin: {
    user_id: string;
    full_name: string;
    email: string;
  } | null;
  subscription: {
    id: string;
    plan_type: "standard" | "enterprise" | "custom";
    status:
      | "trialing"
      | "active"
      | "past_due"
      | "cancelled"
      | "expired"
      | "suspended"
      | "inactive";
    amount_minor: number;
    currency: string;
    billing_interval: "month";
    current_period_start: string;
    current_period_end: string;
    limits: { seats: number; reports: number };
  } | null;
  seats: {
    limit: number;
    occupied: number;
    active: number;
    disabled: number;
    pending_invitations: number;
    available: number;
  };
  quota: {
    total: number;
    allocated: number;
    unallocated: number;
    used: number;
    remaining: number;
  } | null;
  created_at: string;
};
```

Use `next_cursor` unchanged for the next page. A null cursor means there are no more results.

## Company detail

```http
GET /api/v1/admin/companies/{company_id}
Authorization: Bearer <access-token>
```

The response is one `AdminCompany` object using the shape above.

## Company members

### Request

```http
GET /api/v1/admin/companies/{company_id}/members
Authorization: Bearer <access-token>
```

Optional query parameters:

| Parameter | Values / constraints |
| --- | --- |
| `search` | Up to 100 characters; searches member name and email |
| `status` | Membership status: `active`, `disabled`, `removed` |
| `role` | `company_admin`, `company_seat_user` |
| `user_status` | Account status: `pending_verification`, `active`, `disabled` |
| `limit` | `1`–`50`; default `20` |
| `cursor` | Opaque cursor returned by the previous response |

When `status` is omitted, the backend returns `active` and `disabled` memberships. Removed former
members are excluded from the default list and can be loaded with `status=removed`.

Do not confuse the two status fields:

- `status` filters the person's membership in this company.
- `user_status` filters the person's global account.

### Response

```ts
type AdminCompanyMemberListResponse = {
  company_id: string;
  items: AdminCompanyMember[];
  next_cursor: string | null;
};

type AdminCompanyMember = {
  membership_id: string;
  user_id: string;
  full_name: string;
  email: string;
  user_status: "pending_verification" | "active" | "disabled";
  email_verified: boolean;
  role: "company_admin" | "company_seat_user";
  membership_status: "active" | "disabled" | "removed";
  occupies_seat: boolean;
  activated_at: string;
  disabled_at: string | null;
  disabled_by_user_id: string | null;
  removed_at: string | null;
  removed_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};
```

The endpoint returns `404 not_found` when the company does not exist, including when it has no
members. An existing company with no matching members returns `200` with an empty `items` array.

## User list and detail

Existing endpoints:

```http
GET /api/v1/admin/users
GET /api/v1/admin/users/{user_id}
```

`AdminUserResponse` now includes disable metadata:

```ts
type AdminUserResponse = {
  id: string;
  email: string;
  full_name: string;
  institution_name: string | null;
  status: "pending_verification" | "active" | "disabled";
  email_verified: boolean;
  global_role: "super_admin" | null;
  last_login_at: string | null;
  disabled_at: string | null;
  disabled_by_user_id: string | null;
  created_at: string;
  access: {
    context_type: "personal" | "company" | "global";
    effective_role:
      | "standard_user"
      | "company_admin"
      | "company_seat_user"
      | "super_admin";
    company_id: string | null;
    company_name: string | null;
    membership_id: string | null;
    membership_status: "active" | "disabled" | "removed" | null;
  };
  access_subscription: {
    id: string;
    plan_type: "standard" | "enterprise" | "custom";
    status:
      | "trialing"
      | "active"
      | "past_due"
      | "cancelled"
      | "expired"
      | "suspended"
      | "inactive";
  } | null;
};
```

## Disable a user

```http
POST /api/v1/admin/users/{user_id}/disable
Authorization: Bearer <access-token>
```

- No request body.
- Returns the updated `AdminUserResponse` with `status="disabled"`.
- Repeating the request for an already-disabled user is safe and returns `200`.
- Active sessions and pending password-reset tokens are revoked immediately.
- Super Admin accounts cannot be disabled through this endpoint.

After success, replace the cached user with the returned object and invalidate any user and company
member lists containing that user.

## Enable a user

```http
POST /api/v1/admin/users/{user_id}/enable
Authorization: Bearer <access-token>
```

- No request body.
- Returns the updated `AdminUserResponse` with `status="active"`.
- Repeating the request for an already-active user is safe and returns `200`.
- Only verified accounts can be enabled.

After success, replace the cached user with the returned object and invalidate any user and company
member lists containing that user.

## Error handling

Errors use the existing envelope:

```ts
type ApiError = {
  code: string;
  message: string;
  details: unknown | null;
  request_id: string | null;
};
```

Relevant errors:

| HTTP | Code | Frontend handling |
| --- | --- | --- |
| `401` | `invalid_session` | Use the existing authentication-expired flow |
| `403` | `permission_denied` | Hide/disable the operation and show the standard forbidden state |
| `404` | `not_found` | Remove stale rows or show that the user/company no longer exists |
| `409` | `protected_super_admin` | Explain that Super Admin accounts are protected |
| `409` | `invalid_user_status_transition` | Refresh the user because its status cannot make this transition |
| `409` | `user_email_not_verified` | Explain that the account must be verified before enabling |
| `409` | `user_status_conflict` | Refresh the user and allow the operator to retry |
| `400` | `invalid_cursor` | Clear pagination state and reload the first page |
| `422` | `validation_error` | Treat the submitted filter as invalid |

Always surface or log `request_id` through the frontend's existing support/debug path.

## Suggested UI flow

1. Load `GET /admin/companies` for the company-management table.
2. Open a selected company with `GET /admin/companies/{company_id}`.
3. Load its people table from `GET /admin/companies/{company_id}/members`.
4. Use the returned `user_id` to open `GET /admin/users/{user_id}` if full user detail is needed.
5. For an active non-Super-Admin user, show the warning and call the disable endpoint after explicit
   confirmation.
6. For a disabled verified user, offer the enable endpoint.
7. Keep membership-management actions visually separate: account disablement does not disable or
   remove the company membership.
