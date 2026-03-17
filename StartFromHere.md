下面这份不是“继续写一版文档”，而是一份可以直接指导开工的 **《AI-Native 智能投研 Web 应用实施总纲》**。它默认你的产品还是前面那条主线：**以 LLM 为核心分析引擎，以多源金融信息为输入，以规则与风控为约束，以盘前早报、实时预警、交互研究为三大输出。**

技术路线我先给结论：
**做成一个 Web-first、PWA-enhanced、AI-native 的模块化单体应用。** 前台采用 Next.js App Router，因为它的官方当前架构就是围绕 Server Components、Suspense、Server Functions 来组织；交付形态做成可安装的 PWA，这样一套代码就能覆盖移动端与桌面端，并具备安装、离线和更接近原生应用的体验。AI 层通过统一网关接 OpenAI、Claude、Gemini，不让业务逻辑绑定单一厂商。([Next.js][1])

更重要的是，**这套应用必须是 schema-first，而不是 prompt-first。** 现在 OpenAI、Anthropic、Google 都已经把结构化输出和工具调用做成了一等能力：OpenAI Structured Outputs 用 JSON Schema 约束输出，Responses API 支持 stateful interactions、内置工具和 function calling；Claude 支持 strict tool use，并对工具输入做 schema 级约束；Gemini 同时提供 structured outputs 与 function calling。也就是说，应用应该把“结构化合同、工具接口、证据引用”设计成核心协议，把 prompt 退回成实现细节。([OpenAI开发者][2])

---

# 1. 产品定义：你要建的不是聊天框，而是投研工作台

## 1.1 产品定位

这是一个 **AI 原生投研操作系统**，而不是“带大模型的资讯网站”。

它要完成三件事：

1. 把公告、新闻、财报、宏观、价格、用户 watchlist 等输入，变成**结构化证据**。
2. 把结构化证据经过模型理解、规则校验、评分排序后，变成**少而精的输出**。
3. 把输出通过 Web 应用稳定交付给用户，支持桌面深度研究，也支持手机快速查看与即时处理。

## 1.2 三个主输出

第一，**盘前早报**
面向“今天开盘前 5 分钟，我必须知道什么”。

第二，**实时预警**
面向“现在发生了什么，值不值得立刻打断我”。

第三，**交互式研究**
面向“围绕某只股票/主题/事件做证据驱动的连续研究”。

## 1.3 首版边界

首版默认是 **研究辅助与决策支持系统**，不是自动交易系统。
首版不做：

* 自动下单
* 高噪声社媒舆情全量摄入
* 全市场无限扩张
* 无证据的自由聊天
* 原生 iOS/Android 双端开发

---

# 2. 核心架构决策

## 2.1 采用“模块化单体”，不从微服务起步

首版最合适的是：

**Monorepo + Modular Monolith + Async Worker**

不是因为微服务不行，而是因为你的产品从第一天开始就同时具备：

* 复杂 UI
* 多模型编排
* 异步任务
* 数据接入
* 结构化 schema
* Prompt / Eval / Guardrail 体系

这些东西拆成多仓、多服务后，对 AI 编程助手极不友好：上下文分裂、接口漂移、修改成本高。
所以首版要做成：

* 一个主 Web 应用
* 一个后台 Worker 应用
* 一组共享 packages
* 一个统一模型网关
* 一个统一证据层

这能保证 **人类工程师与 AI 助手都能在一个清晰的仓库边界内工作**。

## 2.2 Web-first，PWA-enhanced

PWA 适合你的原因非常直接：
它本质上还是 Web，但可以安装、可以离线、可以更像 App，而且一套代码可以覆盖手机和桌面。对需要“随时看预警、随时打开研究页面”的投研场景，这比一开始就做原生双端更划算。web.dev 对 PWA 的定义也明确强调了：单代码库、可安装、离线能力，以及更接近平台应用的体验。([web.dev][3])

结论是：

* **桌面端**：承担深度研究、双栏/三栏布局、证据对照
* **移动端**：承担预警接收、盘前速览、快速问答、watchlist 操作
* **同一代码库**：统一设计系统、鉴权、模型接入、证据层

## 2.3 AI 放在服务端，不放在浏览器里

浏览器只负责：

* 展示
* 输入
* 轻交互
* 实时流式渲染

所有模型调用、数据接入、规则校验、评分、证据引用，都必须走服务端。
原因不是只为了安全，而是为了让整个系统能被审计、能回放、能做风控、能做路由与回退。

---

# 3. 推荐技术栈

我建议直接采用下面这一套。它不是唯一方案，但最符合你提出的“Web 应用、移动端/PC 统一、AI 驱动开发、对 AI 友好”的要求。

