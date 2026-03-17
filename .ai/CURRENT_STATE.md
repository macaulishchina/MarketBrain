# MarketBrain Current State

> Last updated: 2026-03-17

---

## 1. Phase

- Repo phase: Foundation / Phase 0
- Status: workspace scaffold exists, product features are largely ahead of code
- AI governance: established (`.ai/` directory)

---

## 2. Existing Structure

Current apps:

- `apps/web`
- `apps/worker`

Current packages:

- `packages/ai`
- `packages/config`
- `packages/db`
- `packages/domain`
- `packages/observability`
- `packages/ui`

Current infra signals:

- Node.js 18+
- `pnpm` workspace + `turbo`
- Next.js 15 + React 19
- Prisma + PostgreSQL
- Trigger.dev worker
- Zod-based env validation

---

## 3. Stable Surfaces To Treat Carefully

These are not full public product contracts yet, but they are useful repo
anchors and should not drift casually:

- workspace package names under `@marketbrain/*`
- root scripts in `package.json`
- root monorepo layout (`apps/` + `packages/`)
- `packages/config/src/env.ts` as the env contract boundary
- `packages/db/prisma/schema.prisma` as the data-model source of truth

---

## 4. Known Gaps

- `specs/` exists but is still placeholder-level
- No repo-level `tests/` directory yet
- `packages/ai` does not yet contain the target prompt/schema/evaluator
  structure from `StartFromHere.md`
- `packages/domain` and `packages/db` are still early and likely to expand
- No documented automated eval workflow yet

---

## 5. Practical Verification Commands

Useful current commands:

```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm format:check
```

Use package-level scripts when only one workspace needs checking.
