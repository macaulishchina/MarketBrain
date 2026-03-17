# MarketBrain Architecture Notes

> Last updated: 2026-03-17
>
> This document describes the current repository structure and the intended
> architectural direction that AI agents should preserve.

---

## 1. System Shape

MarketBrain is a modular monolith with one user-facing web app, one async
worker app, and shared packages.

```text
Users
  -> apps/web (Next.js App Router, PWA shell, BFF endpoints)
  -> apps/worker (Trigger.dev tasks, schedulers, notifications)
  -> packages/domain (business entities, guardrails, scoring)
  -> packages/ai (prompts, schemas, tools, evaluators, routing)
  -> packages/db (Prisma schema, client, repositories)
  -> packages/config (env and feature flags)
  -> packages/observability (logger, tracing, metrics helpers)
  -> packages/ui (shared presentational components)
  -> PostgreSQL and external data/model providers
```

---

## 2. Call Direction

Allowed direction:

- `apps/web` -> workspace package public APIs
- `apps/worker` -> workspace package public APIs
- `packages/ai` -> `packages/domain`, `packages/config`,
  `packages/observability`, provider SDKs
- `packages/db` -> Prisma/PostgreSQL
- `packages/domain` -> pure domain logic, shared schemas, guardrails

Avoid:

- `packages/ui` depending on `packages/db` or provider SDKs
- `packages/domain` depending on Next.js, Trigger.dev, or Prisma runtime types
- browser components calling provider SDKs directly

---

## 3. Architectural Priorities

### 3.1 Schema-First

Before implementation, define the contracts for:

- AI output objects
- tool input/output payloads
- route handler input/output shapes
- workflow payloads
- persisted DB-facing records

### 3.2 Evidence-First

Decision-relevant AI output should be backed by structured evidence:

- source IDs
- citations
- timestamps
- confidence or uncertainty notes

### 3.3 Eval-First

Prompt and routing behavior should be captured as repo assets:

- prompts
- fixtures
- evaluators
- fallback policies

---

## 4. Where Things Live

See `.ai/repo-map.md` for the full directory map, ownership guide, planned
expansion areas, and decision table.

---

## 7. Frontend Product Shape

The web app should remain:

- Web-first
- PWA-enhanced
- desktop-capable for deep research
- mobile-capable for alerts and quick consumption

That means:

- prioritize server-side composition for secure, auditable AI work
- keep evidence visible near conclusions
- treat push notifications as optional enhancement, not the only delivery path
