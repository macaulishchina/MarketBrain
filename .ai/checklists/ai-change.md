# Checklist: Prompt, Schema, Tool, Router, Or Evaluator Change

Use this checklist for AI-facing behavior changes.

---

## Pre-Work

- [ ] Read `.ai/rules/packages-ai.md`
- [ ] Read `.ai/rules/domain.md` too if business rules or scoring are involved
- [ ] Create or update `PLANS.md` if the work is large or crosses packages

## Contracts First

- [ ] Add or update the relevant schema before changing prompt behavior
- [ ] Ensure business logic consumes parsed objects, not raw model prose
- [ ] Keep tool inputs and outputs typed

## Evidence And Eval

- [ ] Preserve source references, citations, or evidence IDs where required
- [ ] Add or update a fixture, evaluator, or regression test
- [ ] If eval coverage is deferred, record that explicitly in `PLANS.md`

## Integration

- [ ] Update router or fallback policy if the model-selection behavior changed
- [ ] Update web or worker callers if contract fields changed
- [ ] Update `.ai/prompt-style-guide.md` if a reusable prompt rule changed

## Verification

- [ ] Run the relevant package or root checks (`pnpm lint`, `pnpm test`,
      `pnpm typecheck`) as appropriate for the change
