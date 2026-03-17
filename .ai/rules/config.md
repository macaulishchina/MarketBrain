# Rules: Config Package (`packages/config/`)

> Load this file when modifying environment validation or feature flags.

---

## Scope

`packages/config` owns validated configuration contracts.

## Rules

1. Define env vars in one place and validate them with Zod.
2. Avoid raw `process.env` reads outside this package.
3. Keep defaults explicit and safe.
4. Update `.env.example` whenever required env expectations change.
5. Keep feature flags centralized rather than redefined ad hoc in apps.

## Common Mistakes

- Adding a new env var in application code without updating the schema
- Making configuration behavior implicit or inconsistent across apps