官方能力层面，这些选择是有明确依据的：pnpm 原生支持 workspace，Turborepo 专门为 JS/TS monorepo 扩展设计；Auth.js 是基于标准 Web API、与运行时无关；Prisma Migrate 能保持数据库 schema 与 Prisma schema 同步并生成 SQL 迁移历史；Trigger.dev 面向长时 AI 任务，自带队列、重试和实时监控；OpenTelemetry JS 负责 metrics / logs / traces，且官方建议先用自动埋点再补手动埋点；Sentry 官方提供 Next.js 的 errors / logs / traces 集成；GitHub Actions 可在仓库内直接自动化 CI/CD，CODEOWNERS、受保护分支、Dependabot 和 Conventional Commits 则分别负责评审、分支保护、依赖更新和机器可读提交历史。([pnpm][4])

## 3.1 前端 / BFF

* **Next.js App Router**
* **TypeScript strict**
* **React Server Components 优先**
* **Server Actions 只用于简单 mutation**
* **Route Handlers 处理 API / webhook / stream**
* **Tailwind 或等价原子化样式方案**
* **shadcn/ui 风格的可组合组件体系**

为什么是它：
Next.js App Router 本身就是文件系统路由，并围绕 Server Components、Suspense、Server Functions 组织，很适合“前台 + BFF + 流式 AI UI”合一。([Next.js][1])

## 3.2 Monorepo / Build

* **pnpm workspace**
* **Turborepo**

为什么是它：
pnpm workspace 对 monorepo 是内建支持，根目录只需 `pnpm-workspace.yaml`；Turborepo 则是为 JS/TS monorepo 的构建与任务编排而设计。([pnpm][4])

## 3.3 AI 接入层

* **Vercel AI SDK** 作为统一调用接口
* **可选 Vercel AI Gateway** 作为统一模型入口
* **同时保留自建 Model Gateway 抽象层**

为什么是它：
AI SDK 本身就是面向 TypeScript 的 AI 应用工具包，核心价值是统一不同 provider 的调用方式，并支持 structured object generation 与 tool calling。官方 provider 列表也明确把 OpenAI、Anthropic、Google Generative AI 作为一等支持项列出。AI Gateway 则在需要更快落地多模型生产运维时，提供单 endpoint、预算、使用监控、负载均衡和 fallback。([Vercel][5])

## 3.4 数据与鉴权

* **PostgreSQL** 作为主库
* **Prisma ORM + Prisma Migrate**
* **对象存储** 保存原始 PDF / HTML / JSON / image 资产
* **向量检索** 建议先用 pgvector 或独立向量层
* **Auth.js** 做登录与 session

为什么是它：
Prisma Migrate 能保持 Prisma schema 与数据库 schema 同步，并生成可版本控制的 SQL migration history；Auth.js 是基于标准 Web API 的 runtime-agnostic 认证方案，适合集成在现代 JS 框架内。([Prisma][6])

## 3.5 后台任务

* **Trigger.dev** 处理：

  * 定时盘前任务
  * 文档摄取与解析
  * 实时事件处理
  * 批量嵌入 / 回填
  * 通知推送
  * 需要人工确认的 workflow

为什么是它：
它明确面向 TypeScript 的后台任务与 AI 工作流，支持长时间运行、队列、自动重试和实时监控，而且官方文档直接写明可用于 long-running AI tasks，并提供与前端实时状态联动。([Trigger][7])

## 3.6 可观测性

* **OpenTelemetry**
* **Sentry**
* **结构化日志（Pino 或同类）**
* **AI 专属追踪字段**

为什么是它：
OpenTelemetry JS 负责 metrics / logs / traces，官方也建议先自动埋点再按业务补手动埋点；Sentry 对 Next.js 有现成的 errors / logs / traces 接入。([OpenTelemetry][8])

## 3.7 测试

* **Vitest / Jest** 做单元测试
* **Playwright** 做 E2E、移动端模拟、通知权限、暗色模式、不同时区/locale 测试

为什么是它：
Playwright 官方支持设备模拟，并能模拟 `userAgent`、`screenSize`、`viewport`、`hasTouch`，以及 `locale`、`timezone`、`permissions`、`colorScheme`。这对同一 Web 应用覆盖手机与桌面非常关键。([Playwright][9])

---

# 4. 应用形态与信息架构

## 4.1 页面地图

首版至少包含这些页面：

### 公开与基础页

* `/login`
* `/onboarding`
* `/pricing`（如有）
* `/about`

### 核心业务页

* `/dashboard`
* `/briefings`
* `/briefings/[date]`
* `/alerts`
* `/research`
* `/research/[sessionId]`
* `/watchlists`
* `/instruments/[ticker]`
* `/themes/[themeId]`

### 设置与管理

