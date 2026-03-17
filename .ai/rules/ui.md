# Rules: UI Package (`packages/ui/`)

> Load this file when modifying shared UI components or design tokens.

---

## Scope

`packages/ui` owns reusable presentational building blocks.

## Rules

1. Keep the package presentation-focused.
2. Do not put business rules, repository access, or provider logic here.
3. Design components to work across both desktop and mobile web contexts.
4. Favor composable primitives over one-off monolith components.
5. Preserve accessibility and state clarity in shared UI patterns.

## Common Mistakes

- Embedding data-fetching or business scoring inside shared components
- Making UI primitives depend on specific page routes or DB contracts
