import { z } from 'zod';
import {
  UserRole,
  AssetType,
  AlertSeverity,
  AlertChannel,
  AlertStatus,
  EventStatus,
  BriefingStatus,
  ResearchMode,
  ResearchSessionStatus,
  MessageRole,
  ThemeStatus,
  SourceType,
  EvidenceType,
  ImpactDirection,
  ModelResultStatus,
  OrganizationPlan,
} from '../enums/index';

// ── §6.1 User & Organization ──────────────────────────────

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  avatar: z.string().url().nullable().optional(),
  role: z.nativeEnum(UserRole),
  locale: z.string().default('en'),
  timezone: z.string().default('UTC'),
  notificationPreferences: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  plan: z.nativeEnum(OrganizationPlan),
  settings: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Organization = z.infer<typeof organizationSchema>;

export const membershipSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: z.nativeEnum(UserRole),
  createdAt: z.date(),
});

export type Membership = z.infer<typeof membershipSchema>;

// ── §6.2 Investment Objects ────────────────────────────────

export const instrumentSchema = z.object({
  id: z.string().uuid(),
  ticker: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  exchange: z.string().nullable().optional(),
  assetType: z.nativeEnum(AssetType),
  country: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Instrument = z.infer<typeof instrumentSchema>;

export const themeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(ThemeStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Theme = z.infer<typeof themeSchema>;

export const watchlistSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Watchlist = z.infer<typeof watchlistSchema>;

export const watchlistItemSchema = z.object({
  id: z.string().uuid(),
  watchlistId: z.string().uuid(),
  instrumentId: z.string().uuid(),
  rank: z.number().int().nonnegative().default(0),
  note: z.string().nullable().optional(),
  createdAt: z.date(),
});

export type WatchlistItem = z.infer<typeof watchlistItemSchema>;

// ── §6.3 Sources & Evidence ───────────────────────────────

export const sourceSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(SourceType),
  name: z.string().min(1).max(200),
  baseUrl: z.string().url().nullable().optional(),
  trustLevel: z.number().int().min(0).max(100).default(50),
  enabled: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Source = z.infer<typeof sourceSchema>;

export const documentSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  externalId: z.string().nullable().optional(),
  title: z.string().min(1),
  url: z.string().url().nullable().optional(),
  publishedAt: z.date().nullable().optional(),
  fetchedAt: z.date(),
  language: z.string().default('en'),
  mimeType: z.string().default('text/plain'),
  hash: z.string().nullable().optional(),
  rawText: z.string().nullable().optional(),
  rawObjectPath: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.date(),
});

export type Document = z.infer<typeof documentSchema>;

export const documentChunkSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  chunkIndex: z.number().int().nonnegative(),
  text: z.string().min(1),
  tokenCount: z.number().int().nonnegative().default(0),
  metadata: z.record(z.unknown()).default({}),
});

export type DocumentChunk = z.infer<typeof documentChunkSchema>;

export const evidenceSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  chunkId: z.string().uuid().nullable().optional(),
  quote: z.string().min(1),
  locator: z.string().nullable().optional(),
  evidenceType: z.nativeEnum(EvidenceType),
  confidence: z.number().min(0).max(1).default(0.5),
  createdAt: z.date(),
});

export type Evidence = z.infer<typeof evidenceSchema>;

// ── §6.4 Events & Outputs ─────────────────────────────────

export const eventSchema = z.object({
  id: z.string().uuid(),
  type: z.string().min(1),
  status: z.nativeEnum(EventStatus),
  title: z.string().min(1),
  summary: z.string().nullable().optional(),
  occurredAt: z.date().nullable().optional(),
  firstSeenAt: z.date(),
  importanceScore: z.number().min(0).max(1).default(0),
  confidenceScore: z.number().min(0).max(1).default(0),
  noveltyScore: z.number().min(0).max(1).default(0),
  publishable: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Event = z.infer<typeof eventSchema>;

export const eventInstrumentSchema = z.object({
  eventId: z.string().uuid(),
  instrumentId: z.string().uuid(),
  relationType: z.string().default('related'),
  impactDirection: z.nativeEnum(ImpactDirection).nullable().optional(),
  impactConfidence: z.number().min(0).max(1).nullable().optional(),
});

export type EventInstrument = z.infer<typeof eventInstrumentSchema>;

export const briefingSchema = z.object({
  id: z.string().uuid(),
  market: z.string().min(1),
  tradingDate: z.date(),
  status: z.nativeEnum(BriefingStatus),
  generatedAt: z.date().nullable().optional(),
  promptVersion: z.string().nullable().optional(),
  modelRouteVersion: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Briefing = z.infer<typeof briefingSchema>;

export const briefingItemSchema = z.object({
  id: z.string().uuid(),
  briefingId: z.string().uuid(),
  eventId: z.string().uuid(),
  rank: z.number().int().nonnegative().default(0),
  headline: z.string().min(1),
  whyItMatters: z.string().min(1),
  whatToWatch: z.string().min(1),
  evidenceIds: z.array(z.string().uuid()).default([]),
});

export type BriefingItem = z.infer<typeof briefingItemSchema>;

export const alertSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  severity: z.nativeEnum(AlertSeverity),
  channel: z.nativeEnum(AlertChannel),
  status: z.nativeEnum(AlertStatus),
  sentAt: z.date().nullable().optional(),
  clickedAt: z.date().nullable().optional(),
  muted: z.boolean().default(false),
  createdAt: z.date(),
});

export type Alert = z.infer<typeof alertSchema>;

// ── §6.5 Research Sessions & AI Audit ─────────────────────

export const researchSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().nullable().optional(),
  mode: z.nativeEnum(ResearchMode),
  query: z.string().nullable().optional(),
  status: z.nativeEnum(ResearchSessionStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ResearchSession = z.infer<typeof researchSessionSchema>;

export const researchMessageSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  role: z.nativeEnum(MessageRole),
  content: z.string().min(1),
  renderedBlocks: z.array(z.unknown()).default([]),
  evidenceIds: z.array(z.string().uuid()).default([]),
  createdAt: z.date(),
});

export type ResearchMessage = z.infer<typeof researchMessageSchema>;

export const promptTemplateSchema = z.object({
  id: z.string().uuid(),
  taskType: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  template: z.string().min(1),
  schema: z.record(z.unknown()).default({}),
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PromptTemplate = z.infer<typeof promptTemplateSchema>;