* `/settings/profile`
* `/settings/notifications`
* `/settings/models`
* `/settings/watchlists`
* `/admin/sources`
* `/admin/prompts`
* `/admin/evals`
* `/admin/users`
* `/admin/audit`

## 4.2 桌面端布局原则

桌面端优先做成 **研究工作台**：

* 左侧：导航 / watchlist / filters
* 中间：主内容区
* 右侧：证据、时间线、引用、元数据

其中研究页建议做成 **三栏布局**：

* 栏 1：问题与会话历史
* 栏 2：AI 输出正文
* 栏 3：证据、行情、事件时间线、相关股票

这样用户在看“结论”时，始终能同时看“证据”。

## 4.3 移动端布局原则

移动端不是桌面的缩小版，而是另一种任务流：

* 底部导航：Home / Alerts / Search / Watchlist / Me
* 顶部固定搜索入口
* 列表全部卡片化
* 关键指标大字化
* 研究问答全屏沉浸
* 证据以抽屉/底部 sheet 弹出
* 允许“一键收藏、一键加入观察、一键静音通知”

移动端最重要的不是“功能完整”，而是：

* 5 秒内看完盘前摘要
* 2 秒内判断 alert 值不值得点开
* 10 秒内完成一次快速追问

## 4.4 PWA 与通知

交付形态建议做成 **响应式 Web + PWA + opt-in Web Push**。PWA 的价值在于：单代码库、可安装、可离线、可在支持平台上以更接近 App 的方式运行。Push 侧要注意：Web Push 依赖 service worker 与 `pushManager`；Notification API 只能在 HTTPS 安全上下文中工作，且并非所有主流浏览器都具备一致支持，所以推送必须被视为“增强能力”，不能是唯一通知通道。([web.dev][3])

因此通知设计必须三层并存：

* **一级**：站内 alert center
* **二级**：Web Push
* **三级**：邮件摘要 / 邮件提醒

---

# 5. 系统整体架构

## 5.1 逻辑分层

### A. Presentation Layer

负责 Web UI、PWA、流式渲染、权限判断、响应式布局。

### B. BFF / App Layer

负责会话、鉴权、前端聚合 API、流式 AI 输出、前端需要的轻编排。

### C. Domain Layer

负责业务实体、服务、规则、评分、状态机。

### D. AI Layer

负责模型路由、prompt registry、tool registry、schema registry、结果后处理。

### E. Workflow Layer

负责 cron、异步 jobs、回填、摄取、索引、通知。

### F. Data Layer

负责 Postgres、向量索引、对象存储、缓存、日志、审计。

## 5.2 推荐部署形态

* `apps/web`：Next.js Web + BFF
* `apps/worker`：Trigger.dev tasks
* `packages/*`：共享库
* 托管：

  * Web：Vercel / 等价平台
  * Worker：Trigger.dev Cloud 或自托管
  * DB：Managed Postgres
  * Object Storage：S3 compatible
  * Observability：Sentry + OTel backend

## 5.3 关键原则

### 原则 1：浏览器不直接调模型

所有模型请求从服务端发出。

### 原则 2：LLM 不直接写最终业务对象

先出结构化草稿，再经规则层校验。

### 原则 3：证据先于解释

没有 evidence id 的结论，不能发布。

### 原则 4：长任务永远走后台

摘要生成、嵌入、批量回填、事件重算都走 worker。

### 原则 5：所有对象可回放

盘前日报、alert、研究回答，都必须能追溯到：

* 输入文档
* prompt version
* model version / provider
* tool calls
* evidence ids
* post-processing rules

---

# 6. 核心数据模型

下面这组实体足以支撑 v1。

## 6.1 用户与组织

### `User`

* id
* email
* name
* avatar
* role
* locale
* timezone
* notificationPreferences
* createdAt

### `Organization`

* id
* name
* plan
* settings

### `Membership`

* userId
* organizationId
* role

## 6.2 投研对象

### `Instrument`

* id
* ticker
* name
* exchange
* assetType
* country
* sector
* industry
* metadata

### `Theme`

* id
* slug
* name
* description
* status

### `Watchlist`

* id
* userId
* name
* description

### `WatchlistItem`

* watchlistId
* instrumentId
* rank
* note

## 6.3 原始信息与证据

### `Source`

* id
* type
* name
* baseUrl
* trustLevel
* enabled

### `Document`

* id
* sourceId
* externalId
* title
* url
* publishedAt
* fetchedAt
* language
* mimeType
* hash
* rawText
* rawObjectPath
* metadata

### `DocumentChunk`

* id
* documentId
* chunkIndex
* text
* tokenCount
* embedding
* metadata

### `Evidence`

* id
* documentId
* chunkId
* quote
* locator
* evidenceType
* confidence

## 6.4 事件与产出

### `Event`

* id
* type
* status
* title
* summary
* occurredAt
* firstSeenAt
* importanceScore
* confidenceScore
* noveltyScore
* publishable
* metadata

