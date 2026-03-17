# Rules: AI Package (`packages/ai/`)

> Load this file when modifying prompts, AI schemas, tools, routing, or
> evaluators.

---

## Scope

`packages/ai` is the home for AI-facing assets and abstractions:

- prompts
- AI-specific schemas
- tool contracts
- model routing and fallback policy
- evaluators and fixtures

## Rules

1. Start with schemas before changing prompt or router behavior.
2. Keep provider-specific behavior behind reusable abstractions where practical.
3. Preserve evidence, citation, and uncertainty requirements in AI outputs.
4. Keep prompt assets versioned in-repo and reviewable.
5. Pair meaningful prompt or router changes with evaluators, fixtures, or tests.
6. Do not let UI code become the long-term home of reusable AI logic.

## Common Mistakes

- Treating prompt changes as harmless string edits
- Returning raw model text to business logic without parsing
- Duplicating business guardrails here that belong in `packages/domain`
