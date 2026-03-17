# Execution Plan

> Integrate existing Phase 0 codebase with the `.ai/` governance framework.

## Goal

- Bring all existing code into compliance with `.ai/CONSTITUTION.md` and
  `.ai/CONVENTIONS.md` rules.

## Why Now

- The `.ai/` governance framework has been established and defines forbidden
  patterns, coding standards, and architectural invariants.
- Existing Phase 0 code pre-dates these rules and contains several violations
  that should be fixed before feature work begins.

## Constraints

- Keep changes minimal and behavior-preserving.
- Do not add features beyond what is needed for compliance.
- Keep existing tests passing.

## Non-Goals

- Implement new product features.
- Reorganize monorepo structure.
- Add new packages or apps.

## Affected Areas

- `packages/config/src/env.ts` — add missing env vars, lazy init, remove
  console.error
- `packages/db/src/client.ts` — use config instead of raw process.env
- `packages/db/package.json` — add @marketbrain/config dependency
- `packages/observability/src/logger.ts` — use config
- `packages/observability/src/tracing.ts` — use config, remove TODO comment
- `packages/observability/package.json` — add @marketbrain/config dependency
- `packages/ai/src/{evaluators,prompts,tools}/` — replace .gitkeep.ts with
  .gitkeep
- `specs/{product,architecture}/` — replace .gitkeep.md with .gitkeep
- `packages/ui/src/index.ts` — remove placeholder comment
- `.ai/CURRENT_STATE.md` — fix Node.js version (18+, not 20+)

## Risks

- Lazy env init defers validation from import-time to first-access-time.
  Acceptable for Phase 0 — errors still surface at startup.
- Adding @marketbrain/config as dependency to db and observability adds a
  coupling that is architecturally correct (config is a primitive package).

## Steps

1. Update PLANS.md for this integration task.
2. Fix packages/config/src/env.ts — add LOG_LEVEL, OTEL_ENABLED, lazy init.
3. Fix packages/db — add config dep, replace process.env with env.
4. Fix packages/observability — add config dep, replace process.env, remove
   TODO.
5. Replace .gitkeep.ts/.gitkeep.md with plain .gitkeep.
6. Clean packages/ui/src/index.ts.
7. Fix .ai/CURRENT_STATE.md Node.js version.
8. Run pnpm install, typecheck, test, build.

## Verification

- `pnpm install` succeeds
- `pnpm turbo typecheck` — all pass
- `pnpm turbo test` — all pass
- `pnpm turbo build` — all pass

## Progress Log

- `done` — Audit all source files against governance rules.
- `done` — Execute compliance fixes.
- `done` — Run verification (typecheck 8/8, test 8/8, build 2/2).

## Decisions

- Use lazy Proxy pattern in env.ts to avoid chicken-and-egg between config
  validation and packages that need NODE_ENV before DATABASE_URL is available.
- Keep console.error removal simple — throw with descriptive message instead.
- Replace .gitkeep.ts with plain .gitkeep (not barrel exports) since these
  directories have no real exports yet.
