# MarketBrain — 人工验收测试清单

> Phase 7 Production Hardening 之后的全量验收。
> 每项通过后在 `[ ]` 中标记 `[x]`。

---

## 一、认证与入口

| # | 验收项 | 操作 | 通过 |
|---|--------|------|------|
| 1 | 登录流程 | 打开 `/login`，使用 OAuth 登录，确认跳转到 `/dashboard` | [ ] |
| 2 | 未登录重定向 | 清除 cookie 后直接访问 `/dashboard`，确认重定向到 `/login` | [ ] |
| 3 | Onboarding 引导 | 新用户首次登录后，确认看到 Welcome → 选股 → 通知偏好 → 完成 4 步向导 | [ ] |

## 二、页面加载与错误状态

| # | 验收项 | 操作 | 通过 |
|---|--------|------|------|
| 4 | Loading 骨架屏 | 弱网 (DevTools → Network → Slow 3G) 下依次打开 Dashboard、Alerts、Briefings、Research、Watchlists、Settings，确认每个页面显示灰色脉冲骨架动画 | [ ] |
| 5 | 404 页面 | 访问 `/nonexistent`，确认显示 "Page not found" 以及返回 Dashboard 的链接 | [ ] |
| 6 | 错误边界 | 后端关闭 / API 返回 500 时，确认页面显示 "Something went wrong" 错误界面而非白屏，且有 "Try again" 按钮 | [ ] |

## 三、核心功能链路

| # | 验收项 | 操作 | 通过 |
|---|--------|------|------|
| 7 | Watchlist CRUD | 创建、编辑、删除 watchlist；添加/移除标的；列表正确刷新 | [ ] |
| 8 | Briefing 生成 | 在 Briefings 页点击生成，确认 AI 简报内容正常返回并渲染 | [ ] |
| 9 | 研究对话 | 在 Research 页创建 session，发送消息，确认 AI 回复 + 右侧 evidence 面板有引用 | [ ] |
| 10 | 研究导出 | 在研究 session 中点击导出，确认 markdown 文件下载 | [ ] |
| 11 | 实时告警 | 触发告警条件（或通过 admin API 手动插入 event），确认 Alerts 页面出现新告警卡片 | [ ] |
| 12 | 告警详情与确认 | 点击告警查看详情，标记为 read/acknowledged，状态更新正确 | [ ] |

## 四、设置与偏好

| # | 验收项 | 操作 | 通过 |
|---|--------|------|------|
| 13 | Profile 设置 | 在 Settings → Profile 修改显示名，刷新后确认保持 | [ ] |
| 14 | 通知偏好 | 在 Settings → Notifications 切换各通道开关，保存后刷新确认持久化 | [ ] |

## 五、Feature Flag 切换

| # | 验收项 | 操作 | 通过 |
|---|--------|------|------|
| 15 | 关闭 realtimeAlerts | 设置 `FEATURE_REALTIME_ALERTS=false`，重启，`GET /api/alerts` 返回 `503 Feature disabled` | [ ] |
| 16 | 关闭 interactiveResearch | 设置 `FEATURE_INTERACTIVE_RESEARCH=false`，重启，`POST /api/research/{id}/messages` 返回 `503 Feature disabled` | [ ] |

## 六、安全与合规

| # | 验收项 | 操作 | 通过 |
|---|--------|------|------|
| 17 | Security Headers | DevTools → Network，检查任意响应头包含：`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy` | [ ] |
| 18 | API 错误不泄漏 | 断开 DB 连接后请求 API，确认响应体仅为 `{ "error": "Internal server error" }`，无堆栈信息 | [ ] |

## 七、PWA 与移动端

| # | 验收项 | 操作 | 通过 |
|---|--------|------|------|
| 19 | PWA 安装 | Chrome 地址栏确认出现安装图标，安装后 icon 正确、`start_url` 为 `/dashboard` | [ ] |
| 20 | 移动端响应式 | DevTools 模拟 375px / 390px 宽度，遍历主要页面，无溢出/重叠/不可点击 | [ ] |
| 21 | 触摸目标 | 所有按钮和链接在移动端 ≥ 44px 触摸区域 | [ ] |

## 八、可访问性（A11y）

| # | 验收项 | 操作 | 通过 |
|---|--------|------|------|
| 22 | 键盘导航 | 仅用 Tab / Shift+Tab / Enter 遍历所有页面，焦点可见且操作可达 | [ ] |
| 23 | Skip Link | 页面顶部按 Tab，确认出现 "Skip to main content" 链接 | [ ] |
| 24 | 屏幕阅读器 | 使用 NVDA / VoiceOver 播报主要页面，语义正确无遗漏 | [ ] |

## 九、Admin 后台

| # | 验收项 | 操作 | 通过 |
|---|--------|------|------|
| 25 | Model Calls 监控 | Admin → Model Calls 页面显示 AI 调用记录 | [ ] |
| 26 | Eval 看板 | Admin → Evals 页面评估结果正常显示 | [ ] |
| 27 | Review Queue | Admin → Review Queue 待审项可操作 | [ ] |
| 28 | Alert Precision | Admin → Alert Precision 精度指标有数据 | [ ] |

## 十、数据库

| # | 验收项 | 操作 | 通过 |
|---|--------|------|------|
| 29 | 索引生效 | 运行 `pnpm db:push`，确认 12 个新索引创建成功（无报错） | [ ] |
| 30 | 查询性能 | 大数据量下 Alerts / Research 列表页加载 < 2s | [ ] |

---

**验收结果汇总**：  __ / 30 项通过

**验收人**：_______________  **日期**：_______________
