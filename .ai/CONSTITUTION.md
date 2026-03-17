# MarketBrain Project — AI Constitution

> Version: 0.1.0 | Last updated: 2026-03-17
>
> This file is the single source of truth for AI coding agents working on
> MarketBrain. Read it before making code changes.

---

## 0. How To Use This File

1. Read this file before editing code.
2. Use the routing table in section 6 to load the rule file for the directory
   you are modifying.
3. Use the checklist in section 7 that matches your change type.
4. For large or multi-step work, create or update `PLANS.md` from
   `.ai/templates/PLANS.md` before editing.
5. If a repo rule conflicts with a direct user instruction, follow the user but
   call out the conflict clearly.

---

## 1. Project Identity

MarketBrain is an AI-native investment research web application.

Current repo shape:

- Monorepo: `pnpm` workspace + `turbo`
- Frontend/BFF: Next.js App Router in `apps/web`
- Worker: Trigger.dev-based TypeScript worker in `apps/worker`
- Shared packages: `ai`, `config`, `db`, `domain`, `observability`, `ui`
- Database: PostgreSQL via Prisma
- Validation: Zod

Product direction from `StartFromHere.md`:

- `schema-first`
- `evidence-first`
- `eval-first`
- Web-first and PWA-enhanced
- Modular monolith, not microservices-first
- Three core outputs: briefings, alerts, interactive research

---

## 2. Architecture Invariants

### 2.1 Modular Monolith Boundaries

The repository is organized around package responsibilities:

- `apps/web` owns pages, route handlers, and user-facing composition
- `apps/worker` owns scheduled, long-running, and event-driven workflows
- `packages/domain` owns business entities, schemas, scoring, state machines,
  and guardrails
- `packages/ai` owns prompts, AI schemas, tools, routing policy, and evaluators
- `packages/db` owns Prisma schema, client, and persistence repositories
- `packages/config` owns environment-variable and feature-flag contracts
- `packages/observability` owns logging, tracing, and metrics helpers
- `packages/ui` owns shared UI components and design tokens

MUST:

- Depend on a package's public API, not its private internal paths
- Keep business rules out of `apps/web` and `packages/ui`
- Keep persistence logic out of `packages/domain` and `packages/ai`

### 2.2 Schema-First Contracts

All cross-boundary data contracts must be defined as typed schemas before the
implementation relies on them.

MUST:

- Define or update Zod schemas before adding new AI outputs, tool inputs, API
  contracts, workflow payloads, or persisted payloads
- Parse model outputs into typed objects before business logic consumes them
- Keep domain-visible types in `packages/domain` or `packages/ai` rather than
  scattering ad hoc object literals through pages and handlers

MUST NOT:

- Trust raw model JSON or free-form text without validation
- Make downstream business logic consume raw natural language when a typed
  object should exist

### 2.3 Evidence-First User Output

User-visible AI outputs must be traceable to evidence.

MUST:

- Carry source references, citations, timestamps, or evidence IDs alongside
  generated conclusions where the surface is decision-relevant
- Keep unsupported speculation out of production-grade briefings, alerts, and
  research summaries
- Represent uncertainty explicitly when evidence is incomplete or conflicting

### 2.4 Eval-First AI Changes

Prompt behavior is a versioned asset, not a casual code tweak.

MUST:

- Pair prompt, router, tool, or guardrail changes with at least one evaluator,
  fixture, or regression test when the behavior is already implemented
- Keep prompts, evaluators, and fixtures in the repo instead of embedding prompt
  strings deep inside UI or worker glue code
- Note any temporary lack of eval coverage explicitly in `PLANS.md` or the task
  description instead of silently skipping it

### 2.5 Server-Side AI Execution

All model calls, tool execution, retrieval, scoring, and guardrail enforcement
must happen on the server side.

MUST:

- Keep provider SDKs and secret-bearing calls out of browser components
- Route AI work through `apps/web` server code, `apps/worker`, or
  `packages/ai`
- Treat push notifications as an enhancement, not the only alert delivery path

### 2.6 Current-State Awareness

This repo is still in an early buildout stage.

MUST:

- Prefer rules that fit the current repo over rules that assume missing
  directories already exist
- Mark planned structure as planned when documenting it
- Update `.ai/CURRENT_STATE.md`, `.ai/repo-map.md`, or `.ai/CHANGE_PROTOCOL.md`
  when structural drift becomes material

---

