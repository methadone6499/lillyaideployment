import assert from "node:assert/strict";
import { topUpCheckoutRequestSchema, topUpCheckoutSchema, topUpOverviewSchema } from "../schemas/topUpSchemas";
import { formatAmountMinor } from "../utils/formatBilling";
import { canAllocateTopUps, getMaximumTopUpTarget, getTopUpCheckoutUrl, isTopUpOrderPending, parseTopUpInput, TOP_UP_STATUS_COPY } from "../utils/topUpPolicy";
import { selectReportQuotaAvailability } from "../utils/selectReportQuotaAvailability";

for (const quantity of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
  assert.equal(topUpCheckoutRequestSchema.safeParse({ quantity }).success, false);
}
assert.equal(topUpCheckoutRequestSchema.safeParse({ quantity: 4, price: 9500 }).success, false);
assert.equal(parseTopUpInput("1.5", 1, 100), null);
assert.equal(parseTopUpInput("2e2", 1, 1000), null);
assert.equal(parseTopUpInput("101", 1, 100), null);
assert.equal(parseTopUpInput("0", 0, 10), 0);
assert.equal(getMaximumTopUpTarget(3, 10, true), 13);
assert.equal(getMaximumTopUpTarget(3, 10, false), 3);
assert.equal(formatAmountMinor(9500, "usd"), "$95.00");
assert.equal(formatAmountMinor(9500, "jpy"), "¥9,500");
assert.match(formatAmountMinor(9500, "kwd"), /9\.500/);

const overview = topUpOverviewSchema.parse({
  scope_type: "company", pool_balance: 10, assigned_balance: 3, usable_balance: 0,
  can_purchase: true, can_manage_allocations: true, unit_amount_minor: 9500, currency: "usd", max_purchase_quantity: 100,
  requires_paid_subscription: true, credits_expire: false, personal_credits_forfeited_on_company_upgrade: true, allocations: [],
});
const { credits_expire: omittedPolicy, ...withoutPolicy } = overview;
assert.equal(omittedPolicy, false);
assert.equal(topUpOverviewSchema.safeParse(withoutPolicy).success, false);
assert.equal(canAllocateTopUps(overview, undefined), false);

const order = topUpCheckoutSchema.parse({ order_id: "opaque-order", status: "open", scope_type: "company", quantity: 2,
  unit_amount_minor: 9500, total_amount_minor: 19000, currency: "usd", stripe_checkout_session_id: null,
  checkout_url: "https://checkout.stripe.com/example", expires_at: "2099-01-01T00:00:00Z" });
assert.equal(getTopUpCheckoutUrl(order, 0), order.checkout_url);
assert.equal(getTopUpCheckoutUrl({ ...order, checkout_url: "http://checkout.stripe.com/example" }, 0), null);
assert.equal(getTopUpCheckoutUrl({ ...order, status: "completed" }, 0), null);
assert.equal(getTopUpCheckoutUrl(order, Date.parse("2100-01-01T00:00:00Z")), null);
for (const status of Object.keys(TOP_UP_STATUS_COPY)) assert.ok(TOP_UP_STATUS_COPY[status as keyof typeof TOP_UP_STATUS_COPY]);
assert.equal(isTopUpOrderPending("creating"), true);
assert.equal(isTopUpOrderPending("payment_pending"), true);
assert.equal(isTopUpOrderPending("completed"), false);

const base = { unlimited: false, entitled: true, blocked: false, monthlyRemaining: 0, purchasedRemaining: 5, pending: false };
assert.equal(selectReportQuotaAvailability(base).canGenerate, true);
assert.equal(selectReportQuotaAvailability({ ...base, monthlyRemaining: undefined }).canGenerate, true);
assert.equal(selectReportQuotaAvailability({ ...base, blocked: true }).canGenerate, false);
assert.equal(selectReportQuotaAvailability({ ...base, entitled: false }).canGenerate, false);
assert.equal(selectReportQuotaAvailability({ ...base, purchasedRemaining: 0 }).exhausted, true);
assert.equal(selectReportQuotaAvailability({ ...base, purchasedRemaining: undefined }).unavailable, true);
assert.equal(selectReportQuotaAvailability({ ...base, purchasedRemaining: undefined, pending: true }).checking, true);
assert.equal(selectReportQuotaAvailability({ ...base, monthlyRemaining: 1, purchasedRemaining: undefined }).canGenerate, true);
assert.equal(selectReportQuotaAvailability({ ...base, unlimited: true, entitled: false, purchasedRemaining: undefined }).canGenerate, true);
