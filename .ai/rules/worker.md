# Rules: Worker (`apps/worker/`)

> Load this file when modifying async workflows, tasks, schedulers, or
> notifications.

---

## Scope

`apps/worker` owns long-running, scheduled, retry-heavy, or event-driven work.

## Rules

1. Use typed payloads and validate important inputs.
2. Prefer idempotent or retry-safe workflow steps.
3. Keep workflow orchestration here; keep business rules in `packages/domain`.
4. Keep prompt/tool logic in `packages/ai`, not inline in task glue when it
   becomes reusable.
5. Add observability fields such as run IDs or correlation IDs for important
   jobs.
6. Do not put UI logic in worker code.

## Common Mistakes

- Doing long-running AI work in a web request path instead of the worker
- Mixing domain rules into workflow scheduling code
- Making tasks depend on implicit global state or unvalidated payloads
