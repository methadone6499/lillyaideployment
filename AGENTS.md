<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Project Rules

## Stack
- TypeScript strict mode
- Tailwind for styling
- Zustand for feature/global state
- Zod for runtime validation on all external data
- React Query for client-side data fetching — no useEffect for data fetching

## Architecture
- Follow frontend-architecture.md for all placement decisions
- Server Components by default — use 'use client' only when necessary
- Never import a feature's internal files — use its index.ts only
- Business logic stays inside features/

## Do Not
- Do not install new dependencies without being asked
- Do not refactor code outside the scope of the task
- Do not change folder structure without being asked
- Do not use useEffect for data fetching