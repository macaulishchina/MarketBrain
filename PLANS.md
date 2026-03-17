# Execution Plan — Phase 7: Production Hardening

> Automated hardening pass: error handling, loading states, security headers, feature flag guards, database indexes, PWA icons.

## Goal

- Wrap all API routes with try/catch + 500 error responses
- Add global-error.tsx, not-found.tsx, (app)-level error.tsx
- Add loading.tsx skeleton for every page (dashboard, alerts, briefings, research, watchlists, settings)
- Add security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Add feature flag guards on alerts and research message API routes
- Add Prisma schema indexes on common query columns (userId, createdAt, status, eventId, etc.)
- Generate PWA placeholder icons (192x192, 512x512)
- Complete manifest.json (categories, maskable icons, start_url = /dashboard)

## Steps

1. [x] API routes: add try/catch + 500 responses (15 routes)
2. [x] Global error + not-found pages
3. [x] Loading skeletons for all pages (8 loading.tsx files)
4. [x] Security headers in next.config.ts
5. [x] Feature flag guards (alerts, research messages)
6. [x] Prisma schema indexes (12 indexes across 7 tables)
7. [x] PWA icons + manifest completion
8. [ ] Tests + typecheck + build + commit

## Verification

- `pnpm turbo typecheck` — all pass
- `pnpm turbo test` — all pass
- `pnpm turbo build` — all pass
