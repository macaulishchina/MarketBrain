# Checklist: New Or Changed Worker Flow

Use this checklist for tasks, workflows, schedulers, connectors, or
notifications in `apps/worker`.

---

## Pre-Work

- [ ] Read `.ai/rules/worker.md`
- [ ] Read `.ai/rules/packages-ai.md`, `.ai/rules/domain.md`, or
      `.ai/rules/db.md` if the workflow crosses those boundaries
- [ ] Create or update `PLANS.md` for large or cross-package work

## Contracts

- [ ] Define typed payloads before implementing the workflow
- [ ] Validate inbound payloads and important external data
- [ ] Keep workflow outputs explicit if downstream systems depend on them

## Runtime Behavior

- [ ] Make the workflow idempotent or retry-safe where practical
- [ ] Keep long-running and scheduled work out of request paths
- [ ] Add observability fields such as job ID, run ID, or correlation ID
- [ ] Keep secrets and provider calls on the server side only

## Verification

- [ ] Add the smallest regression test or fixture-based test
- [ ] Run the relevant package or root checks (`pnpm lint`, `pnpm test`,
      `pnpm typecheck`) as appropriate for the change
- [ ] Update docs or specs if the workflow is operationally important