### `EventInstrument`

* eventId
* instrumentId
* relationType
* impactDirection
* impactConfidence

### `Briefing`

* id
* market
* tradingDate
* status
* generatedAt
* promptVersion
* modelRouteVersion

### `BriefingItem`

* briefingId
* eventId
* rank
* headline
* whyItMatters
* whatToWatch
* evidenceIds

### `Alert`

* id
* eventId
* userId
* severity
* channel
* status
* sentAt
* clickedAt
* muted

## 6.5 研究会话与 AI 运行记录

### `ResearchSession`

* id
* userId
* title
* mode
* query
* status

### `ResearchMessage`

* id
* sessionId
* role
* content
* renderedBlocks
* evidenceIds

### `PromptTemplate`

* id
* taskType
* name
* version
* template
* schema
* active

### `ModelCall`

* id
* provider
* model
* taskType
* promptVersion
* inputTokens
* outputTokens
* latencyMs
* cost
* resultStatus
* rawResponsePath

### `EvalCase`

* id
* taskType
* input
* expected
* gradingRule

### `EvalRun`

* id
* caseId
* promptVersion
* modelRouteVersion
* score
* notes

---

# 7. 三大核心工作流

## 7.1 每日盘前早报工作流

### 输入

* 昨收后到今晨盘前的文档与事件流
* watchlist
* 行情快照
* 宏观日历
* 前一交易日未完成事项

### 流程

1. `collect_documents`
2. `normalize_documents`
3. `extract_event_candidates`
4. `resolve_entities_and_tickers`
5. `attach_evidence`
6. `dedupe_events`
7. `score_materiality_relevance_confidence`
8. `compose_briefing_draft`
9. `run_guardrails`
10. `publish_briefing`

### 输出规范

盘前早报不是长文，而是固定格式的 briefing cards：

* 发生了什么
* 为什么重要
* 影响哪些股票/主题
* 证据
* 置信度
* 今天还要盯什么

### 首版目标

* 只输出 6–10 条
* 无一级来源不进早报
* 低置信事件进观察池，不进发布页

## 7.2 实时预警工作流

### 输入

* 新文档/webhook
* 价格异常触发
* 用户关注对象变更

### 流程

1. ingest
2. dedupe
3. classify
4. resolve instruments
5. fetch evidence
6. compute severity
7. gate by rules
8. generate alert card
9. deliver
10. collect feedback

### Alert card 字段

* 标题
* 事件类型
* 相关股票/主题
* 一句话重要性
* 证据片段
* 时间
* 置信度
* 操作：收藏 / 静音 / 查看详情 / 追问

### 预警分级

* `S1`：必须打断
* `S2`：高优先，但可合并
* `S3`：仅站内展示，不主动推送

## 7.3 交互式研究工作流

### 输入

* 用户问题
* 上下文会话
* watchlist / 当前页面对象
* 历史文档与事件
* 行情 / 估值 / 宏观工具

### 流程

1. parse user intent
2. plan required tools
3. retrieve evidence
4. run structured analysis
5. generate answer blocks
6. self-check / contradiction check
7. render with evidence
8. persist session & feedback

### 输出规范

研究回答必须分块：

* 核心结论
* 支持证据
* 反方证据
* 关键催化剂
* 不确定项
* 下一步建议追问

---

# 8. AI 系统设计

## 8.1 为什么模型层一定要做成网关

因为现在 OpenAI、Claude、Gemini 三条路线都能做结构化输出与工具调用，所以你的资产不应该是“某个模型的 prompt 技巧”，而应该是：

* 任务类型定义
* 输出 schema
* tool contracts
* evidence contracts
* routing policy
* eval datasets

AI SDK 已经把 OpenAI、Anthropic、Google Generative AI 这些 provider 做成统一接口，并明确支持 object generation、tool usage、tool streaming，所以做 provider abstraction 是现实工程能力，不是纸面设计。([AI SDK][10])

## 8.2 Model Gateway 设计

定义一个统一接口：

* `extractObject(task, schema, input)`
* `streamAnswer(task, messages, tools)`
* `runToolPlan(task, tools, context)`
* `judge(task, candidate, evidence)`
* `fallback(task, errorState)`

### 内部职责

* provider adapter
* routing
* retry
* fallback
* budget control
* rate limiting
* logging
* schema validation
* safety filter

## 8.3 路由策略

### 任务类型分层

**快模型层**

* 分类
* 抽取
* 去重解释
* 标题生成

**强模型层**

* 盘前合成
* 复杂研究回答
* 多文档对比
* 冲突解释

**裁判层**

* 二次验证
* 反方检查
* 高风险输出审批前复核

### 路由维度

* latency
* cost
* context length
* schema rigidity
* citation need
* importance level

