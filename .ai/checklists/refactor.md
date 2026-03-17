# Checklist: Refactor

Use this checklist for behavior-preserving code restructuring.

---

## Guardrails

- [ ] Read the routed rule file for the affected module
- [ ] Confirm that the work is really a refactor, not a hidden feature change
- [ ] Create or update `PLANS.md` if the refactor is large or cross-package

## During The Refactor

- [ ] Preserve public package APIs unless a coordinated contract change is
      intentional
- [ ] Avoid mixing unrelated cleanup into the same change
- [ ] Prefer extracting focused modules over growing large files
- [ ] Keep prompt, domain, db, and UI responsibilities separated

## Verification

- [ ] Keep or add tests that prove behavior stayed stable
- [ ] Run the relevant package or root checks (`pnpm lint`, `pnpm test`,
      `pnpm typecheck`) as appropriate for the change
- [ ] Update repo-map or protocol docs if the structure meaningfully changed
