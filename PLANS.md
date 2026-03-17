# Execution Plan — Phase 5: 多模型、评测、风控强化

> Make the system production-ready: multi-model routing with fallback, prompt management, evaluation dashboards, manual review queue, and operational visibility.

## Goal

- Model routing with configurable fallback policy across providers
- Prompt registry admin UI with version diff management
- Evaluation dashboard for tracking AI output quality
- Manual review queue for gated/failed content
- Alert precision dashboard for monitoring alert usefulness
- Latency / cost dashboard for operational visibility

## Why Now

- Phases 0–4 built the three core outputs (briefing, alerts, research). Phase 5 makes them production-grade.
- Per §16 of StartFromHere.md: model routing, fallback policy, prompt registry, eval dashboard, manual review queue, precision dashboard, latency/cost dashboard.
- Existing infrastructure: ModelGateway, PromptTemplate Prisma model, EvalCase/EvalRun models, ModelCall audit model, all evaluators.

## Constraints

- All model calls must be logged to ModelCall table.
- Fallback must be automatic: if primary provider fails, try next.
- Prompt diffs must be viewable side-by-side.
- Review queue items must be resolvable (approve/reject).
- Dashboards read from existing audit tables — no new data pipelines needed.
- Admin-only pages: evals, review queue, precision, latency/cost.

## Non-Goals

- Budget control / rate limiting (post-beta).
- Automated A/B testing between prompt versions.
- Real-time streaming dashboards (batch reads sufficient).

## Affected Areas

- `packages/ai/src/router/` — fallback chain, call logging, cost estimation
- `apps/web/app/(app)/admin/` — evals, review-queue pages
- `apps/web/app/api/admin/` — API routes for evals, model-calls, review queue
- `apps/web/app/(app)/admin/prompts/` — enhanced with diff view
- `packages/db/prisma/` — ReviewItem model

## Steps

1. [x] Model routing with fallback + call logging
2. [x] Prompt registry admin with diff management
3. [x] Eval dashboard (admin/evals)
4. [x] Manual review queue (admin/review-queue)
5. [x] Alert precision dashboard (admin/alert-precision)
6. [x] Latency / cost dashboard (admin/operations)
7. [x] Tests
8. [x] Verification + commit

## Verification

- `pnpm turbo typecheck` — 8/8 pass
- `pnpm turbo test` — 61 tests pass (including Phase 5 cost estimation + gateway tests)
- `pnpm turbo build` — 2/2 pass

## Progress Log

- (empty)

## Decisions

- Use AI SDK streamText for streaming responses in research chat.
- Three-panel desktop layout for research workspace.
- Answer blocks: conclusion, supportingEvidence, counterEvidence, catalysts, uncertainties, followUps.
- Prompt templates stored as TypeScript objects with version tracking.
- Worker tasks use Trigger.dev SDK for queue, retry, and monitoring.
- Briefing publish gate requires: all items have evidenceIds, confidenceScore >= threshold.
- Evaluators run against fixture data, not live APIs, for deterministic testing.
