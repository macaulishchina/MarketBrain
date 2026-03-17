# MarketBrain Coding Conventions

> Practical conventions that expand on the rules in `.ai/CONSTITUTION.md` §3.
> Read the Constitution first; this file adds implementation-level detail.

---

## 1. Tooling

Root commands:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm typecheck
pnpm format:check
```

Current stack:

- TypeScript strict mode
- ESM packages (`"type": "module"`)
- Next.js App Router in `apps/web`
- Vitest for package-level tests
- Prisma for persistence
- Zod for runtime validation

---

## 2. TypeScript Conventions

- Prefer explicit types for exported functions, schema outputs, workflow
  payloads, and repository contracts.
- Prefer `type` for unions and data shapes unless an extendable `interface`
  materially improves readability.
- Keep `any` rare and local; prefer `unknown` + validation.
- Use `async` only when the function actually awaits.

---

## 3. Zod And Contract Conventions

Use Zod as the contract boundary for:

- env vars
- API payloads
- AI output objects
- workflow payloads
- tool inputs and outputs

Pattern:

```ts
import { z } from "zod";

export const AlertSchema = z.object({
  alertId: z.string().uuid(),
  ticker: z.string().min(1),
  summary: z.string().min(1),
  evidenceIds: z.array(z.string()).default([]),
});

export type Alert = z.infer<typeof AlertSchema>;
```

Rules:

- Parse before use.
- Keep schema names singular and concrete.
- Keep business-level contracts in `packages/domain` or `packages/ai`, not
  scattered through app code.

---

## 4. Package Public API Conventions

- Each package should expose its public surface from `src/index.ts`.
- Other packages should import from package entrypoints, not deep private files.
- If a new capability must be public, export it intentionally instead of relying
  on path-based access.

---

## 5. Next.js Conventions

- Prefer Server Components by default.
- Use Client Components only for browser APIs, local interaction, or state that
  truly requires them.
- Keep page files focused on composition; extract reusable logic into `features`,
  `lib`, or shared packages as the repo grows.
- Route handlers should stay thin and delegate meaningful logic to packages or
  dedicated server modules.
- Do not call model providers from browser code.

---

## 6. Worker Conventions

- Worker payloads should be typed and validated.
- Scheduled and retry-heavy work belongs in `apps/worker`.
- Design tasks to be idempotent when possible.
- Log with workflow IDs, run IDs, or correlation IDs where available.

---

## 7. Logging Conventions

- Prefer shared helpers from `@marketbrain/observability`.
- Use structured logs instead of ad hoc string dumps.
- Do not log secrets, raw API keys, or full sensitive payloads.
- Avoid `console.log` in shared packages and production paths unless no shared
  logger exists yet.

---

## 8. Test Conventions

- Add the smallest regression test that proves the change.
- Keep package tests close to the package when practical.
- Avoid live provider calls, live web fetches, and clock-dependent assertions.
- Use fixtures for prompt, tool, and evaluator behavior.

---

## 9. Git And Change Hygiene

- Prefer one logical change per commit.
- Use Conventional Commits when possible: `feat:`, `fix:`, `refactor:`,
  `docs:`, `test:`, `chore:`.
- Do not mix schema changes, prompt changes, and unrelated cleanup in one task
  unless the synchronization is required.
