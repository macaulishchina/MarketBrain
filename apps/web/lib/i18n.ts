/**
 * Chinese (zh-CN) localization dictionary for MarketBrain.
 *
 * Single-locale approach — no heavy i18n library needed.
 * All UI strings are centralized here for easy maintenance.
 */

export const LOCALE = 'zh-CN' as const;
const TZ = 'Asia/Shanghai';

// ---------------------------------------------------------------------------
// Date / Time helpers
// ---------------------------------------------------------------------------

export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE, { timeZone: TZ, ...options });
}

export function formatDateLong(date: Date | string): string {
  return formatDate(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: Date | string): string {
  return formatDate(date, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(LOCALE, { timeZone: TZ });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(LOCALE, { timeZone: TZ });
}

// ---------------------------------------------------------------------------
// UI Strings
// ---------------------------------------------------------------------------

export const t = {
  // Brand
  brand: 'MarketBrain',
  tagline: 'AI 原生投资研究工作站',
  description: 'AI 驱动的投资研究工作站：盘前简报、实时告警、交互式研究。',

  // Navigation
  nav: {
    dashboard: '仪表盘',
    briefings: '简报',
    alerts: '告警',
    research: '研究',
    watchlists: '自选',
    settings: '设置',
    admin: '管理',
    skipToMain: '跳转到主要内容',
  },

  // Dashboard
  dashboard: {
    welcomeBack: '欢迎回来',
    overview: '您的投资研究工作区概览。',
    watchlists: '自选列表',
    activeWatchlists: '活跃自选列表',
    pendingAlerts: '待处理告警',
    unreadAlerts: '未读告警',
    briefings: '简报',
    publishedBriefings: '已发布简报',
    recentBriefings: '最近简报',
    recentAlerts: '最近告警',
    noBriefingsYet: '暂无简报。AI 管线启动后，简报将显示在此处。',
    noAlertsYet: '暂无告警。检测到事件后，告警将显示在此处。',
  },

  // Briefings
  briefings: {
    title: '简报',
    subtitle: 'AI 分析驱动的盘前每日简报。',
    generate: '生成简报',
    generating: '生成中…',
    noBriefingsYet: '暂无简报。',
    noBriefingsAdmin: '点击"生成简报"以创建。',
    noBriefingsUser: 'AI 管线生成后，简报将显示在此处。',
    backToBriefings: '← 返回简报列表',
    evidence: '证据',
    watch: '关注：',
    confidence: '置信度',
    briefingGenerating: '简报正在生成中…',
    briefingFailed: '简报生成失败，管理员可以重试。',
    noItems: '此简报暂无条目。',
    generated: '生成于',
    promptVersion: '提示词版本',
    items: '条',
    item: '条',
    briefingStatus: '简报已${status} — ${count}条',
  },

  // Alerts
  alerts: {
    title: '告警',
    subtitle: '您追踪的标的实时事件告警。',
    preferences: '偏好设置',
    critical: '紧急',
    highPriority: '高优先级',
    standard: '普通',
    all: '全部',
    s1Critical: 'S1 — 紧急',
    s2High: 'S2 — 高优先级',
    s3Standard: 'S3 — 普通',
    unread: '未读',
    read: '已读',
    dismissed: '已忽略',
    muted: '已静音',
    markAsRead: '标记为已读',
    dismiss: '忽略',
    mute: '静音',
    unmute: '取消静音',
    noAlertsFilter: '没有匹配筛选条件的告警。',
    noAlertsYet: '暂无告警。检测到市场事件后，告警将显示在此处。',
  },

  // Alert status labels
  alertStatus: {
    pending: '待处理',
    sent: '已发送',
    read: '已读',
    dismissed: '已忽略',
  } as Record<string, string>,

  // Briefing status labels
  briefingStatus: {
    published: '已发布',
    generating: '生成中',
    draft: '草稿',
    failed: '失败',
  } as Record<string, string>,

  // Research
  research: {
    title: '研究',
    subtitle: 'AI 驱动的交互式研究会话，配合证据分析。',
    placeholder: '输入研究问题… 例如：「AAPL 的投资论点是什么？」',
    startResearch: '开始研究',
    allSessions: '所有会话',
    active: '进行中',
    archived: '已归档',
    noSessionsYet: '暂无研究会话。请在上方开始新的会话。',
    noFilteredSessions: '没有${filter}的会话。',
    loading: '加载中...',
    researching: '研究中...',
    newSession: '新建研究会话',
    askQuestion: '输入研究问题...',
    messages: '条消息',
    conclusion: '结论',
    supportingEvidence: '支持证据',
    counterEvidence: '反面证据',
    catalysts: '催化剂',
    uncertainties: '不确定因素',
    followUps: '推荐跟进问题',
    evidencePanel: '证据面板',
    clickToViewEvidence: '点击查看证据详情 →',
    noEvidenceSelected: '点击回答以在此查看证据。',
    confidence: '置信度',
    sessionNotFound: '未找到会话。',
    loadingSession: '加载会话中...',
    untitledSession: '未命名会话',
  },

  // Research mode labels
  modeLabels: {
    single_instrument: '单一标的',
    theme: '主题',
    comparison: '对比',
    freeform: '自由提问',
  } as Record<string, string>,

  // Watchlists
  watchlists: {
    title: '自选列表',
    subtitle: '管理您的标的自选列表。',
    noWatchlistsYet: '暂无自选列表。创建一个以开始追踪标的。',
    instruments: '个标的',
    instrument: '个标的',
  },

  // Settings
  settings: {
    profile: {
      title: '个人资料设置',
      subtitle: '管理您的个人资料和偏好。',
      account: '账户',
      name: '姓名',
      email: '邮箱',
      role: '角色',
    },
    notifications: {
      title: '通知设置',
      subtitle: '配置告警和通知偏好。',
      alertChannels: '告警通道',
      channelDesc: '选择每个严重级别的告警接收方式。',
      inApp: '站内',
      email: '邮件',
      push: '推送',
      s1Critical: 'S1 — 紧急',
      s1Desc: '必须立即中断',
      s2HighPriority: 'S2 — 高优先级',
      s2Desc: '可以批量处理',
      s3Standard: 'S3 — 普通',
      s3Desc: '仅站内通知',
      soon: '即将推出',
      mutedTickers: '静音标的',
      mutedTickersDesc: '以逗号分隔的标的代码列表，屏蔽其告警。',
      mutedPlaceholder: '例如 AAPL, TSLA, MSFT',
      briefingDelivery: '简报推送',
      briefingDeliveryDesc: '简报推送偏好将在第 4 期中提供配置。',
      save: '保存偏好',
      saving: '保存中…',
      loadingPrefs: '加载偏好设置…',
    },
  },

  // Auth
  auth: {
    signIn: '登录',
    signingIn: '登录中…',
    signInSubtitle: '登录您的投资研究工作区。',
    email: '邮箱',
    password: '密码',
    emailPlaceholder: 'you@example.com',
    invalidCredentials: '邮箱或密码错误。',
    orContinueWith: '或使用以下方式登录',
    google: 'Google',
  },

  // Onboarding
  onboarding: {
    welcome: '欢迎使用 MarketBrain',
    welcomeDesc: '让我们用几个简单的步骤来设置您的投资研究工作区。',
    displayName: '显示名称（可选）',
    displayNamePlaceholder: '您希望我们怎样称呼您？',
    getStarted: '开始使用',
    buildWatchlist: '构建您的自选列表',
    watchlistDesc: '选择您想要追踪的标的，稍后可随时更改。',
    selected: '已选择',
    back: '返回',
    continue: '继续',
    skip: '跳过',
    notificationPrefs: '通知偏好',
    notifDesc: '选择您希望如何接收告警和简报。',
    inAppNotif: '站内通知',
    inAppNotifDesc: '在仪表盘中查看告警',
    emailAlerts: '邮件告警',
    emailAlertsDesc: '通过邮件接收重要告警',
    pushNotif: '推送通知',
    pushNotifDesc: '浏览器推送紧急告警',
    dailyBriefingTime: '每日简报时间',
    briefingTimeDesc: '盘前简报推送时间（您的本地时区）。',
    completeSetup: '完成设置',
    saving: '保存中…',
    allSet: '一切就绪！',
    allSetDesc: '您的工作区已准备好。开始探索您的投资研究仪表盘吧。',
    goToDashboard: '前往仪表盘',
    somethingWrong: '出了点问题',
  },

  // Error pages
  errors: {
    somethingWrong: '出了点问题',
    unexpectedError: '发生了意外错误，请重试。',
    tryAgain: '重试',
    pageNotFound: '页面未找到',
    pageNotFoundDesc: '您要找的页面不存在或已被移动。',
    goToDashboard: '前往仪表盘',
    errorId: '错误 ID',
  },

  // Landing page
  landing: {
    briefings: '简报',
    briefingsDesc: '盘前每日简报',
    alerts: '告警',
    alertsDesc: '实时事件告警',
    research: '研究',
    researchDesc: '交互式 AI 研究',
  },

  // Common
  common: {
    export: '导出',
    archive: '归档',
    more: '更多...',
  },
} as const;
