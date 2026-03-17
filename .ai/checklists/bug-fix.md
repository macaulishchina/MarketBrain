# Checklist: Bug Fix

Use this checklist when fixing an existing defect.

---

## Before The Fix

- [ ] Identify the failing behavior clearly
- [ ] Read the routed rule file for the affected module
- [ ] If the fix is large or cross-package, create or update `PLANS.md`

## During The Fix

- [ ] Make the smallest viable change that fixes the issue
- [ ] Add a regression test or fixture if practical
- [ ] Preserve existing schemas and public contracts unless the bug requires a
      contract fix

## After The Fix

- [ ] Run the relevant checks for the affected package(s)
- [ ] Update docs or specs if user-visible behavior changed
- [ ] If the same bug pattern could recur, strengthen a rule, checklist, or
      protocol entry
