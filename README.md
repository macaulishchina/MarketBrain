# MarketBrain

AI-Native Investment Research Workstation — pre-market briefings, real-time alerts, interactive research.

## Quick Start

### Prerequisites

- **Node.js 18+** (see `.nvmrc`)
- **pnpm 9+** (`corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- **Docker** (for PostgreSQL)

### Setup

```bash
# 1. Clone and install
git clone <repo-url> && cd MarketBrain
pnpm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Set up environment
cp .env.example .env.local

# 4. Generate Prisma client and push schema
pnpm db:generate
pnpm db:push

# 5. Start development
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
apps/
  web/          → Next.js App Router (frontend + BFF)
  worker/       → Trigger.dev async task runner

packages/
  domain/       → Business entities, schemas, enums
  ai/           → Model gateway, prompts, tools, evaluators
  db/           → Prisma schema, client, repositories
  ui/           → Design system components
  config/       → Environment validation, feature flags
  observability/→ Structured logging, tracing
```

See [.ai/repo-map.md](.ai/repo-map.md) for the full module inventory and dependency rules.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run all tests |
| `pnpm format` | Format all files |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push Prisma schema to database |
| `pnpm db:migrate` | Run Prisma migrations |

## Tech Stack

- **Frontend**: Next.js 15 App Router, React 19, Tailwind CSS 3
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 16 + pgvector
- **ORM**: Prisma 6
- **Worker**: Trigger.dev 3
- **Monorepo**: pnpm workspaces + Turborepo
- **Testing**: Vitest
- **CI/CD**: GitHub Actions
- **Deployment**: Docker (self-hosted)

## Contributing

See [.ai/coding-rules.md](.ai/coding-rules.md) for conventions.
Use [.ai/task-template.md](.ai/task-template.md) for planning tasks.
Follow [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) for PRs.
