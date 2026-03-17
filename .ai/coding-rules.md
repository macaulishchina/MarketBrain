# MarketBrain AI Coding Rules

> This is the short operational summary. The full policy lives in
> `.ai/CONSTITUTION.md`.

1. Start from a task contract, not from vague chat history.
2. Read `.ai/repo-map.md` and the routed rule file before editing.
3. Define or update schemas before implementing AI outputs, tools, routes, or
   workflow payloads.
4. Keep user-facing AI output evidence-backed and uncertainty-aware.
5. Keep prompts, routers, evaluators, and fixtures as versioned repo assets.
6. Do not call model providers from browser code.
7. Import across packages only through public exports.
8. Read env vars only through `packages/config`.
9. Add the smallest useful regression test for every new public behavior.
10. Update `.ai/glossary.md`, `.ai/repo-map.md`, or `.ai/CHANGE_PROTOCOL.md`
    when the repository's shared understanding changes.
