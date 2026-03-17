/**
 * Evaluators — functions that score AI output quality.
 *
 * Unlike guardrails (hard pass/fail gates), evaluators return numeric scores
 * for monitoring and regression detection. They run offline or in test suites.
 */

import type { ComposedBriefingItem, EventExtraction } from '../schemas/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EvalResult {
  name: string;
  score: number; // 0-1
  details: string[];
}

// ---------------------------------------------------------------------------
// Factuality Evaluator
// ---------------------------------------------------------------------------

/**
 * Check that every briefing item claim is backed by at least one evidence quote.
 * Returns fraction of items that have ≥1 evidence quote.
 */
export function evalFactuality(items: ComposedBriefingItem[]): EvalResult {
  if (items.length === 0) {
    return { name: 'factuality', score: 0, details: ['No items to evaluate'] };
  }

  const details: string[] = [];
  let backed = 0;

  for (const item of items) {
    if (item.evidenceQuotes.length > 0) {
      backed++;
    } else {
      details.push(`Missing evidence: "${item.headline.slice(0, 60)}…"`);
    }
  }

  const score = backed / items.length;
  return { name: 'factuality', score, details };
}

// ---------------------------------------------------------------------------
// Citation Coverage Evaluator
// ---------------------------------------------------------------------------

/**
 * Measures how well the briefing items cover the source events' evidence.
 * Compares evidence quotes used in briefing items against evidence extracted
 * from source documents.
 *
 * Score = distinct evidence pieces cited / total evidence pieces available.
 */
export function evalCitationCoverage(
  items: ComposedBriefingItem[],
  sourceEvents: EventExtraction['events'],
): EvalResult {
  const details: string[] = [];

  // Collect all source evidence (normalize to lowercase for matching)
  const sourceQuotes = new Set<string>();
  for (const event of sourceEvents) {
    for (const ev of event.evidence) {
      sourceQuotes.add(ev.quote.trim().toLowerCase());
    }
  }

  if (sourceQuotes.size === 0) {
    return { name: 'citation-coverage', score: 0, details: ['No source evidence available'] };
  }

  // Collect briefing quotes
  const usedQuotes = new Set<string>();
  for (const item of items) {
    for (const q of item.evidenceQuotes) {
      const normalized = q.trim().toLowerCase();
      usedQuotes.add(normalized);
      if (!sourceQuotes.has(normalized)) {
        details.push(`Unmatched quote: "${q.slice(0, 60)}…"`);
      }
    }
  }

  // Count how many source quotes are covered
  let covered = 0;
  for (const sq of sourceQuotes) {
    if (usedQuotes.has(sq)) covered++;
  }

  const score = covered / sourceQuotes.size;
  if (score < 0.5) {
    details.push(`Low coverage: ${covered}/${sourceQuotes.size} source quotes used`);
  }

  return { name: 'citation-coverage', score, details };
}

// ---------------------------------------------------------------------------
// Headline Quality Evaluator
// ---------------------------------------------------------------------------

/**
 * Simple heuristic checks for headline quality:
 * - Length between 10 and 200 chars
 * - Does not start with generic phrases like "Breaking:" or "Update:"
 * - Contains at least one actionable word
 */
export function evalHeadlineQuality(items: ComposedBriefingItem[]): EvalResult {
  if (items.length === 0) {
    return { name: 'headline-quality', score: 0, details: ['No items to evaluate'] };
  }

  const details: string[] = [];
  let good = 0;

  const genericPrefixes = ['breaking:', 'update:', 'news:', 'alert:'];

  for (const item of items) {
    const h = item.headline.trim();
    let ok = true;

    if (h.length < 10) {
      details.push(`Too short (${h.length} chars): "${h}"`);
      ok = false;
    }
    if (h.length > 200) {
      details.push(`Too long (${h.length} chars): "${h.slice(0, 40)}…"`);
      ok = false;
    }
    if (genericPrefixes.some((p) => h.toLowerCase().startsWith(p))) {
      details.push(`Generic prefix: "${h.slice(0, 40)}…"`);
      ok = false;
    }

    if (ok) good++;
  }

  return { name: 'headline-quality', score: good / items.length, details };
}
