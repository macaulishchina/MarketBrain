# MarketBrain — Beta Operations Runbook

## 1. Pre-Deploy Checklist

- [ ] All tests pass: `pnpm turbo test`
- [ ] Type check clean: `pnpm turbo typecheck`
- [ ] Build succeeds: `pnpm turbo build`
- [ ] Database migrations applied: `pnpm --filter @marketbrain/db db:push`
- [ ] Environment variables configured on target (see §6)
- [ ] Feature flags reviewed (see §5)

## 2. Deployment Steps

```bash
# 1. Pull latest and install
git pull origin main && pnpm install --frozen-lockfile

# 2. Build all packages
pnpm turbo build

# 3. Push database schema (non-destructive)
pnpm --filter @marketbrain/db db:push

# 4. Start services
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

## 3. Health Check Endpoints

| Service   | URL                       | Expected  |
| --------- | ------------------------- | --------- |
| Web App   | `http://localhost:3000`   | 200 HTML  |
| Auth      | `/api/auth/session`       | 200 JSON  |
| API probe | `/api/health` (if added)  | 200 JSON  |

Post-deploy smoke test:

1. Load login page — verify renders without JS errors
2. Log in with a beta user account
3. If first login ➜ onboarding wizard should appear
4. Complete onboarding ➜ redirect to dashboard
5. Check dashboard loads watchlist/alert/briefing counts
6. Navigate to alerts, briefings, research pages

## 4. Rollback Procedure

### Quick rollback (revert deploy)

```bash
# Identify previous working commit
git log --oneline -5

# Reset to previous commit
git checkout <previous-commit-sha>
pnpm install --frozen-lockfile
pnpm turbo build
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

### Database rollback

If the schema push added new columns (additive), rollback is safe — old code
ignores unknown columns. If columns were removed or renamed (destructive),
restore from backup:

```bash
# Restore from pg_dump backup
pg_restore -d marketbrain backup_<timestamp>.sql
```

### Feature flag emergency kill

Disable any feature instantly by setting its env var:

```bash
FEATURE_REALTIME_ALERTS=false
FEATURE_WEB_PUSH=false
FEATURE_INTERACTIVE_RESEARCH=false
FEATURE_MULTI_MODEL_ROUTING=false
FEATURE_BETA_ACCESS=false
```

Restart the web process after changing env vars.

## 5. Feature Flags (Beta Defaults)

| Flag                  | Env Var                          | Default | Description                      |
| --------------------- | -------------------------------- | ------- | -------------------------------- |
| realtimeAlerts        | FEATURE_REALTIME_ALERTS          | true    | WebSocket/SSE real-time alerts   |
| webPush               | FEATURE_WEB_PUSH                 | true    | Browser push notifications       |
| interactiveResearch   | FEATURE_INTERACTIVE_RESEARCH     | true    | AI interactive research sessions |
| multiModelRouting     | FEATURE_MULTI_MODEL_ROUTING      | true    | Multi-provider model routing     |
| betaAccess            | FEATURE_BETA_ACCESS              | true    | Beta access gate                 |

## 6. Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://marketbrain:***@localhost:5432/marketbrain

# Auth
NEXTAUTH_SECRET=<random-32+ char string>
NEXTAUTH_URL=https://<your-domain>

# AI Providers (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Feature flag overrides
# FEATURE_REALTIME_ALERTS=true
# FEATURE_WEB_PUSH=true
```

## 7. Monitoring & Alerts

### Logs

```bash
# Web app logs
docker compose logs -f web --tail 100

# All services
docker compose logs -f --tail 50
```

### Key Metrics to Watch

- **Error rate**: Any 500 responses in web or API routes
- **Auth failures**: Unusual login failure spikes
- **DB connections**: Pool exhaustion (Prisma default pool = 10)
- **Memory**: Node.js heap usage (watch for leaks in SSE connections)

## 8. Incident Response

1. **Assess severity**: Is the app usable? Partial or full outage?
2. **Quick mitigate**: Toggle feature flags to disable broken feature
3. **Communicate**: Notify beta users via email/Slack
4. **Rollback if needed**: Follow §4 procedure
5. **Root cause**: Check logs (§7), reproduce in development
6. **Fix & deploy**: Fix, test, re-deploy following §2

## 9. Beta User Management

Beta users are managed via the `User` table in the database. To add a beta
user, create a row with the desired email. On first login, the user will be
guided through the onboarding wizard.

```sql
-- Check current beta users
SELECT id, email, name, role, "createdAt" FROM "User" ORDER BY "createdAt";

-- Promote to admin
UPDATE "User" SET role = 'admin' WHERE email = 'admin@example.com';
```
