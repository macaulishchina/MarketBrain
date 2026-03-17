# Rules: Observability Package (`packages/observability/`)

> Load this file when modifying logging, tracing, or metrics helpers.

---

## Scope

`packages/observability` owns shared telemetry helpers.

## Rules

1. Prefer structured logs over free-form strings.
2. Include correlation IDs, workflow IDs, or request IDs where they materially
   improve debugging.
3. Never log secrets or raw credentials.
4. Instrument AI calls, tool usage, and workflow boundaries when practical.
5. Keep app code depending on helpers, not bespoke logging patterns.

## Common Mistakes

- Logging sensitive provider payloads verbatim
- Adding divergent logging styles in every app or package
