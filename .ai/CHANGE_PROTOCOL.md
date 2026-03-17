# MarketBrain Change Protocol

> When you change A, you usually need to change B. Use this map to keep AI-led
> changes synchronized.

---

## 1. Adding Or Changing An Env Variable

| Step | File(s) to change |
| --- | --- |
| 1. Update the env schema | `packages/config/src/env.ts` |
| 2. Update sample envs | `.env.example` |
| 3. Update feature-flag or config consumers if needed | `packages/config/src/feature-flags.ts` and callers |
| 4. Add or update tests | nearest config test |
| 5. Update docs if user-facing or operationally important | relevant spec or markdown doc |

---

## 2. Adding Or Changing A Domain Contract

| Step | File(s) to change |
| --- | --- |
| 1. Define the schema/type | `packages/domain/src/...` |
| 2. Update business services, scoring, or guardrails | relevant domain module |
| 3. Update AI-facing schema copy if the contract crosses into model IO | `packages/ai/src/...` |
| 4. Update persistence mapping if stored | `packages/db/src/...` |
| 5. Add tests | relevant package tests |
| 6. Update glossary if introducing new business language | `.ai/glossary.md` |

---

## 3. Adding Or Changing Prompts, AI Schemas, Tools, Routers, Or Evaluators

| Step | File(s) to change |
| --- | --- |
| 1. Add or update schema contracts first | `packages/ai/src/schemas/` or `packages/domain/src/...` |
| 2. Add or update prompt/tool/router code | `packages/ai/src/prompts/`, `tools/`, `router/` |
| 3. Add or update fixtures/evaluators/tests | `packages/ai/src/evaluators/`, `packages/ai/tests/`, fixtures |
| 4. Update worker or web integration points if behavior changed | `apps/web/` or `apps/worker/` |
| 5. Update prompt style guidance if a reusable rule changed | `.ai/prompt-style-guide.md` |

---

## 4. Adding Or Changing A Web Surface

| Step | File(s) to change |
| --- | --- |
| 1. Add page, route handler, or action | `apps/web/...` |
| 2. Add or update shared contracts | relevant package schema/module |
| 3. Add or update UI components | `apps/web/...` or `packages/ui/...` |
| 4. Add tests | nearest web/package test |
| 5. Update docs or specs if the surface changes behavior materially | relevant markdown or spec |

---

## 5. Adding Or Changing A Worker Flow

| Step | File(s) to change |
| --- | --- |
| 1. Add typed payload and workflow/task module | `apps/worker/src/...` |
| 2. Update AI, domain, or db dependencies | relevant package modules |
| 3. Add observability hooks | `packages/observability/...` or workflow code |
| 4. Add tests | `apps/worker` or package tests |
| 5. Update docs if user-visible or operationally important | relevant markdown or spec |

---

## 6. Adding Or Changing Persistence

| Step | File(s) to change |
| --- | --- |
| 1. Update Prisma schema | `packages/db/prisma/schema.prisma` |
| 2. Update repositories or client wrappers | `packages/db/src/...` |
| 3. Update domain mapping | `packages/domain/...` or service adapters |
| 4. Update seed/dev setup if needed | `packages/db/src/...` |
| 5. Add tests | relevant package tests |

---

## 7. Adding Or Changing A Package Public API

| Step | File(s) to change |
| --- | --- |
| 1. Export the symbol intentionally | `<package>/src/index.ts` |
| 2. Update downstream imports | consuming packages/apps |
| 3. Add or update tests | closest package test |

---

## 8. Large Or Multi-Step Changes

| Step | File(s) to change |
| --- | --- |
| 1. Create or update a plan | `PLANS.md` from `.ai/templates/PLANS.md` |
| 2. Record constraints and non-goals | `PLANS.md` |
| 3. Break work into verifiable slices | `PLANS.md` |
| 4. Keep progress and decisions current | `PLANS.md` |

---

## 9. Rule Drift

If a repeated issue shows that this file is incomplete:

1. Update `.ai/CHANGE_PROTOCOL.md`
2. Update the matching checklist or rule file
3. Update `.ai/repo-map.md` or `.ai/CURRENT_STATE.md` if the structure changed
