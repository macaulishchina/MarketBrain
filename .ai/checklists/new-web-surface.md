# Checklist: New Or Changed Web Surface

Use this checklist when adding or changing a page, route handler, server action,
streaming UI surface, or other user-facing web entrypoint.

---

## Pre-Work

- [ ] Read `.ai/rules/web.md`
- [ ] If the work is large or cross-package, create or update `PLANS.md`
- [ ] Confirm whether the change belongs in a page, route handler, server
      action, or shared package instead

## Contracts

- [ ] Define or update request/response schemas before implementation if the
      surface introduces a new contract
- [ ] If the surface depends on AI output, validate typed output before UI use
- [ ] If the surface is decision-relevant, make evidence or citations visible

## Implementation

- [ ] Keep the page or handler thin; push business logic into shared packages or
      dedicated server modules
- [ ] Keep provider/model calls out of browser code
- [ ] Preserve mobile and desktop usability
- [ ] Add loading, empty, and error handling paths where relevant

## Verification

- [ ] Add the smallest useful regression test
- [ ] Run the relevant package or root checks (`pnpm lint`, `pnpm test`,
      `pnpm typecheck`) as appropriate for the change
- [ ] Update docs or specs if the user-visible behavior changed materially