## 8.4 为什么一定要 schema-first

OpenAI Structured Outputs 明确以 JSON Schema 约束输出；Claude 的 strict tool use 可保证工具输入与 schema 一致；Gemini structured outputs 也能基于 JSON Schema 输出类型安全结果。
所以你的核心任务都应先定义 schema，再写 prompt。([OpenAI开发者][2])

具体要求：

* 所有核心 AI 任务先写 `zod` schema
* prompt 中引用 schema 意图，但不靠 prompt 自己“约束格式”
* 业务层只消费解析后的对象，不消费原始自然语言

## 8.5 Vendor 能力如何利用

### OpenAI

适合：

* 结构化抽取
* stateful 对话
* 结合内置工具或 function calling 的 agent 编排

OpenAI Responses API 已明确支持 stateful interactions、内置工具和 function calling。([OpenAI开发者][11])

### Claude

适合：

* 文档理解
* 长文本综合
* 引文式回答
* 严格工具调用

Claude 文档显示 strict tool use 能保证工具输入 schema 一致；其 citations 功能支持 PDF、plain text 和 custom content 文档，并返回可定位的引用。([Claude 开发平台][12])

### Gemini

适合：

* 函数调用驱动工作流
* 结构化抽取
* 多工具调用
* 多模态扩展

Gemini 官方文档明确支持 structured outputs 与 function calling，并说明函数调用可用于接外部 API 与真实动作。([Google AI for Developers][13])

## 8.6 我建议的 AI 资产目录

所有 prompt / eval / route 都必须进 repo：

```text
packages/ai/
  prompts/
    briefing/
    alerts/
    research/
    extraction/
  schemas/
    event.ts
    briefing.ts
    alert.ts
    research.ts
  routes/
    model-router.ts
    fallback-policy.ts
  tools/
    search-documents.ts
    get-price-snapshot.ts
    get-company-profile.ts
    get-theme-map.ts
  evaluators/
    factuality.ts
    citation-coverage.ts
    alert-precision.ts
  fixtures/
    documents/
    expected/
```

---

# 9. 项目结构：为 AI 编程助手设计

下面这个结构是重点。
**这不是“工程师顺手搭的目录”，而是为了让 AI 更容易理解、检索、生成、修改、回归测试。**

```text
repo/
  apps/
    web/
      app/
      components/
      features/
      lib/
      hooks/
      public/
      styles/
      tests/
    worker/
      src/
        tasks/
        workflows/
        connectors/
        schedulers/
        notifications/
  packages/
    domain/
      src/
        entities/
        schemas/
        enums/
        services/
        scoring/
        guardrails/
    ai/
      src/
        prompts/
        schemas/
        tools/
        router/
        evaluators/
    db/
      prisma/
      src/
        client.ts
        repositories/
        seed/
    ui/
      src/
        components/
        patterns/
        tokens/
    search/
      src/
        indexing/
        retrieval/
        reranking/
    observability/
      src/
        logger/
        tracing/
        metrics/
    config/
      src/
        env.ts
        feature-flags.ts
  specs/
    product/
    architecture/
    api/
    prompts/
    evals/
    adr/
  tests/
    e2e/
    integration/
    contract/
    fixtures/
  .github/
    workflows/
    ISSUE_TEMPLATE/
    PULL_REQUEST_TEMPLATE.md
    CODEOWNERS
  .ai/
    repo-map.md
    coding-rules.md
    task-template.md
    glossary.md
    prompt-style-guide.md
  AGENTS.md
  pnpm-workspace.yaml
  turbo.json
  package.json
```

## 9.1 这套结构为什么对 AI 友好

### 第一，边界清晰

AI 最怕“这段逻辑到底该改哪里”。
所以要把：

* domain
* ai
* db
* ui
* observability
  分成独立 package。

### 第二，合同集中

所有 schema、类型、枚举、评分规则集中在 `packages/domain` 和 `packages/ai/schemas`。
AI 只要找到 schema，就能推断上下游。

### 第三，提示词不是散落在代码里

Prompt 必须是版本化资产，不能夹在某个 route handler 里。

### 第四，知识前置给 AI

`.ai/repo-map.md`、`AGENTS.md`、`glossary.md` 的作用就是把人类脑中的隐性约定，变成 AI 可读的显式上下文。

## 9.2 AI 友好的仓库规则

建议强制执行：

* 每个 package 必须有 README，写清职责、入口、禁止依赖
* 每个目录只暴露一个 public API
* 文件长度尽量小，单职责
* 禁止跨 package 私有路径 import
* 所有 env 用统一 schema 校验
* 所有接口都先定义输入输出 schema
* 所有 prompt 改动必须带 eval
* 所有 feature 必须带最小回归测试
* 所有业务术语必须进入 glossary

