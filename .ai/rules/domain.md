# Rules: Domain Package (`packages/domain/`)

> Load this file when modifying business entities, scoring, services, or
> guardrails.

---

## Scope

`packages/domain` is the home for business language and business rules.

## Rules

1. Put scoring, ranking rules, state transitions, and guardrails here.
2. Keep the package framework-light and deterministic where possible.
3. Do not depend on Next.js, Trigger.dev, or Prisma implementation details here.
4. If a rule affects AI output quality or safety, make that dependency explicit
   to `packages/ai` callers through typed contracts.
5. Keep domain terminology consistent with `.ai/glossary.md`.

## Common Mistakes

- Putting business scoring logic inside web pages or worker schedulers
- Mixing persistence row shapes directly into domain contracts
- Hard-binding domain code to a single provider SDK
