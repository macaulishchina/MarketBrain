# Rules: Web (`apps/web/`)

> Load this file when modifying the Next.js web app.

---

## Scope

`apps/web` owns page composition, route handlers, streaming UI, and the web app
experience.

## Rules

1. Keep model calls and secrets on the server side only.
2. Prefer Server Components by default; use Client Components only when browser
   APIs or local interactivity require them.
3. Keep route handlers and page files thin; move business rules, persistence,
   and prompt logic into packages.
4. If a page shows AI conclusions, keep evidence or citations close to the
   output when the surface is decision-relevant.
5. Preserve desktop-depth and mobile-clarity goals for the same codebase.
6. Treat push notifications as an enhancement, not the only alert-delivery
   path.

## Common Mistakes

- Calling provider SDKs from browser code
- Embedding prompt strings directly in page components
- Letting the page layer own business scoring logic
- Building a route handler that bypasses typed validation