---

# 10. 开发模式：真正的 AI 驱动开发

这里不是“用 AI 写点代码”，而是把整个项目管理方式改成 **AI-first 的工程流程**。

## 10.1 单个任务的标准输入

任何开发任务，都先生成一张 **Task Contract**：

```text
任务名称：
业务目标：
修改范围：
禁止修改范围：
依赖的 schema：
依赖的页面：
依赖的 prompt：
验收标准：
测试要求：
回滚方式：
```

AI 助手只拿这张卡和 repo map，就能开始高质量工作。

## 10.2 正确的开发顺序

### Step 1：先写 spec

放在 `specs/product` 或 `specs/architecture`

### Step 2：再写 schema

输入、输出、状态机、事件对象都先定

### Step 3：再生成骨架

页面骨架、route、repo、service、tests

### Step 4：AI 实现局部模块

让 AI 只改“有明确边界”的模块，不让它无边界漫游

### Step 5：测试与 eval 同步补齐

不是写完了再补，而是与实现一起产出

### Step 6：人类只审关键点

* 架构
* 安全
* 风控
* 边界条件
* 业务正确性

## 10.3 PR 规范

每个 PR 必须有：

* 业务背景
* 修改范围
* schema 变更
* prompt 变更
* 风险点
* 测试证据
* 截图 / 录屏
* 是否由 AI 辅助完成

## 10.4 仓库治理

GitHub Actions 可以直接在仓库中自动化 CI/CD；CODEOWNERS 可要求关键目录的 code owner 审批；受保护分支可强制状态检查和线性历史；Dependabot 通过 `dependabot.yml` 自动提交依赖更新 PR；Conventional Commits 则给出机器可读的提交语义。这个组合非常适合 AI 协作，因为它把“生成代码”与“准入主干”分离开了。([GitHub Docs][14])

---

# 11. API 与前后端协作模式

## 11.1 API 原则

* 浏览器不直接调第三方模型
* 浏览器不直接调原始数据源
* 所有外部系统走 adapter
* 所有 API 返回结构化对象
* 流式回答与普通对象接口分开

## 11.2 BFF 形态

适合使用：

* **Server Components**：读多写少的数据页
* **Server Actions**：简单表单提交、偏好变更
* **Route Handlers**：复杂 API、stream、webhook、第三方回调

## 11.3 内部 contract

建议所有 contract 分三层：

### View Model

给前端 UI 用

### Domain Model

给业务逻辑用

### AI Model

给模型输入输出用

三层不要混用。
这样 AI 改 UI 时，不会误伤 domain；AI 改抽取器时，不会污染前台类型。

---

# 12. 规则、评分、风控

这是智能投研系统能不能落地的分水岭。

## 12.1 规则层

规则负责硬约束：

* ticker 必须可解析
* 时间必须合法
* 数值必须可校验
* 来源必须可信
* 引文必须存在
* 字段不完整不得发布
* 重复事件不重复推送

## 12.2 评分层

至少做三类分数：

### `materialityScore`

这个事件有多重要

### `relevanceScore`

和用户/持仓/watchlist 有多相关

### `confidenceScore`

证据是否充足、规则是否通过、模型是否一致

## 12.3 发布门控

任何内容要过三个门：

1. **事实门**：抽取字段是否完整
2. **证据门**：是否有支持证据
3. **风控门**：是否达到发布阈值

达不到就进入：

* 草稿池
* 观察池
* 待人工复核队列

---

# 13. 测试、评测与质量控制

## 13.1 工程测试

至少五层：

### 单元测试

* parser
* scoring
* guardrails
* utils

### 集成测试

* route handlers
* repositories
* workflow steps

### 合同测试

* API schema
* AI schema
* event payload schema

### E2E

* 桌面主流程
* 移动端主流程
* 安装 PWA
* 通知授权
* alert 点击跳转
* research 对话与引用查看

### 回归快照

* briefing blocks
* alert cards
* research render blocks

## 13.2 移动端/桌面端测试

Playwright 官方支持设备模拟以及 locale / timezone / permissions / colorScheme 等环境模拟，所以你完全可以在同一测试体系里验证移动端和桌面端，而不是把“移动适配”留到上线前手测。([Playwright][9])

## 13.3 AI 评测

这是你项目里必须单独存在的一层。

建议建立四类 eval：

### 抽取准确率

事件抽取是否正确

### 引用覆盖率

回答中的关键结论是否有证据 id

### 预警精度

发出的 alert 里，多少条是真正有价值的

### 幻觉率

是否出现证据不支持的结论

### 用户效用

用户是否点开、收藏、追问、标记有用

## 13.4 可访问性

