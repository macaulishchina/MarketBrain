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
