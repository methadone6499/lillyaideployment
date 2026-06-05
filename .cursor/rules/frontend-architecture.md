---
description: "This rule provides architecture for lillyai's frontend"
globs: "src/**"
alwaysApply: false
---

# Frontend Architecture

Next.js App Router — feature-based, route-colocated.

## Structure

```txt
src/
├── app/                          # Routes only
├── components/ui/                # Design-system primitives
├── components/shared/            # App-wide composed components
├── features/<name>/              # api, components, hooks, providers, server, store, schemas, types, utils, index.ts
├── services/                     # Shared networking infrastructure
├── providers/                    # Global providers
├── store/                        # Global state
├── hooks/                        # Global reusable hooks
├── lib/                          # Utilities, config, constants
├── schemas/                      # Cross-feature schemas
└── types/                        # Cross-feature types
```

## Placement

```txt
One route only?          → app/<route>/_*
One feature only?        → features/<feature>/*
Reusable UI primitive?   → components/ui
Reusable app component?  → components/shared
Shared infrastructure?   → services | providers | lib
Cross-feature schema?    → schemas
Cross-feature type?      → types
```

## Rules

- Server Components by default.
- Use `'use client'` only for state, effects, browser APIs, event handlers, Zustand, or client-only libraries.
- Push client boundaries to the leaves.
- Business logic belongs inside features.
- Server-only code belongs in `features/*/server`.
- Never import `server/*` into Client Components.
- Route-specific code never leaves its route.
- Global state only in `store/` (auth, theme, notifications, flags).
- Feature state stays inside the feature.
- Features expose only `index.ts`.
- Import features only through their public API.
- Never import another feature's internal files.
- Services contain networking infrastructure only.
- Barrels only in:
  - `features/*/index.ts`
  - `components/ui/index.ts`
  - `lib/index.ts`
- Keep tests inside `features/*/__tests__/`.

## Feature Creation Policy

- Do NOT scaffold all possible subfolders when creating a new feature.
- Only create folders/files that are immediately required by the implementation.

Allowed behavior:
- Every feature, however minimal, must have an index.ts
- Only create subfolders when you have files to put in them

Examples:

Good:
features/auth/login.ts
features/auth/api.ts
features/auth/components/LoginForm.tsx

Also good (when needed):
features/auth/
├── api/
├── components/
└── hooks/

Bad:
features/auth/
├── api/
├── components/
├── hooks/
├── providers/
├── server/
├── store/
├── schemas/
├── types/
├── utils/

❌ Never generate full "kitchen sink" feature scaffolds by default.
❌ Never pre-create folders "just in case they might be needed later".

## Imports

```ts
✅ import { UserCard } from '@/features/users'

❌ import { UserCard } from '@/features/users/components/UserCard'
```