必须把 **WCAG 2.2 AA** 作为前台标准，至少把“可感知”和“文本替代”类要求做实。W3C 的 quick reference 明确要求：信息与 UI 组件必须以用户可感知的方式呈现，非文本内容应提供可替代文本。([W3C][15])

---

# 14. 可观测性与运维

## 14.1 你必须监控的不只是报错

对这个应用来说，至少监控：

* 页面错误
* 页面加载与流式首字时间
* 后台 job 成功率
* 文档解析失败率
* 模型调用延迟
* 模型调用成本
* provider fallback 次数
* alert 发送成功率
* alert 点击率
* 研究回答证据覆盖率

## 14.2 技术实现

OpenTelemetry JS 能生成和收集 metrics / logs / traces，且官方明确建议先使用 automatic instrumentation，再按需要补 manual instrumentation；Sentry 的 Next.js 集成则直接覆盖 errors / logs / traces。若你不想首版就自建复杂的多模型预算与流量治理面板，也可以把 AI Gateway 作为生产期捷径，它提供统一 endpoint、预算、用量监控、负载均衡和 fallback。([OpenTelemetry][8])

## 14.3 AI 专属日志字段

每次模型调用至少记录：

* provider
* model
* taskType
* promptVersion
* schemaVersion
* latency
* token usage
* estimated cost
* tool calls
* evidence ids
* fallback path
* final publish state

这样以后你才能回答三个关键问题：

* 为什么它今天答错了？
* 为什么今天成本涨了？
* 为什么这个 alert 被发出去了？

---

# 15. 安全、权限与合规

## 15.1 基本安全边界

* 第三方 API key 只存在服务端
* 数据源凭证走 secrets manager
* 所有管理接口要求 admin role
* 模型输出不能直接持久化为“已发布内容”
* 敏感操作全部审计
* 所有用户偏好变更都有日志

## 15.2 权限模型

首版建议三层：

* `viewer`
* `analyst`
* `admin`

如果有团队版，再加：

* `org_admin`
* `owner`

## 15.3 推送与隐私

推送通知必须明确 opt-in；因为 Web Push 依赖 service worker / `pushManager`，而 Notification 只在 HTTPS 等安全上下文可用，且兼容性并非完全一致，所以通知偏好要允许用户按通道开关，并保留站内消息作为兜底。([MDN Web Docs][16])

## 15.4 风险声明

产品必须明确：

* 这是研究辅助工具，不是自动投资建议执行器
* AI 输出可能有误，所有结论应结合证据查看
* 高风险判断应允许人工复核

---

# 16. 全开发周期实施计划

下面给一个 **14 周落地版**。

## Phase 0：项目启动（第 1 周）

目标：把“能长期演进的地基”一次搭对。

交付物：

* monorepo 初始化
* pnpm workspace
* turborepo
* Next.js web app
* worker app
* CI/CD
* branch protection
* CODEOWNERS
* dependabot
* 基础设计系统
* env schema
* 日志与 tracing 骨架

## Phase 1：基础业务骨架（第 2–3 周）

目标：先把“不是 AI 的部分”定下来。

交付物：

* Auth
* organization / user / role
* instrument / watchlist / theme 数据模型
* dashboard 空页面
* settings / admin 骨架
* Postgres + Prisma schema + migrations
* source / document / evidence 基础表

## Phase 2：盘前早报 v0（第 4–6 周）

目标：先打通第一个闭环。

交付物：

* 数据源接入最小集
* 文档归一化
* 事件抽取 schema
* briefing prompt v1
* briefing item ranking v1
* 早报页面
* 盘前定时任务
* admin 可查看原始 evidence
* eval 集第一版

## Phase 3：实时预警 v0（第 7–8 周）

目标：把系统从 batch 拉到 near-real-time。

交付物：

* webhook / polling connectors
* alert scoring
* dedupe / mute / cooldown
* 站内 alert center
* Web Push opt-in
* 邮件 fallback
* alert feedback

## Phase 4：交互研究 v1（第 9–11 周）

目标：让产品从“看”升级到“问”。

交付物：

* research session
* evidence retrieval
* tool planner
* multi-turn chat
* answer blocks + citations
* side panel evidence viewer
* save / share / export

## Phase 5：多模型、评测、风控强化（第 12–13 周）

目标：让系统可生产，而不是“能跑”。

交付物：

* model routing
* fallback policy
* prompt registry
* prompt diff 管理
* eval dashboard
* manual review queue
* alert precision dashboard
* latency / cost dashboard

## Phase 6：Beta 上线（第 14 周）

目标：封板。

交付物：

* onboarding
* 性能优化
* a11y 修复
* mobile/desktop 全链路回归
* 灰度开关
* runbook
* rollback plan
* beta 用户名单

---

# 17. 团队配置建议

首版最小可行团队：

