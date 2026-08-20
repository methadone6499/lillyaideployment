import assert from "node:assert/strict";

import {
  createInvitationRequestSchema,
  invitationAcceptanceSchema,
  invitationListResponseSchema,
  invitationPreviewSchema,
  invitationSchema,
  invitationTokenRequestSchema,
  registerInvitationRequestSchema,
} from "../schemas/companyInvitationSchemas";
import { parseInvitationTokenFromHash } from "../utils/invitationToken";

function buildInvitation(overrides: Record<string, unknown> = {}) {
  return {
    id: "invitation-1",
    company_id: "company-1",
    email: "invitee@example.com",
    role: "company_seat_user",
    status: "pending",
    invited_by_user_id: "admin-1",
    expires_at: "2026-08-08T00:00:00.000Z",
    last_sent_at: "2026-08-01T00:00:00.000Z",
    accepted_by_user_id: null,
    accepted_at: null,
    revoked_by_user_id: null,
    revoked_at: null,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

const trimmedRequest = createInvitationRequestSchema.parse({
  email: "  Ada@Example.com  ",
});

assert.equal(trimmedRequest.email, "ada@example.com");

assert.equal(
  createInvitationRequestSchema.safeParse({ email: "not-an-email" }).success,
  false,
);

assert.equal(
  createInvitationRequestSchema.safeParse({
    email: "ada@example.com",
    role: "company_admin",
  }).success,
  false,
);

const pendingInvitation = invitationSchema.parse(buildInvitation());

assert.equal(pendingInvitation.status, "pending");
assert.equal(pendingInvitation.role, "company_seat_user");
assert.equal(pendingInvitation.accepted_by_user_id, null);
assert.equal(pendingInvitation.accepted_at, null);
assert.equal(pendingInvitation.revoked_by_user_id, null);
assert.equal(pendingInvitation.revoked_at, null);

assert.equal(
  invitationSchema.safeParse({
    ...buildInvitation(),
    extra_field: "ignored",
  }).success,
  true,
);

assert.equal(
  invitationSchema.safeParse({
    ...buildInvitation(),
    accepted_at: "2026-08-02T12:00:00+00:00",
    accepted_by_user_id: "user-2",
    status: "accepted",
  }).success,
  true,
);

assert.equal(
  invitationSchema.safeParse({
    ...buildInvitation(),
    status: "revoked",
    revoked_at: "2026-08-02T12:00:00Z",
    revoked_by_user_id: "admin-1",
  }).success,
  true,
);

assert.equal(
  invitationSchema.safeParse({
    ...buildInvitation(),
    expires_at: "2026-08-08",
  }).success,
  false,
);

assert.equal(
  invitationSchema.safeParse({
    ...buildInvitation(),
    role: "super_admin",
  }).success,
  false,
);

const omittedTerminalFields = invitationSchema.parse({
  id: "invitation-2",
  company_id: "company-1",
  email: "new@example.com",
  role: "company_seat_user",
  status: "pending",
  invited_by_user_id: "admin-1",
  expires_at: "2026-08-08T00:00:00.000Z",
  last_sent_at: "2026-08-01T00:00:00.000Z",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
});

assert.equal(omittedTerminalFields.accepted_at, undefined);
assert.equal(omittedTerminalFields.revoked_at, undefined);

const listWithNullCursor = invitationListResponseSchema.parse({
  items: [buildInvitation()],
  next_cursor: null,
});

assert.equal(listWithNullCursor.next_cursor, null);
assert.equal(listWithNullCursor.items.length, 1);

const listWithOmittedCursor = invitationListResponseSchema.parse({
  items: [],
});

assert.equal(listWithOmittedCursor.next_cursor, undefined);
assert.equal(listWithOmittedCursor.items.length, 0);

assert.equal(
  invitationListResponseSchema.parse({
    items: [buildInvitation()],
    next_cursor: "cursor-2",
  }).next_cursor,
  "cursor-2",
);

const loginPreview = invitationPreviewSchema.parse({
  company_name: "Example Pharma",
  email_masked: "a***@example.com",
  expires_at: "2026-08-08T00:00:00.000Z",
  acceptance_mode: "login",
});

assert.equal(loginPreview.acceptance_mode, "login");
assert.equal(loginPreview.email_masked, "a***@example.com");

const createAccountPreview = invitationPreviewSchema.parse({
  company_name: "Example Pharma",
  email_masked: "n***@example.com",
  expires_at: "2026-08-08T00:00:00+00:00",
  acceptance_mode: "create_account",
});

assert.equal(createAccountPreview.acceptance_mode, "create_account");

assert.equal(
  invitationPreviewSchema.safeParse({
    company_name: "Example Pharma",
    email_masked: "a***@example.com",
    expires_at: "2026-08-08T00:00:00.000Z",
    acceptance_mode: "admin",
  }).success,
  false,
);

assert.equal(
  invitationPreviewSchema.safeParse({
    ...loginPreview,
    extra_field: "ignored",
  }).success,
  true,
);

const acceptance = invitationAcceptanceSchema.parse({
  invitation_id: "invitation-1",
  company_id: "company-1",
  membership_id: "membership-1",
  user_id: "user-2",
  message: "Invitation accepted.",
});

assert.equal(acceptance.membership_id, "membership-1");

assert.equal(
  invitationTokenRequestSchema.safeParse({ token: "abc" }).success,
  true,
);

assert.equal(invitationTokenRequestSchema.safeParse({ token: "" }).success, false);

assert.equal(
  invitationTokenRequestSchema.safeParse({ token: "a".repeat(513) }).success,
  false,
);

assert.equal(
  invitationTokenRequestSchema.safeParse({
    token: "abc",
    extra: true,
  }).success,
  false,
);

assert.equal(
  registerInvitationRequestSchema.parse({
    token: "invite-token",
    full_name: "  Ada Lovelace  ",
    password: "a".repeat(12),
  }).full_name,
  "Ada Lovelace",
);

assert.equal(
  registerInvitationRequestSchema.safeParse({
    token: "invite-token",
    full_name: "Ada Lovelace",
    password: "short",
  }).success,
  false,
);

assert.equal(
  registerInvitationRequestSchema.safeParse({
    token: "invite-token",
    full_name: "Ada Lovelace",
    password: "a".repeat(12),
    email: "ada@example.com",
  }).success,
  false,
);

assert.equal(parseInvitationTokenFromHash("#token=invite-secret"), "invite-secret");
assert.equal(
  parseInvitationTokenFromHash("#token=invite%2Bsecret"),
  "invite+secret",
);
assert.equal(parseInvitationTokenFromHash("#other=value"), null);
assert.equal(parseInvitationTokenFromHash("#token="), null);
assert.equal(parseInvitationTokenFromHash(""), null);
assert.equal(parseInvitationTokenFromHash(`#token=${"a".repeat(513)}`), null);
assert.equal(
  parseInvitationTokenFromHash("#token=abc&unused=1"),
  "abc",
);