## 3. Coding Standards

### 3.1 Type Safety

- TypeScript strict mode is the default.
- Add explicit types for exported functions, schema outputs, workflow payloads,
  and repository contracts.
- Avoid `any`; if it is truly necessary, confine it and explain why.

### 3.2 Package Discipline

- Export public package APIs from `src/index.ts`.
- Do not deep-import across packages.
- Keep files focused and small; prefer extracting a sibling module over growing
  a grab-bag file.

### 3.3 Next.js And Worker Discipline

- In `apps/web`, prefer Server Components by default.
- Use Server Actions only for simple mutations; use route handlers for APIs,
  streaming, or webhooks.
- Put long-running or retry-heavy work in `apps/worker`, not in request paths.

### 3.4 Testing

- Every new public feature should have a minimum regression test.
- Package-local unit tests can live in `<package>/tests/`.
- Avoid live network calls and real model-provider calls in automated tests.
- Use fixtures and deterministic inputs for prompts, tools, and evaluators.

### 3.5 Documentation

- Update `.ai/glossary.md` when introducing a new business term that AI agents
  need to understand consistently.
- Update specs or docs when contracts, routes, or user-visible behavior change.
- Keep prompt assets versioned and reviewable in-repo.

### 3.6 Planning

- Create or update `PLANS.md` before editing when the task touches more than
  five files, crosses packages, or cannot be verified in one small step.
- Keep the plan current as work progresses.

---

## 4. Product Constraints

- MarketBrain is a research-support system, not an auto-trading system.
- The primary outputs are briefings, alerts, and research workflows.
- User-facing AI surfaces should optimize for evidence quality, not maximum
  verbosity.
- Notifications must have a non-push fallback path when the feature is built.
- Multi-provider support is intentional; do not hard-bind business logic to a
  single model vendor.

---

## 5. Forbidden Patterns

- Model calls or secret usage in browser-only code
- Deep private imports across workspace packages
- Prompt strings embedded directly inside page components or ad hoc route logic
- `process.env` reads outside `packages/config`
- Unvalidated model output flowing straight into UI or persistence
- Business rules implemented inside shared UI components
- Prisma types leaking across the repo without translation at the db boundary
- Placeholder final code such as `TODO`, `FIXME`, `HACK`, or
  `throw new Error("not implemented")`

---

## 6. Rule Routing Table

Read the matching rule file before editing these areas:

| When you modify... | Read this rule file first |
| --- | --- |
| `apps/web/` | `.ai/rules/web.md` |
| `apps/worker/` | `.ai/rules/worker.md` |
| `packages/ai/` | `.ai/rules/packages-ai.md` |
| `packages/domain/` | `.ai/rules/domain.md` |
| `packages/db/` | `.ai/rules/db.md` |
| `packages/config/` | `.ai/rules/config.md` |
| `packages/observability/` | `.ai/rules/observability.md` |
| `packages/ui/` | `.ai/rules/ui.md` |
| `.github/`, root workspace config, or repo automation files | `.ai/rules/repo-governance.md` |
| `tests/` or `*/tests/` | `.ai/rules/testing.md` |
| `specs/`, docs, or repo markdown contracts | `.ai/rules/docs.md` |

---

## 7. Change-Type Checklist Routing

Before starting a change, load the matching checklist:

| Change type | Checklist file |
| --- | --- |
| Add or change a page, route handler, server action, or user-facing web surface | `.ai/checklists/new-web-surface.md` |
| Add or change prompts, AI schemas, tools, routers, guardrails, or evaluators | `.ai/checklists/ai-change.md` |
| Add or change worker tasks, workflows, schedulers, or notifications | `.ai/checklists/new-worker-flow.md` |
| Add or change database schema, repositories, or DB-backed contracts | `.ai/checklists/db-change.md` |
| Fix a bug | `.ai/checklists/bug-fix.md` |
| Refactor existing code | `.ai/checklists/refactor.md` |

---

## 8. Current Repo Shape Reference

See `.ai/repo-map.md` for the full directory map, ownership guide, and where
work belongs.

See `.ai/CURRENT_STATE.md` for what is already built versus what is planned.

---

## 9. Self-Governance

- If a rule here becomes stale, call it out and update the rule or route.
- If the same drift happens twice, convert it into a stronger checklist item,
  rule, or automated guard.
- Before closing a task, check whether the plan, repo map, or glossary should be
  updated as part of the change.
