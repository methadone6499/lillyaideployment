import assert from "node:assert/strict";

import {
  seatListResponseSchema,
  seatSchema,
  seatSummarySchema,
} from "../schemas/seatManagementSchemas";

function buildSeat(overrides: Record<string, unknown> = {}) {
  return {
    membership_id: "membership-1",
    user_id: "user-1",
    full_name: "Ada Lovelace",
    email: "ada@example.com",
    role: "company_admin",
    status: "active",
    occupies_seat: true,
    invited_by_user_id: null,
    activated_at: "2026-08-01T00:00:00.000Z",
    disabled_at: null,
    disabled_by_user_id: null,
    removed_at: null,
    removed_by_user_id: null,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    can_manage: false,
    report_quota_total: 0,
    report_quota_used: 0,
    report_quota_remaining: 0,
    can_manage_status: false,
    can_manage_quota: false,
    ...overrides,
  };
}

function buildSummary(overrides: Record<string, unknown> = {}) {
  return {
    total_seats: 5,
    occupied_membership_seats: 1,
    pending_invitation_seats: 0,
    occupied_seats: 1,
    available_seats: 4,
    active_seats: 1,
    disabled_seats: 0,
    subscription_status: "active",
    ...overrides,
  };
}

const zeroQuotaSeat = seatSchema.parse(buildSeat());

assert.equal(zeroQuotaSeat.report_quota_total, 0);
assert.equal(zeroQuotaSeat.report_quota_used, 0);
assert.equal(zeroQuotaSeat.report_quota_remaining, 0);
assert.equal(zeroQuotaSeat.invited_by_user_id, null);
assert.equal(zeroQuotaSeat.disabled_at, null);

assert.equal(
  seatSchema.safeParse({
    ...buildSeat(),
    extra_field: "ignored",
  }).success,
  true,
);

assert.equal(
  seatSchema.safeParse({
    ...buildSeat(),
    membership_id: undefined,
  }).success,
  false,
);

assert.equal(
  seatSchema.safeParse({
    ...buildSeat(),
    email: "not-an-email",
  }).success,
  false,
);

assert.equal(
  seatSchema.safeParse({
    ...buildSeat(),
    status: "removed",
    occupies_seat: false,
    removed_at: "2026-08-02T12:00:00+00:00",
    removed_by_user_id: "user-2",
  }).success,
  true,
);

assert.equal(
  seatSchema.safeParse({
    ...buildSeat(),
    activated_at: "2026-08-01",
  }).success,
  false,
);

const summary = seatSummarySchema.parse(buildSummary());

assert.equal(summary.total_seats, 5);
assert.equal(summary.available_seats, 4);
assert.equal(summary.pending_invitation_seats, 0);

const listWithNullCursor = seatListResponseSchema.parse({
  summary: buildSummary(),
  items: [buildSeat()],
  next_cursor: null,
});

assert.equal(listWithNullCursor.next_cursor, null);
assert.equal(listWithNullCursor.items.length, 1);

const listWithOmittedCursor = seatListResponseSchema.parse({
  summary: buildSummary({ pending_invitation_seats: 2, available_seats: 2 }),
  items: [],
});

assert.equal(listWithOmittedCursor.next_cursor, undefined);
assert.equal(listWithOmittedCursor.items.length, 0);
assert.equal(listWithOmittedCursor.summary.pending_invitation_seats, 2);

assert.equal(
  seatListResponseSchema.safeParse({
    items: [buildSeat()],
    next_cursor: null,
  }).success,
  false,
);

assert.equal(
  seatListResponseSchema.parse({
    summary: buildSummary(),
    items: [buildSeat()],
    next_cursor: "cursor-2",
  }).next_cursor,
  "cursor-2",
);
