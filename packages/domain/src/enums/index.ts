export enum UserRole {
  VIEWER = 'viewer',
  ANALYST = 'analyst',
  ADMIN = 'admin',
}

export enum AssetType {
  STOCK = 'stock',
  ETF = 'etf',
  BOND = 'bond',
  INDEX = 'index',
  COMMODITY = 'commodity',
  CRYPTO = 'crypto',
}

export enum AlertSeverity {
  S1 = 's1',
  S2 = 's2',
  S3 = 's3',
}

export enum AlertChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
}

export enum AlertStatus {
  PENDING = 'pending',
  SENT = 'sent',
  READ = 'read',
  DISMISSED = 'dismissed',
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum BriefingStatus {
  GENERATING = 'generating',
  REVIEW = 'review',
  PUBLISHED = 'published',
  FAILED = 'failed',
}

export enum ResearchMode {
  SINGLE_INSTRUMENT = 'single_instrument',
  THEME = 'theme',
  COMPARISON = 'comparison',
  FREEFORM = 'freeform',
}

export enum ResearchSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum ThemeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum SourceType {
  RSS = 'rss',
  API = 'api',
  SCRAPER = 'scraper',
  WEBHOOK = 'webhook',
  MANUAL = 'manual',
}

export enum EvidenceType {
  QUOTE = 'quote',
  DATA_POINT = 'data_point',
  SUMMARY = 'summary',
  CLAIM = 'claim',
}

export enum ImpactDirection {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  MIXED = 'mixed',
}

export enum ModelResultStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  FALLBACK = 'fallback',
}

export enum OrganizationPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}
