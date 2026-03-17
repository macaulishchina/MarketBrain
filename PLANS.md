# Execution Plan — Phase 6: Beta 上线

> Seal the product for beta launch: onboarding, performance, accessibility, feature flag activation, mobile polish, and operational readiness.

## Goal

- New user onboarding flow (account setup, watchlist init, notification preferences)
- Performance optimizations (loading states, dynamic imports, skeleton UIs)
- Accessibility audit and fixes (ARIA labels, keyboard navigation, skip links, focus management)
- Feature flags activation for beta (enable Phases 3-5 features, add beta gate)
- Mobile/desktop responsive polish (safe-area insets, touch targets, meta viewport)
- Runbook and rollback plan documentation

## Why Now

- Phases 0-5 built all core features and production-grade infrastructure.
- Per §16: onboarding, 性能优化, a11y 修复, mobile/desktop 全链路回归, 灰度开关, runbook, rollback plan.
- Product is feature-complete; Phase 6 is about polish, trust, and operational readiness.

## Constraints

- No new business features — only polish, enablement, and operational artifacts.
- All existing tests must continue to pass.
- Feature flags must be toggleable without code changes.
- Onboarding must work for both new and existing users who haven't completed setup.
- A11y must meet WCAG 2.2 AA for perceivable + operable criteria.

## Non-Goals

- Email verification flow (post-beta).
- Payment/billing integration.
- E2E Playwright test suite (deferred to post-beta).
- Full PWA offline support.

## Affected Areas

- `apps/web/app/(app)/onboarding/` — new onboarding wizard
- `apps/web/app/api/onboarding/` — onboarding API route
- `apps/web/app/(app)/components/app-shell.tsx` — a11y improvements
- `apps/web/app/layout.tsx` — performance, meta, a11y enhancements
- `packages/config/src/feature-flags.ts` — activate beta flags
- `RUNBOOK.md` — new operational documentation

## Steps

1. [ ] Onboarding flow (page + API)
2. [ ] Performance + a11y enhancements
3. [ ] Feature flags activation + beta gate
4. [ ] Mobile/desktop responsive polish
5. [ ] Runbook + rollback plan
6. [ ] Tests + verification + commit

## Verification

- `pnpm turbo typecheck` — all pass
- `pnpm turbo test` — all pass
- `pnpm turbo build` — all pass

## Progress Log

- (empty)

## Decisions

- Onboarding is a multi-step wizard within the (app) route group, gated by user.notificationPreferences.onboardingCompleted flag.
- Feature flags read from env vars at runtime for production toggleability.
- A11y improvements focused on navigation, forms, and dynamic content.
