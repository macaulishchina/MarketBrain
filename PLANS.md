# Execution Plan — Phase 4: 交互研究 v1

> Build the interactive research workflow: multi-turn chat sessions with evidence retrieval, structured answer blocks, and citation panel.

## Goal

- Research session CRUD (create, list, detail, archive, export)
- Multi-turn chat with streaming AI responses
- Structured answer blocks: core conclusion, supporting evidence, counter evidence, catalysts, uncertainties, follow-ups
- Evidence retrieval via tool planner (search_documents, getPriceSnapshot, getCompanyProfile)
- Three-panel research UI: session history | AI output | evidence panel
- Research answer quality gates + evaluators
- Save / share / export sessions

## Why Now

- Phase 3 established alert pipeline; Phase 4 upgrades the product from "watch" to "ask".
- Per §7.3 of StartFromHere.md: interactive research with parse intent → plan tools → retrieve evidence → generate answer blocks → self-check → render with evidence.
- Existing infrastructure: ResearchSession/Message Prisma models, ModelGateway.streamText, tool contracts, domain scoring.

## Constraints

- Schema-first: define researchAnswerSchema before implementation.
- Evidence-first: every answer block must reference evidence IDs.
- Server-side AI: all model calls in API routes / worker, never browser.
- Streaming: use AI SDK streamText for real-time response delivery.
- Task routing: research_answer → strong model tier.
- Gated: research answers pass guardrail before rendering.
- Three-panel layout per §4.2: questions/history | AI output | evidence/timeline.

## Non-Goals

- Real document ingestion pipeline (mock tool results).
- External market data connectors (mock snapshots).
- Collaborative / shared sessions (Phase 5+).
- Mobile-optimized research (Phase 6).

## Affected Areas

- `packages/ai/src/` — researchAnswerSchema, researchAnswerPrompt, research evaluator
- `packages/domain/src/` — research quality scoring, evidence sufficiency, answer gates
- `apps/worker/src/` — research-answer orchestration task
- `apps/web/app/api/research/` — sessions CRUD + streaming messages + export
- `apps/web/app/(app)/research/` — session list, chat UI, evidence panel

## Steps

1. [ ] AI schemas + prompts (researchAnswerSchema, researchAnswerPrompt, intentClassification)
2. [ ] Domain layer (research quality scoring, evidence sufficiency, answer gates)
3. [ ] Worker task (research-answer orchestration)
4. [ ] Research API routes (sessions CRUD + streaming messages + export)
5. [ ] Research session chat UI + evidence panel (three-panel layout)
6. [ ] Research list page + create session flow
7. [ ] Tests + evaluators (schema, prompt, domain, quality)
8. [ ] Verification: typecheck, test, build, commit

## Verification

- `pnpm turbo typecheck` — all pass
- `pnpm turbo test` — all pass (including new research tests)
- `pnpm turbo build` — all pass
- Research answer schema validation tests
- Evidence sufficiency and quality gate tests
- Streaming API route integration patterns verified

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
