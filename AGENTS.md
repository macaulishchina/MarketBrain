# MarketBrain Agent Instructions

Read `.ai/CONSTITUTION.md` before making code changes.

Use the routing table in `.ai/CONSTITUTION.md` to load the module-specific rule
file for any directory you touch.

Before starting a large or multi-step change, create or update the repo-root
`PLANS.md` from `.ai/templates/PLANS.md`.

Follow these project-level rules:

- MarketBrain is `schema-first`, `evidence-first`, and `eval-first`.
- AI/model calls happen on the server side only, never in browser code.
- Cross-package imports must go through public exports, not deep private paths.
- Prompt, router, and evaluator changes belong in versioned repo assets.
- When adding new business terms, update `.ai/glossary.md`.
