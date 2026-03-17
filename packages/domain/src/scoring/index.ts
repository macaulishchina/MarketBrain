/**
 * Scoring helpers — compute materiality, relevance, and confidence scores.
 *
 * These are domain-level rules, not AI-level. They run AFTER model output
 * has been parsed and validated against schemas.
 */

// ---------------------------------------------------------------------------
// Materiality Score
// ---------------------------------------------------------------------------

export interface MaterialityInput {
  importanceScore: number;
  confidenceScore: number;
  noveltyScore: number;
}

/**
 * Composite materiality score: weighted blend of importance, confidence, novelty.
 * Returns 0-1.
 */
export function computeMateriality(input: MaterialityInput): number {
  const { importanceScore, confidenceScore, noveltyScore } = input;
  return clamp(importanceScore * 0.5 + confidenceScore * 0.3 + noveltyScore * 0.2);
}

// ---------------------------------------------------------------------------
// Relevance Score
// ---------------------------------------------------------------------------

export interface RelevanceInput {
  eventTickers: string[];
  watchlistTickers: string[];
}

/**
 * Simple relevance: what fraction of event tickers are on the user's watchlist.
 * Returns 0-1. If no watchlist or no tickers, returns 0.5 (neutral).
 */
export function computeRelevance(input: RelevanceInput): number {
  const { eventTickers, watchlistTickers } = input;
  if (eventTickers.length === 0 || watchlistTickers.length === 0) return 0.5;

  const watchSet = new Set(watchlistTickers.map((t) => t.toUpperCase()));
  const matches = eventTickers.filter((t) => watchSet.has(t.toUpperCase())).length;
  return clamp(matches / eventTickers.length);
}

// ---------------------------------------------------------------------------
// Composite Rank Score
// ---------------------------------------------------------------------------

export interface RankInput {
  materiality: number;
  relevance: number;
}

/** Final rank score for ordering briefing items. Returns 0-1. */
export function computeRankScore(input: RankInput): number {
  return clamp(input.materiality * 0.6 + input.relevance * 0.4);
}

// ---------------------------------------------------------------------------
// Alert Severity Classification
// ---------------------------------------------------------------------------

export type AlertSeverityLevel = 's1' | 's2' | 's3';

export interface SeverityInput {
  confidenceScore: number;
  materiality: number;
  relevance: number;
}

/** Severity thresholds — compositeScore = confidence × 0.5 + materiality × 0.3 + relevance × 0.2 */
const S1_THRESHOLD = 0.7;
const S2_THRESHOLD = 0.5;

/**
 * Classify alert severity based on confidence, materiality, and relevance.
 * - S1: Must interrupt (composite ≥ 0.7)
 * - S2: High priority (composite ≥ 0.5)
 * - S3: In-app only (below 0.5)
 */
export function classifyAlertSeverity(input: SeverityInput): AlertSeverityLevel {
  const composite = clamp(
    input.confidenceScore * 0.5 + input.materiality * 0.3 + input.relevance * 0.2,
  );
  if (composite >= S1_THRESHOLD) return 's1';
  if (composite >= S2_THRESHOLD) return 's2';
  return 's3';
}

// ---------------------------------------------------------------------------
// Should-Alert Decision
// ---------------------------------------------------------------------------

export interface ShouldAlertInput {
  confidenceScore: number;
  eventTickers: string[];
  watchlistTickers: string[];
}

/** Minimum confidence to create an alert at all. */
const MIN_ALERT_CONFIDENCE = 0.3;

/**
 * Decide whether an event should create an alert for a user.
 * Requires: confidence ≥ 0.3 AND at least one ticker on their watchlist
 * (or no tickers on the event, which means a macro event — allowed if confidence is high enough).
 */
export function shouldAlert(input: ShouldAlertInput): boolean {
  if (input.confidenceScore < MIN_ALERT_CONFIDENCE) return false;
  // Macro events (no specific tickers) alert all users with sufficient confidence
  if (input.eventTickers.length === 0) return input.confidenceScore >= S2_THRESHOLD;
  // For ticker-specific events, user must have at least one matching ticker
  if (input.watchlistTickers.length === 0) return false;
  const watchSet = new Set(input.watchlistTickers.map((t) => t.toUpperCase()));
  return input.eventTickers.some((t) => watchSet.has(t.toUpperCase()));
}

// ---------------------------------------------------------------------------
// Deduplication + Cooldown
// ---------------------------------------------------------------------------

export interface DedupEntry {
  eventId: string;
  userId: string;
  createdAt: Date;
}

export interface CooldownEntry {
  severity: AlertSeverityLevel;
  tickers: string[];
  createdAt: Date;
}

/**
 * Check if an alert for this (event, user) pair already exists.
 */
export function isDuplicate(eventId: string, userId: string, existing: DedupEntry[]): boolean {
  return existing.some((e) => e.eventId === eventId && e.userId === userId);
}

/** Cooldown window in milliseconds — 4 hours for S1 alerts. */
const S1_COOLDOWN_MS = 4 * 60 * 60 * 1000;

/**
 * Check if an S1 alert for the same instrument is within the cooldown window.
 * Returns true if the alert should be suppressed (downgraded to S2).
 */
export function isCoolingDown(
  severity: AlertSeverityLevel,
  eventTickers: string[],
  recent: CooldownEntry[],
  now = new Date(),
): boolean {
  if (severity !== 's1') return false;
  if (eventTickers.length === 0) return false;

  const tickerSet = new Set(eventTickers.map((t) => t.toUpperCase()));
  const cutoff = new Date(now.getTime() - S1_COOLDOWN_MS);

  return recent.some(
    (r) =>
      r.severity === 's1' &&
      r.createdAt >= cutoff &&
      r.tickers.some((t) => tickerSet.has(t.toUpperCase())),
  );
}

// ---------------------------------------------------------------------------
// Research Answer Quality Score
// ---------------------------------------------------------------------------

export interface ResearchQualityInput {
  evidenceCount: number;
  hasCounterEvidence: boolean;
  hasCatalysts: boolean;
  hasUncertainties: boolean;
  avgEvidenceConfidence: number;
}

/**
 * Composite research answer quality: weighted blend of evidence depth and balance.
 * Returns 0-1.
 */
export function computeResearchQuality(input: ResearchQualityInput): number {
  const evidenceDepth = clamp(Math.min(input.evidenceCount, 5) / 5);
  const balance =
    (input.hasCounterEvidence ? 0.3 : 0) +
    (input.hasCatalysts ? 0.2 : 0) +
    (input.hasUncertainties ? 0.2 : 0);
  const confidence = clamp(input.avgEvidenceConfidence);

  return clamp(evidenceDepth * 0.4 + balance * 0.3 + confidence * 0.3);
}

// ---------------------------------------------------------------------------
// Evidence Sufficiency Check
// ---------------------------------------------------------------------------

export interface EvidenceSufficiencyInput {
  supportingCount: number;
  minRequired: number;
  avgConfidence: number;
}

/**
 * Check if enough evidence has been gathered to produce a reliable answer.
 * Returns true if evidence meets minimum thresholds.
 */
export function isEvidenceSufficient(input: EvidenceSufficiencyInput): boolean {
  return input.supportingCount >= input.minRequired && input.avgConfidence >= 0.3;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}
