# Rules: Database Package (`packages/db/`)

> Load this file when modifying Prisma schema, repositories, or db clients.

---

## Scope

`packages/db` owns persistence concerns:

- Prisma schema
- db client setup
- repositories and query helpers
- persistence translation

## Rules

1. Keep Prisma and SQL-facing details inside this package.
2. Translate persistence row shapes at the db boundary before handing data to
   domain or AI layers.
3. Coordinate schema changes with repository updates and tests.
4. Keep user-facing business language out of repository internals unless it is
   part of a typed contract.
5. Preserve operational clarity for any env or connection assumptions.

## Common Mistakes

- Importing Prisma types all over the repo
- Letting a page or UI component own DB query logic
- Changing the Prisma schema without updating repositories or dependent tests
