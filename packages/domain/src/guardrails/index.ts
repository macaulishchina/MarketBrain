/**
 * Guardrails — hard constraints that gate AI output before publication.
 *
 * These run AFTER scoring. If any gate fails, the item goes to draft/review,
 * not to the published feed.
 */

// ---------------------------------------------------------------------------
// Briefing Item Gate
// ---------------------------------------------------------------------------

export interface BriefingItemCandidate {
  headline: string;
  whyItMatters: string;
  whatToWatch: string;
  evidenceQuotes: string[];
  confidenceScore: number;
  tickers: string[];
}

export interface GateResult {
  passed: boolean;
  failures: string[];
}

/** Minimum confidence to publish a briefing item. */
const MIN_CONFIDENCE = 0.3;

/** Minimum number of evidence quotes required. */
const MIN_EVIDENCE_COUNT = 1;

/**
 * Check whether a briefing item candidate is ready for publication.
 * Returns pass/fail with reasons.
 */
export function gateBriefingItem(item: BriefingItemCandidate): GateResult {
  const failures: string[] = [];

  if (!item.headline || item.headline.trim().length === 0) {
    failures.push('Missing headline');
  }
  if (item.headline && item.headline.length > 200) {
    failures.push('Headline exceeds 200 characters');
  }
  if (!item.whyItMatters || item.whyItMatters.trim().length === 0) {
    failures.push('Missing whyItMatters');
  }
  if (!item.whatToWatch || item.whatToWatch.trim().length === 0) {
    failures.push('Missing whatToWatch');
  }
  if (item.evidenceQuotes.length < MIN_EVIDENCE_COUNT) {
    failures.push(`Requires at least ${MIN_EVIDENCE_COUNT} evidence quote(s)`);
  }
  if (item.confidenceScore < MIN_CONFIDENCE) {
    failures.push(`Confidence ${item.confidenceScore} below threshold ${MIN_CONFIDENCE}`);
  }

  return { passed: failures.length === 0, failures };
}

// ---------------------------------------------------------------------------
// Full Briefing Gate
// ---------------------------------------------------------------------------

export interface BriefingCandidate {
  marketOverview: string;
  items: BriefingItemCandidate[];
}

export interface BriefingGateResult {
  passed: boolean;
  publishableItems: BriefingItemCandidate[];
  rejectedItems: Array<{ item: BriefingItemCandidate; failures: string[] }>;
}

/**
 * Gate a full briefing. Items that fail individual gates are separated out.
 * The briefing passes if at least one item survives.
 */
export function gateBriefing(candidate: BriefingCandidate): BriefingGateResult {
  const publishableItems: BriefingItemCandidate[] = [];
  const rejectedItems: Array<{ item: BriefingItemCandidate; failures: string[] }> = [];

  for (const item of candidate.items) {
    const result = gateBriefingItem(item);
    if (result.passed) {
      publishableItems.push(item);
    } else {
      rejectedItems.push({ item, failures: result.failures });
    }
  }

  return {
    passed: publishableItems.length > 0,
    publishableItems,
    rejectedItems,
  };
}

// ---------------------------------------------------------------------------
// Alert Gate
// ---------------------------------------------------------------------------

export interface AlertCandidate {
  title: string;
  summary: string;
  evidenceQuotes: string[];
  confidenceScore: number;
  tickers: string[];
}

/** Minimum confidence to send an alert. */
const MIN_ALERT_CONFIDENCE = 0.3;

/**
 * Check whether an alert candidate meets publication standards.
 * Similar to briefing item gate but with alert-specific rules.
 */
export function gateAlert(item: AlertCandidate): GateResult {
  const failures: string[] = [];

  if (!item.title || item.title.trim().length === 0) {
    failures.push('Missing alert title');
  }
  if (item.title && item.title.length > 200) {
    failures.push('Alert title exceeds 200 characters');
  }
  if (!item.summary || item.summary.trim().length === 0) {
    failures.push('Missing alert summary');
  }
  if (item.evidenceQuotes.length < 1) {
    failures.push('Alert requires at least 1 evidence quote');
  }
  if (item.confidenceScore < MIN_ALERT_CONFIDENCE) {
    failures.push(`Confidence ${item.confidenceScore} below alert threshold ${MIN_ALERT_CONFIDENCE}`);
  }

  return { passed: failures.length === 0, failures };
}
