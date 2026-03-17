# Execution Plan — Phase 1: Basic Business Skeleton

> Build the non-AI business foundation: auth, core data models, app shell, API routes.

## Goal

- Auth.js (NextAuth v5) integration with credential + OAuth providers
- Full Prisma schema per StartFromHere.md §6 (all v1 entities)
- Domain Zod schemas aligned with Prisma models
- App shell layout (sidebar + mobile nav)
- Base UI components (Button, Card, Input, Badge, Dialog)
- Filled page skeletons with real layouts
- BFF API routes for auth, instruments, watchlists

## Why Now

- Phase 0 scaffold is committed and verified.
- Phase 1 establishes the "non-AI" foundation that all subsequent phases depend on.

## Constraints

- Schema-first: define Zod schemas and Prisma models before implementation.
- No AI/model calls in this phase.
- All env vars through `@marketbrain/config`.
- No `process.env` outside config package.
- No business logic in UI — keep in `packages/domain`.
- Keep route handlers thin.
- Type annotations on all exported functions.

## Non-Goals

- AI model gateway implementation (Phase 2).
- Real-time alerts / WebSocket (Phase 4+).
- E2E tests (Phase 3+).

## Affected Areas

- `packages/db/prisma/schema.prisma` — expand to all v1 entities
- `packages/domain/src/` — new Zod schemas + enums for all entities
- `packages/config/src/env.ts` — add AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
- `apps/web/` — Auth.js, app shell layout, API routes, filled pages
- `packages/ui/src/` — base components

## Steps

1. Expand Prisma schema with all v1 entities, run migration.
2. Add domain Zod schemas + new enums aligned with Prisma models.
3. Integrate Auth.js with credentials provider + session middleware.
4. Build base UI components in packages/ui.
5. Build app shell layout (sidebar nav, mobile bottom nav).
6. Fill page skeletons, add API routes.
7. Run full verification.

## Verification

- `pnpm install` succeeds
- `pnpm turbo typecheck` — all pass
- `pnpm turbo test` — all pass
- `pnpm turbo build` — all pass
- Auth flow works (login/logout)
- DB migration applies cleanly

## Progress Log

- `done` — Step 1: Prisma schema expansion (25 models, 25 tables)
- `done` — Step 2: Domain schemas (19 Zod schemas, 10+ enums, 11 tests)
- `done` — Step 3: Auth.js integration (Credentials + Google, middleware, session helpers)
- `done` — Step 4: UI components (Button, Card, Input, Badge, Dialog, Sidebar)
- `done` — Step 5: App shell layout (desktop sidebar + mobile bottom nav)
- `done` — Step 6: Pages + API routes (12 pages, 3 API routes, seed script)
- `done` — Step 7: Verification (typecheck ✅, test ✅, build ✅, seed ✅)

## Decisions

- Use Auth.js v5 (next-auth@5) with Prisma adapter for session persistence.
- Credentials provider for dev, Google OAuth as first external provider.
- Keep auth config server-side only per web.md rules.
