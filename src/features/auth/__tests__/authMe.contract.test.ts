import assert from "node:assert/strict";

import {
  authMeResponseSchema,
  type AuthMeResponse,
  type Permission,
} from "../schemas/authSchemas";
import {
  getActiveContext,
  getPostAuthHomePath,
  hasPermission,
} from "../utils/authAccess";

const STANDARD_USER_PERMISSIONS = [
  "account:read",
  "account:update",
  "report:create",
  "report:read_own",
  "settings:read",
  "settings:update",
  "notification:read",
] as const satisfies readonly Permission[];

const COMPANY_ADMIN_PERMISSIONS = [
  ...STANDARD_USER_PERMISSIONS,
  "company:read",
  "company:billing_read",
  "company:members_read",
  "company:members_manage",
  "company:quota_read",
  "company:quota_manage",
  "report:read_company",
] as const satisfies readonly Permission[];

const COMPANY_SEAT_PERMISSIONS = [
  ...STANDARD_USER_PERMISSIONS,
  "company:quota_read_own",
] as const satisfies readonly Permission[];

const SUPER_ADMIN_PERMISSIONS = [
  ...STANDARD_USER_PERMISSIONS,
  "admin:companies_read",
  "admin:reports_read",
  "admin:users_read",
] as const satisfies readonly Permission[];

function buildUser() {
  return {
    id: "user-1",
    email: "user@example.com",
    full_name: "Test User",
    institution_name: null,
    status: "active" as const,
    email_verified: true,
    email_verified_at: "2026-01-01T00:00:00.000Z",
    global_role: null,
    last_login_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function parseAuthMe(value: unknown): AuthMeResponse {
  return authMeResponseSchema.parse(value);
}

const personalMe = parseAuthMe({
  user: buildUser(),
  active_context: {
    type: "personal",
    role: "standard_user",
    company_id: null,
    membership_id: null,
  },
  available_contexts: [
    {
      type: "personal",
      role: "standard_user",
      company_id: null,
      membership_id: null,
    },
  ],
  permissions: [...STANDARD_USER_PERMISSIONS],
  entitlement_summary: null,
  quota_summary: null,
});

const personalMeOmittedContextIds = parseAuthMe({
  user: buildUser(),
  active_context: {
    type: "personal",
    role: "standard_user",
  },
  available_contexts: [
    {
      type: "personal",
      role: "standard_user",
    },
  ],
  permissions: [...STANDARD_USER_PERMISSIONS],
});

const companyAdminMe = parseAuthMe({
  user: buildUser(),
  active_context: {
    type: "company",
    role: "company_admin",
    company_id: "company-1",
    membership_id: "membership-1",
  },
  available_contexts: [
    {
      type: "company",
      role: "company_admin",
      company_id: "company-1",
      membership_id: "membership-1",
    },
  ],
  permissions: [...COMPANY_ADMIN_PERMISSIONS],
  entitlement_summary: { plan: "enterprise" },
  quota_summary: { quota_total: 30, quota_used: 2 },
});

const companySeatMe = parseAuthMe({
  user: buildUser(),
  active_context: {
    type: "company",
    role: "company_seat_user",
    company_id: "company-1",
    membership_id: "membership-2",
  },
  available_contexts: [
    {
      type: "company",
      role: "company_seat_user",
      company_id: "company-1",
      membership_id: "membership-2",
    },
  ],
  permissions: [...COMPANY_SEAT_PERMISSIONS],
  entitlement_summary: null,
  quota_summary: {
    quota_total: 0,
    quota_used: 0,
    quota_remaining: 0,
  },
});

const superAdminMe = parseAuthMe({
  user: {
    ...buildUser(),
    global_role: "super_admin",
  },
  active_context: {
    type: "global",
    role: "super_admin",
    company_id: null,
    membership_id: null,
  },
  available_contexts: [
    {
      type: "global",
      role: "super_admin",
      company_id: null,
      membership_id: null,
    },
  ],
  permissions: [...SUPER_ADMIN_PERMISSIONS],
  entitlement_summary: null,
  quota_summary: null,
});

assert.equal(personalMe.active_context.company_id, null);
assert.equal(personalMe.active_context.membership_id, null);
assert.equal(personalMe.quota_summary, null);
assert.equal(personalMe.entitlement_summary, null);

assert.equal(personalMeOmittedContextIds.active_context.company_id, undefined);
assert.equal(personalMeOmittedContextIds.active_context.membership_id, undefined);

assert.equal(companyAdminMe.active_context.company_id, "company-1");
assert.equal(companyAdminMe.active_context.membership_id, "membership-1");

assert.deepEqual(companySeatMe.quota_summary, {
  quota_total: 0,
  quota_used: 0,
  quota_remaining: 0,
});

assert.equal(getActiveContext(undefined), null);
assert.equal(getActiveContext(personalMe)?.type, "personal");
assert.equal(getActiveContext(companyAdminMe)?.role, "company_admin");

assert.equal(getPostAuthHomePath(undefined), "/dashboard");
assert.equal(getPostAuthHomePath(personalMe), "/dashboard");
assert.equal(getPostAuthHomePath(companySeatMe), "/dashboard");
assert.equal(getPostAuthHomePath(superAdminMe), "/super-admin/dashboard");
assert.equal(getPostAuthHomePath(companyAdminMe), "/company-admin/dashboard");

assert.equal(hasPermission(undefined, "company:members_read"), false);
assert.equal(hasPermission(personalMe, "company:members_read"), false);
assert.equal(hasPermission(companyAdminMe, "company:members_read"), true);
assert.equal(hasPermission(companySeatMe, "company:quota_read_own"), true);
assert.equal(hasPermission(superAdminMe, "admin:reports_read"), true);

assert.equal(
  authMeResponseSchema.safeParse({
    ...personalMe,
    active_context: {
      type: "team",
      role: "standard_user",
    },
  } as unknown).success,
  false,
);

assert.equal(
  authMeResponseSchema.safeParse({
    ...personalMe,
    permissions: ["company:members_read", "not:a_permission"],
  } as unknown).success,
  false,
);
