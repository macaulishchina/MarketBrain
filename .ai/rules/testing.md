# Rules: Testing

> Load this file when modifying tests or when a change requires new coverage.

---

## Scope

These rules apply to repo-level tests and package-local test folders.

## Rules

1. Add the smallest useful regression test for new public behavior.
2. Keep tests deterministic and avoid live provider calls.
3. Prefer fixtures for AI behavior, prompt output, and evaluator checks.
4. Keep unit tests near the package when practical.
5. Use broader integration or e2e coverage for cross-package flows once those
   suites exist.

## Common Mistakes

- Depending on real network calls or real model-provider responses
- Adding a feature without any regression coverage
