This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Report top-ups

Report purchases use the deployed top-up API directly. The `can_purchase` value from
`GET /api/v1/top-ups/me` controls purchase availability; no frontend environment variable is needed.
Eligible personal billing owners and company admins can purchase reports. Company seat users
receive reports through company allocations. Pending-payment recovery remains available independently
of eligibility to start a new purchase.

Purchases and balances are in the Report quota card on the main and company-admin dashboards.
The company-admin card shows company-wide monthly usage and remaining purchased reports separately.
Company assignments are in
`/company-admin/seats#purchased-report-allocations`. Billing shows a payment-status and recovery
notice only for an unfinished checkout; it has no purchased-reports balance or purchase panel.

The shared `/billing/success` route recognizes a top-up return using the purchaser's saved intent.
The cancel URL may return to `/settings/billing`, where the pending order can be continued or checked.
Recovery requires the original tab's session storage on the same frontend origin; localhost and a
deployed domain do not share it. For local checkout tests, the backend's configured success/cancel
URLs must return to that localhost origin. The API has no order-list or Stripe-session lookup endpoint.
Dashboard payment prompts recheck the saved order on mount and briefly poll for confirmation, with
a fresh check when the window regains focus or reconnects. Completion is determined from the order's
confirmed status; a positive report balance alone does not establish which purchase completed.
Returning from Checkout does not cancel an open top-up payment.

Sanitized feature events are dispatched as `formulary:report-top-up` browser events for a telemetry
collector to consume. They contain event names, scope, quantities, order/membership IDs and statuses,
never tokens, checkout URLs or payment details.

Release QA must separately verify immediate/delayed Stripe test payments, cancellation/expiry,
webhook delays/replay, concurrent allocation and report use, subscription transitions, and session
isolation. Browser tests, development servers and full builds are outside the targeted verification budget.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
