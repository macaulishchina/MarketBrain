# Checklist: Database Or Repository Change

Use this checklist when changing Prisma schema, repositories, or DB-backed
contracts.

---

## Pre-Work

- [ ] Read `.ai/rules/db.md`
- [ ] Read `.ai/rules/domain.md` too if persisted business contracts are
      changing
- [ ] Create or update `PLANS.md` if the work is large or cross-package

## Data Contract

- [ ] Update `packages/db/prisma/schema.prisma` if the data model changed
- [ ] Update repository/client code to match
- [ ] Translate persistence types at the db boundary instead of leaking them
      across the repo
- [ ] Update env/config assumptions if the storage requirements changed

## Verification

- [ ] Add or update regression tests
- [ ] Run the relevant package or root checks (`pnpm lint`, `pnpm test`,
      `pnpm typecheck`) as appropriate for the change
- [ ] Update docs or specs if the storage contract is user-visible or
      operationally important
