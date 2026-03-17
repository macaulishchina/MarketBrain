# MarketBrain — 本地部署与测试指南

## 前置要求

| 工具 | 版本 | 安装 |
|------|------|------|
| Node.js | ≥ 18.17 | `nvm install 18` |
| pnpm | 9.15.4 | `npm i -g pnpm@9.15.4` 或 `corepack enable` |
| Docker | ≥ 24 | [docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | V2 (内置) | 随 Docker Desktop 一起安装 |

## 1. 克隆与安装

```bash
git clone git@github.com:macaulishchina/MarketBrain.git
cd MarketBrain
pnpm install
```

## 2. 启动数据库

```bash
# 启动 PostgreSQL 16 + pgvector
docker compose up -d

# 验证数据库就绪
docker compose exec postgres pg_isready -U marketbrain
# 预期输出: accepting connections
```

## 3. 配置环境变量

```bash
# 复制模板
cp .env.example .env.local
```

编辑 `.env.local`，至少配置以下项：

```env
# 数据库（默认值即可）
DATABASE_URL=postgresql://marketbrain:marketbrain_dev@localhost:5432/marketbrain

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<运行 openssl rand -base64 32 生成>

# AI Provider（至少配一个）
OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# Feature Flags（可选，全部默认 true）
# FEATURE_REALTIME_ALERTS=true
# FEATURE_INTERACTIVE_RESEARCH=true
# FEATURE_MULTI_MODEL_ROUTING=true
# FEATURE_BETA_ACCESS=true
```

## 4. 初始化数据库 Schema

```bash
# 生成 Prisma Client
pnpm db:generate

# 推送 schema 到数据库（含 Phase 7 新增的 12 个索引）
pnpm db:push
```

验证索引已创建：

```bash
docker compose exec postgres psql -U marketbrain -d marketbrain \
  -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;"
```

## 5. 构建

```bash
# 类型检查
pnpm typecheck

# 运行测试
pnpm test

# 生产构建
pnpm build
```

## 6. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000 — 将自动跳转到 `/login`。

## 7. 常用命令速查

| 命令 | 用途 |
|------|------|
| `pnpm dev` | 启动所有 apps 开发模式 |
| `pnpm build` | 生产构建 |
| `pnpm test` | 运行全部测试 |
| `pnpm typecheck` | 全量类型检查 |
| `pnpm db:push` | 推送 Prisma schema 到 DB |
| `pnpm db:generate` | 重新生成 Prisma Client |
| `pnpm db:migrate` | 创建迁移文件 |
| `pnpm db:seed` | 填充种子数据 |
| `pnpm format` | Prettier 格式化 |
| `pnpm clean` | 清理构建产物和 node_modules |
| `docker compose up -d` | 启动数据库 |
| `docker compose down` | 停止数据库 |
| `docker compose logs -f postgres` | 查看数据库日志 |

## 8. Feature Flag 切换测试

在 `.env.local` 中设置对应变量为 `false`，重启 dev server：

```bash
# 示例：关闭实时告警
echo "FEATURE_REALTIME_ALERTS=false" >> .env.local
# 重启 pnpm dev

# 验证：GET /api/alerts 应返回 503
curl -s http://localhost:3000/api/alerts | jq .
# 预期: { "error": "Feature disabled" }
```

测试完恢复：删除或注释掉对应行，重启。

## 9. 安全 Headers 验证

```bash
curl -sI http://localhost:3000/ | grep -iE 'x-frame|x-content|referrer|permissions'
```

预期输出：

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## 10. PWA 测试

1. 用 Chrome 打开 http://localhost:3000
2. 打开 DevTools → Application → Manifest，确认 `start_url: /dashboard`
3. 确认 icons 列表有 192x192 和 512x512
4. 地址栏出现安装图标 → 点击安装

## 11. 错误边界测试

```bash
# 停止数据库模拟后端故障
docker compose stop postgres

# 在浏览器中操作（如刷新 dashboard），预期看到错误边界界面
# 而非白屏

# 恢复
docker compose start postgres
```

## 12. 项目结构

```
MarketBrain/
├── apps/
│   ├── web/          # Next.js 15 前端 (App Router)
│   └── worker/       # 后台任务 Worker
├── packages/
│   ├── ai/           # AI SDK 封装 (多模型路由)
│   ├── config/       # 共享配置 + Feature Flags
│   ├── db/           # Prisma schema + client
│   ├── domain/       # 领域模型 + 业务逻辑
│   └── ui/           # 共享 UI 组件
├── .env.example      # 环境变量模板
├── compose.yaml      # Docker Compose (PostgreSQL)
├── DEPLOY.md         # ← 本文档
├── QA-CHECKLIST.md   # 人工验收清单
├── RUNBOOK.md        # 运维手册
└── PLANS.md          # 当前阶段计划
```

## 13. 故障排查

| 现象 | 原因与解决 |
|------|-----------|
| `pnpm install` 失败 | 检查 Node ≥ 18.17、pnpm 版本 9.x |
| DB 连接失败 | `docker compose up -d` 启动 PG，检查 5432 端口 |
| Prisma generate 报错 | `pnpm db:generate` 后重启 dev server |
| Build 报类型错误 | `pnpm typecheck` 定位问题文件 |
| 页面白屏 | 检查 `.env.local` 中 `NEXTAUTH_SECRET` 是否配置 |
| AI 功能不工作 | 检查 `OPENAI_API_KEY` 或 `ANTHROPIC_API_KEY` 是否配置 |
| Feature disabled 503 | 检查 `.env.local` 中对应 `FEATURE_*` 变量是否为 false |
