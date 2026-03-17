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
// Utility
// ---------------------------------------------------------------------------

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}
