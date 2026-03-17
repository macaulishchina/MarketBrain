# MarketBrain Repo Map

> Use this file to decide where work belongs before editing.

---

## 1. Current Top-Level Map

```text
MarketBrain/
  apps/
    web/         # Next.js app, pages, handlers, app-shell UX
    worker/      # Trigger.dev tasks and async workflows
  packages/
    ai/          # prompts, AI schemas, tools, evaluators, routing
    config/      # env and feature flags
    db/          # Prisma schema, client, repositories
    domain/      # business contracts, scoring, guardrails
    observability/ # logger, tracing, metrics helpers
    ui/          # shared UI components and tokens
  .ai/           # AI governance, routing, task templates, glossary
  .github/       # CI, CODEOWNERS, PR templates, automation
  AGENTS.md      # entrypoint for coding agents
  PLANS.md       # active plan for large changes
  specs/         # product and architecture specs (currently skeletal)
  StartFromHere.md # product and AI-native implementation brief
```

---

## 2. Where Work Belongs

- Product-facing page composition, route handlers, streaming UI -> `apps/web`
- Scheduled jobs, long-running ingestion, alert fanout, retries -> `apps/worker`
- Prompt assets, tool contracts, router policy, evaluator logic -> `packages/ai`
- Business rules, scoring, state machines, guardrails -> `packages/domain`
- Database schema, repository implementations, seed/dev persistence -> `packages/db`
- Env var parsing, flags, config helpers -> `packages/config`
- Logs, traces, metrics, correlation helpers -> `packages/observability`
- Shared components and design tokens -> `packages/ui`

---

## 3. Package Boundary Rules

- `apps/*` may depend on shared package public APIs.
- `packages/ui` should stay presentation-only.
- `packages/domain` should stay framework-light and deterministic.
- `packages/db` owns Prisma and persistence translation.
- `packages/ai` owns model-specific behavior and AI assets.
- `packages/config` is the only home for raw `process.env` validation.

---

## 4. Planned Expansion

These areas are directionally planned from `StartFromHere.md`, but not fully
built yet:

- `packages/ai/src/prompts/briefing`, `alerts`, `research`, `extraction`
- `packages/ai/src/schemas/`, `tools/`, `router/`, `evaluators/`
- `packages/domain/src/entities/`, `services/`, `scoring/`, `guardrails/`
- `apps/worker/src/tasks/`, `workflows/`, `connectors/`, `schedulers/`,
  `notifications/`
- richer `specs/` content and broader test suites

Treat them as intended destinations, not present-day facts.

---

## 5. Quick Decision Table

- "Where should a Zod schema for AI output live?" -> `packages/ai`, unless it
  is a core business contract shared broadly, then `packages/domain`
- "Where should alert scoring rules live?" -> `packages/domain`
- "Where should a Prisma-backed repository live?" -> `packages/db`
- "Where should a reusable briefing card component live?" -> `packages/ui`
- "Where should a page-level search experience live?" -> `apps/web`
- "Where should a pre-market briefing cron task live?" -> `apps/worker`
