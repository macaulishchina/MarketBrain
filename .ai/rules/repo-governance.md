# Rules: Repo Governance And Automation

> Load this file when modifying `.github/`, root workspace config, or repo-wide
> automation files.

---

## Scope

This includes:

- `.github/workflows/`
- `.github/CODEOWNERS`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- root test/build config such as `vitest.config.ts`
- repo-level Docker or automation config when it affects the whole workspace

## Rules

1. Treat changes here as repo-wide because they affect every package or every
   pull request.
2. Keep automation aligned with the current monorepo layout and package names.
3. Prefer additive, reviewable workflow changes over broad rewrites.
4. If a new quality gate is introduced, make sure it matches the actual scripts
   that exist in the repo.
5. Keep AI-governance docs, PR templates, and workflow expectations in sync
   when they depend on each other.

## Common Mistakes

- Adding CI commands that the repo cannot actually run
- Renaming package or workspace targets without updating automation
- Changing repo governance files without reflecting the new expectations in
  `.ai/`
