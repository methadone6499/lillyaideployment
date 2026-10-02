import assert from "node:assert/strict";

import {
  adminUserListResponseSchema,
  adminUserResponseSchema,
} from "../schemas/adminUserSchemas";
import {
  canDisableAdminUser,
  canEnableAdminUser,
  classifyAdminManagementError,
} from "../utils/adminManagement";
import { ApiRequestError } from "../../../services/ApiRequestError";

function buildAccess(overrides: Record<string, unknown> = {}) {
  return {
    context_type: "company",
    effective_role: "company_admin",
    company_id: "company-1",
    company_name: "LillyAI Labs",
    membership_id: "membership-1",
    membership_status: "active",
    ...overrides,
  };
}

function buildAdminUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "ada@example.com",
    full_name: "Ada Lovelace",
    institution_name: "Analytical Engines",
    status: "active",
    email_verified: true,
    global_role: null,
    last_login_at: "2026-08-02T12:00:00.000Z",
    disabled_at: null,
    disabled_by_user_id: null,
    created_at: "2026-08-01T00:00:00.000Z",
    access: buildAccess(),
    access_subscription: {
      id: "subscription-1",
      plan_type: "enterprise",
      status: "active",
    },
    ...overrides,
  };
}

const companyAdminUser = adminUserResponseSchema.parse(buildAdminUser());

assert.equal(companyAdminUser.full_name, "Ada Lovelace");
assert.equal(companyAdminUser.email, "ada@example.com");
assert.equal(companyAdminUser.status, "active");
assert.equal(companyAdminUser.email_verified, true);
assert.equal(companyAdminUser.institution_name, "Analytical Engines");
assert.equal(companyAdminUser.access.company_name, "LillyAI Labs");
assert.equal(companyAdminUser.access.effective_role, "company_admin");
assert.equal(companyAdminUser.access.context_type, "company");
assert.equal(companyAdminUser.global_role, null);
assert.equal(companyAdminUser.disabled_at, null);
assert.equal(companyAdminUser.access_subscription?.plan_type, "enterprise");
assert.equal(canDisableAdminUser(companyAdminUser), true);
assert.equal(canEnableAdminUser(companyAdminUser), false);

const personalUser = adminUserResponseSchema.parse(
  buildAdminUser({
    institution_name: null,
    status: "pending_verification",
    email_verified: false,
    last_login_at: null,
    access_subscription: null,
    access: buildAccess({
      context_type: "personal",
      effective_role: "standard_user",
      company_id: null,
      company_name: null,
      membership_id: null,
      membership_status: null,
    }),
  }),
);

assert.equal(personalUser.institution_name, null);
assert.equal(personalUser.access.company_name, null);
assert.equal(personalUser.access.company_id, null);
assert.equal(personalUser.access.effective_role, "standard_user");
assert.equal(personalUser.access.context_type, "personal");
assert.equal(personalUser.status, "pending_verification");
assert.equal(personalUser.last_login_at, null);
assert.equal(personalUser.access_subscription, null);

const omittedCompanyAndInstitution = adminUserResponseSchema.parse(
  buildAdminUser({
    institution_name: undefined,
    access: buildAccess({
      company_id: undefined,
      company_name: undefined,
      membership_id: undefined,
      membership_status: undefined,
    }),
  }),
);

assert.equal(omittedCompanyAndInstitution.institution_name, undefined);
assert.equal(omittedCompanyAndInstitution.access.company_name, undefined);
assert.equal(omittedCompanyAndInstitution.access.membership_status, undefined);

const superAdminUser = adminUserResponseSchema.parse(
  buildAdminUser({
    status: "disabled",
    global_role: "super_admin",
    access: buildAccess({
      context_type: "global",
      effective_role: "super_admin",
      company_id: null,
      company_name: null,
      membership_id: null,
      membership_status: null,
    }),
  }),
);

assert.equal(superAdminUser.status, "disabled");
assert.equal(superAdminUser.global_role, "super_admin");
assert.equal(superAdminUser.access.effective_role, "super_admin");
assert.equal(superAdminUser.access.context_type, "global");
assert.equal(canDisableAdminUser(superAdminUser), false);

