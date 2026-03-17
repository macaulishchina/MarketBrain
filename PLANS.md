# Execution Plan — Phase 2: 盘前早报 v0

> Build the AI execution layer and deliver the first end-to-end briefing workflow.

## Goal

- Model Gateway with AI SDK, supporting OpenAI / Anthropic / Google providers
- Prompt Registry with versioned templates for extraction and briefing composition
- AI-specific schemas for event extraction and briefing composition
- Tool contracts for document search, price snapshot, etc.
- Worker tasks: event extraction, briefing composition, briefing publish
- Briefing generation API + enhanced briefing pages
- First evaluator set (factuality, citation coverage)
- Guardrails for publish gate (evidence check, confidence threshold)

## Why Now

- Phase 1 established all data models, auth, app shell, and page skeletons.
- Phase 2 closes the first AI-driven loop: documents → events → briefing → user.

## Constraints

- Schema-first: AI output schemas defined before prompts.
- Evidence-first: no briefing item without evidence IDs.
- Eval-first: prompt changes paired with fixtures/evaluators.
- All model calls server-side only (worker or Route Handlers).
- Prompts are versioned repo assets in `packages/ai/src/prompts/`.
- Business guardrails live in `packages/domain`, not in `packages/ai`.

## Non-Goals

- Real-time alert workflow (Phase 3).
- Interactive research chat (Phase 4).
- Full multi-model routing with cost optimization (Phase 5).
- Data source connectors / real external data ingestion.

## Affected Areas

- `packages/ai/src/` — gateway, prompts, schemas, tools, evaluators, router
- `packages/domain/src/` — scoring helpers, guardrails
- `apps/worker/src/` — briefing workflow tasks
- `apps/web/` — briefing generation API, enhanced briefing pages
- `packages/db/` — repository helpers if needed

## Steps

1. Install AI SDK + provider dependencies in packages/ai.
2. Build Model Gateway (provider adapters, extractObject, streamAnswer, judge).
3. Build AI-specific schemas (event extraction output, briefing composition output).
4. Build Prompt Registry with versioned templates (extraction, briefing compose).
5. Build tool contracts (search-documents, get-price-snapshot).
6. Build worker tasks (extract-events, compose-briefing, publish-briefing).
7. Build domain guardrails + scoring helpers.
8. Build briefing generation API + enhance briefing pages.
9. Build first evaluator set + fixtures.
10. Verification: typecheck, test, build, commit.

## Verification

- `pnpm turbo typecheck` — all pass
- `pnpm turbo test` — all pass (including new AI/evaluator tests)
- `pnpm turbo build` — all pass
- Model gateway unit tests with mock providers
- Briefing workflow integration test with fixture data

## Progress Log

- `done` — Step 1: Install AI SDK deps (ai@6.0.116, @ai-sdk/openai/anthropic/google)
- `done` — Step 2: Model Gateway (ModelGateway class + provider adapters)
- `done` — Step 3: AI schemas (eventExtraction, briefingComposition, judge)
- `done` — Step 4: Prompt Registry (3 versioned prompts: extract, briefing, judge)
- `done` — Step 5: Tool contracts (searchDocuments, getPriceSnapshot, getCompanyProfile)
- `done` — Step 6: Worker tasks (extract-events, compose-briefing, generate-briefing)
- `done` — Step 7: Domain guardrails + scoring (materiality/relevance/rank, briefing gates)
- `done` — Step 8: Briefing API + enhanced pages (generate route, admin button, evidence display)
- `done` — Step 9: Evaluators + fixtures (factuality, citation-coverage, headline-quality + 59 tests)
- `done` — Step 10: Verification (typecheck ✅ 8/8, test ✅ 8/8 63 tests, build ✅ 2/2)

## Decisions

- Use AI SDK (ai package) as unified provider interface for OpenAI/Anthropic/Google.
- Prompt templates stored as TypeScript objects with version tracking.
- Worker tasks use Trigger.dev SDK for queue, retry, and monitoring.
- Briefing publish gate requires: all items have evidenceIds, confidenceScore >= threshold.
- Evaluators run against fixture data, not live APIs, for deterministic testing.
