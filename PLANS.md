# Execution Plan — Phase 3: 实时预警 v0

> Build the real-time alert pipeline: event classification → severity scoring → dedup → delivery → feedback.

## Goal

- Alert severity scoring (S1/S2/S3) based on materiality + relevance
- Alert deduplication, mute, and cooldown logic
- AI-powered alert card generation (headline + summary + tickers)
- Worker tasks: classify-event, generate-alert, deliver-alerts
- Alert API routes (list, read, dismiss, mute, preferences)
- Enhanced alert center page with filters, actions, and feedback
- Notification preferences (in-app, email opt-in, push opt-in)
- Alert precision evaluator + tests

## Why Now

- Phase 2 established the AI execution layer (gateway, prompts, schemas, scoring, guardrails).
- Phase 3 reuses event extraction and extends it to near-real-time alert delivery.
- Per §7.2 of StartFromHere.md: "把系统从 batch 拉到 near-real-time."

## Constraints

- Evidence-first: every alert must link to at least one event with evidence.
- Severity gates: S1 alerts require confidenceScore ≥ 0.7; S2 ≥ 0.5; S3 ≥ 0.3.
- Dedup: same event+user pair does not generate duplicate alerts.
- Mute: user can mute per-ticker or per-event-type; muted alerts are created but not delivered.
- Cooldown: max 1 S1 alert per instrument per 4-hour window.
- All delivery server-side, no browser model calls.
- Alert feedback (read/dismiss) tracked for precision evaluation.

## Non-Goals

- Real external webhook/polling connectors (Phase 3 uses existing documents).
- Web Push (requires service worker; deferred to Phase 3.5).
- Email delivery integration (deferred; schema + preference ready).
- Interactive research (Phase 4).

## Affected Areas

- `packages/domain/src/` — alert scoring, severity classification, dedup/cooldown
- `packages/ai/src/` — alert card generation schema, prompt, evaluator
- `apps/worker/src/` — classify-event, generate-alert, deliver-alerts tasks
- `apps/web/` — alert API routes, enhanced alert center, notification preferences
- `packages/db/` — alert queries

## Steps

1. Alert scoring + severity classification (domain layer).
2. AI alert schemas + alert generation prompt.
3. Worker tasks (classify-event, generate-alert, deliver-alerts).
4. Alert API routes (list, read, dismiss, mute, preferences).
5. Enhanced alert center UI (filters, actions, detail view).
6. Notification preferences page + API.
7. Tests + alert precision evaluator.
8. Verification: typecheck, test, build, commit.

## Verification

- `pnpm turbo typecheck` — all pass
- `pnpm turbo test` — all pass (including new alert tests)
- `pnpm turbo build` — all pass
- Alert scoring unit tests with diverse severity inputs
- Dedup and cooldown logic unit tests
- Alert API integration patterns verified

## Progress Log

- `done` — Step 1: Alert scoring + severity (classifyAlertSeverity, shouldAlert, isDuplicate, isCoolingDown)
- `done` — Step 2: AI alert schemas + prompts (alertCardSchema, alertGenerationPrompt v1, evalAlertPrecision)
- `done` — Step 3: Worker tasks (classify-event, generate-alert, deliver-alerts)
- `done` — Step 4: Alert API routes (GET/PATCH /alerts, GET/PATCH /alerts/[id], GET/PUT /alerts/preferences)
- `done` — Step 5: Enhanced alert center UI (severity filters, ticker badges, status badges, actions)
- `done` — Step 6: Notification preferences (channel matrix, muted tickers, save to DB)
- `done` — Step 7: Tests + evaluators (34 domain tests + 10 AI tests = 44 new, 101 total)
- `done` — Step 8: Verification (typecheck ✅ 8/8, test ✅ 101 tests, build ✅ 2/2)

## Decisions

- Use AI SDK (ai package) as unified provider interface for OpenAI/Anthropic/Google.
- Prompt templates stored as TypeScript objects with version tracking.
- Worker tasks use Trigger.dev SDK for queue, retry, and monitoring.
- Briefing publish gate requires: all items have evidenceIds, confidenceScore >= threshold.
- Evaluators run against fixture data, not live APIs, for deterministic testing.