const seatUser = adminUserResponseSchema.parse(
  buildAdminUser({
    access: buildAccess({
      effective_role: "company_seat_user",
      membership_status: "disabled",
    }),
  }),
);

assert.equal(seatUser.access.effective_role, "company_seat_user");
assert.equal(seatUser.access.membership_status, "disabled");

const disabledVerifiedUser = adminUserResponseSchema.parse(
  buildAdminUser({
    status: "disabled",
    disabled_at: "2026-08-03T12:00:00.000Z",
    disabled_by_user_id: "super-admin-1",
  }),
);

assert.equal(canEnableAdminUser(disabledVerifiedUser), true);
assert.equal(disabledVerifiedUser.disabled_by_user_id, "super-admin-1");

const disabledUnverifiedUser = adminUserResponseSchema.parse(
  buildAdminUser({
    status: "disabled",
    email_verified: false,
  }),
);

assert.equal(canEnableAdminUser(disabledUnverifiedUser), false);

assert.equal(
  adminUserResponseSchema.safeParse({
    ...buildAdminUser(),
    disabled_at: undefined,
  }).success,
  false,
);

const protectedError = classifyAdminManagementError(
  new ApiRequestError({
    status: 409,
    code: "protected_super_admin",
    message: "Protected",
    requestId: "request-1",
  }),
);

assert.equal(protectedError.kind, "protected_super_admin");
assert.equal(protectedError.requestId, "request-1");

const conflictError = classifyAdminManagementError(
  new ApiRequestError({
    status: 409,
    code: "user_status_conflict",
    message: "Conflict",
  }),
);

assert.equal(conflictError.kind, "status_conflict");
assert.equal(conflictError.refresh, true);

assert.equal(
  classifyAdminManagementError(
    new ApiRequestError({
      status: 409,
      code: "user_email_not_verified",
      message: "Unverified",
    }),
  ).kind,
  "email_not_verified",
);

assert.equal(
  adminUserResponseSchema.safeParse({
    ...buildAdminUser(),
    extra_field: "ignored",
  }).success,
  true,
);

assert.equal(
  adminUserResponseSchema.safeParse({
    ...buildAdminUser(),
    access: undefined,
  }).success,
  false,
);

assert.equal(
  adminUserResponseSchema.safeParse({
    ...buildAdminUser(),
    email: undefined,
  }).success,
  false,
);

assert.equal(
  adminUserResponseSchema.safeParse({
    ...buildAdminUser(),
    status: "pending",
  }).success,
  false,
);

assert.equal(
  adminUserResponseSchema.safeParse({
    ...buildAdminUser(),
    access: buildAccess({
      effective_role: "admin",
    }),
  }).success,
  false,
);

assert.equal(
  adminUserResponseSchema.safeParse({
    ...buildAdminUser(),
    created_at: "2026-08-01",
  }).success,
  false,
);

assert.equal(
  adminUserResponseSchema.safeParse({
    ...buildAdminUser({
      created_at: "2026-08-01T00:00:00Z",
      last_login_at: "2026-08-02T12:00:00+00:00",
    }),
  }).success,
  true,
);

const listWithNullCursor = adminUserListResponseSchema.parse({
  items: [
    buildAdminUser({
      institution_name: null,
      access: buildAccess({
        company_name: null,
        company_id: null,
      }),
    }),
  ],
  next_cursor: null,
});

assert.equal(listWithNullCursor.next_cursor, null);
assert.equal(listWithNullCursor.items.length, 1);
assert.equal(listWithNullCursor.items[0]?.institution_name, null);
assert.equal(listWithNullCursor.items[0]?.access.company_name, null);

const listWithOmittedCursor = adminUserListResponseSchema.parse({
  items: [],
});

assert.equal(listWithOmittedCursor.next_cursor, undefined);
assert.equal(listWithOmittedCursor.items.length, 0);

assert.equal(
  adminUserListResponseSchema.parse({
    items: [buildAdminUser()],
    next_cursor: "cursor-2",
  }).next_cursor,
  "cursor-2",
);