* 1 名产品负责人 / 兼投研 owner
* 1 名技术负责人（全栈 + 架构）
* 2 名全栈工程师
* 1 名 AI 工程师
* 0.5 名设计师
* 0.5 名 QA / DevOps

如果资源更少，最小压缩版也能做，但至少保留：

* 产品 owner
* 技术 owner
* 全栈 1
* AI 1

---

# 18. 定义完成（Definition of Done）

任何一个功能要算完成，至少满足：

* 业务流程可跑通
* 桌面与移动端都可用
* schema 已固定
* prompt 已版本化
* 有最小测试
* 有最小 eval
* 有最小 observability
* 有错误兜底
* 有回滚方案
* 有用户可理解的空态 / 错态 / 加载态

对 AI 功能，再额外要求：

* 输出有 evidence ids
* 记录 promptVersion / model / provider
* 通过 hallucination smoke test
* provider 异常时有 fallback 或降级路径

---

# 19. 首版明确不做的事

这几条非常重要：

## 不做 1：一开始就微服务

会把人和 AI 一起拖进上下文地狱。

## 不做 2：浏览器直连模型

没有审计、没有风控、没有治理。

## 不做 3：把 prompt 当 API

prompt 是实现，schema 才是合同。

## 不做 4：研究页做成纯聊天

投研产品需要证据面板、时间线、反方信息、结构化块。

## 不做 5：看到新闻就推

alert 最大风险不是“漏”，而是“烦”和“错”。

## 不做 6：首版就做原生双端

PWA + 响应式先把产品验证跑通。

---

# 20. 直接开工的初始化清单

按顺序做：

1. 建 monorepo
2. 建 `apps/web`
3. 建 `apps/worker`
4. 建 `packages/domain`
5. 建 `packages/ai`
6. 建 `packages/db`
7. 建 `specs/`
8. 建 `.ai/repo-map.md`
9. 接入 Auth
10. 初始化 Postgres + Prisma
11. 建 instrument / watchlist / source / document schema
12. 建 dashboard / briefings / alerts / research 页面壳
13. 建 model gateway 抽象
14. 建 prompt registry
15. 建 first eval set
16. 建 first worker tasks
17. 建 CI + protected branches + CODEOWNERS
18. 建 observability
19. 做 briefing v0
20. 做 alert v0

---

# 最终结论

这款应用的正确实现方式，不是“前端 + 后端 + 接个大模型”，而是：

**一个为 AI 设计的 Web 投研操作系统。**

它的最佳首版形态是：

* **Web-first**
* **PWA-enhanced**
* **Next.js App Router 前台 + BFF**
* **Trigger.dev 异步工作流**
* **Postgres + Prisma 数据骨架**
* **AI SDK / Model Gateway 统一多模型**
* **schema-first / evidence-first / eval-first**
* **Monorepo + AI-friendly package 边界**
* **桌面做研究工作台，移动端做高频消费与快速操作**

下一步最值得做的，不是再补概念，而是把这份总纲直接拆成 **repo 初始化规范、核心 schema、页面清单和首 4 周 sprint backlog**。

[1]: https://nextjs.org/docs/app "https://nextjs.org/docs/app"
[2]: https://developers.openai.com/api/docs/guides/structured-outputs/ "https://developers.openai.com/api/docs/guides/structured-outputs/"
[3]: https://web.dev/learn/pwa/progressive-web-apps/ "https://web.dev/learn/pwa/progressive-web-apps/"
[4]: https://pnpm.io/workspaces "https://pnpm.io/workspaces"
[5]: https://vercel.com/docs/ai-sdk "https://vercel.com/docs/ai-sdk"
[6]: https://www.prisma.io/docs/orm/prisma-migrate "https://www.prisma.io/docs/orm/prisma-migrate"
[7]: https://trigger.dev/docs/introduction "https://trigger.dev/docs/introduction"
[8]: https://opentelemetry.io/docs/languages/js/ "https://opentelemetry.io/docs/languages/js/"
[9]: https://playwright.dev/docs/emulation "https://playwright.dev/docs/emulation"
[10]: https://ai-sdk.dev/providers/ai-sdk-providers "https://ai-sdk.dev/providers/ai-sdk-providers"
[11]: https://developers.openai.com/api/reference/responses/overview "https://developers.openai.com/api/reference/responses/overview"
[12]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview"
[13]: https://ai.google.dev/gemini-api/docs/structured-output "https://ai.google.dev/gemini-api/docs/structured-output"
[14]: https://docs.github.com/en/actions "https://docs.github.com/en/actions"
[15]: https://www.w3.org/WAI/WCAG22/quickref/ "https://www.w3.org/WAI/WCAG22/quickref/"
[16]: https://developer.mozilla.org/en-US/docs/Web/API/Push_API "https://developer.mozilla.org/en-US/docs/Web/API/Push_API"
