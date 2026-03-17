import { describe, it, expect } from 'vitest';
import {
  UserRole,
  AssetType,
  AlertSeverity,
  EvidenceType,
  ResearchMode,
  instrumentSchema,
  watchlistSchema,
  evidenceSchema,
  eventSchema,
  alertSchema,
  computeMateriality,
  computeRelevance,
  computeRankScore,
  gateBriefingItem,
  gateBriefing,
  classifyAlertSeverity,
  shouldAlert,
  isDuplicate,
  isCoolingDown,
  gateAlert,
} from '../src/index';

describe('@marketbrain/domain enums', () => {
  it('exports UserRole enum', () => {
    expect(UserRole.ADMIN).toBe('admin');
    expect(UserRole.ANALYST).toBe('analyst');
    expect(UserRole.VIEWER).toBe('viewer');
  });

  it('exports AssetType enum', () => {
    expect(AssetType.STOCK).toBe('stock');
  });

  it('exports AlertSeverity enum', () => {
    expect(AlertSeverity.S1).toBe('s1');
  });

  it('exports EvidenceType enum', () => {
    expect(EvidenceType.QUOTE).toBe('quote');
    expect(EvidenceType.DATA_POINT).toBe('data_point');
  });

  it('exports ResearchMode enum', () => {
    expect(ResearchMode.FREEFORM).toBe('freeform');
  });
});

describe('@marketbrain/domain schemas', () => {
  it('validates instrument schema', () => {
    const result = instrumentSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      ticker: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'stock',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid instrument', () => {
    const result = instrumentSchema.safeParse({ ticker: '' });
    expect(result.success).toBe(false);
  });

  it('validates watchlist schema', () => {
    const result = watchlistSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Tech Watchlist',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('validates evidence schema', () => {
    const result = evidenceSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      documentId: '123e4567-e89b-12d3-a456-426614174001',
      quote: 'Revenue grew 15% YoY',
      evidenceType: 'quote',
      createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('validates event schema', () => {
    const result = eventSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'earnings',
      status: 'draft',
      title: 'AAPL Q4 Earnings Beat',
      firstSeenAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('validates alert schema', () => {
    const result = alertSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      eventId: '123e4567-e89b-12d3-a456-426614174001',
      userId: '123e4567-e89b-12d3-a456-426614174002',
      severity: 's1',
      channel: 'in_app',
      status: 'pending',
      createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

describe('@marketbrain/domain scoring', () => {
  describe('computeMateriality', () => {
    it('computes weighted blend (0.5/0.3/0.2)', () => {
      const score = computeMateriality({
        importanceScore: 1,
        confidenceScore: 1,
        noveltyScore: 1,
      });
      expect(score).toBeCloseTo(1.0);
    });

    it('returns 0 for all-zero inputs', () => {
      const score = computeMateriality({
        importanceScore: 0,
        confidenceScore: 0,
        noveltyScore: 0,
      });
      expect(score).toBe(0);
    });

    it('weights importance highest', () => {
      const highImportance = computeMateriality({
        importanceScore: 1,
        confidenceScore: 0,
        noveltyScore: 0,
      });
      const highConfidence = computeMateriality({
        importanceScore: 0,
        confidenceScore: 1,
        noveltyScore: 0,
      });
      expect(highImportance).toBeGreaterThan(highConfidence);
    });

    it('clamps result to [0, 1]', () => {
      const score = computeMateriality({
        importanceScore: 0.8,
        confidenceScore: 0.6,
        noveltyScore: 0.4,
      });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('computeRelevance', () => {
    it('returns 1.0 for full overlap', () => {
      const score = computeRelevance({
        eventTickers: ['AAPL', 'MSFT'],
        watchlistTickers: ['AAPL', 'MSFT', 'GOOG'],
      });
      expect(score).toBe(1);
    });

    it('returns 0 for no overlap', () => {
      const score = computeRelevance({
        eventTickers: ['AAPL'],
        watchlistTickers: ['GOOG'],
      });
      expect(score).toBe(0);
    });

    it('returns 0.5 for partial overlap', () => {
      const score = computeRelevance({
        eventTickers: ['AAPL', 'MSFT'],
        watchlistTickers: ['AAPL'],
      });
      expect(score).toBe(0.5);
    });

    it('returns 0.5 (neutral) for empty watchlist', () => {
      const score = computeRelevance({
        eventTickers: ['AAPL'],
        watchlistTickers: [],
      });
      expect(score).toBe(0.5);
    });

    it('returns 0.5 (neutral) for empty event tickers', () => {
      const score = computeRelevance({
        eventTickers: [],
        watchlistTickers: ['AAPL'],
      });
      expect(score).toBe(0.5);
    });

    it('is case-insensitive', () => {
      const score = computeRelevance({
        eventTickers: ['aapl'],
        watchlistTickers: ['AAPL'],
      });
      expect(score).toBe(1);
    });
  });

  describe('computeRankScore', () => {
    it('blends materiality(0.6) and relevance(0.4)', () => {
      const score = computeRankScore({ materiality: 1, relevance: 1 });
      expect(score).toBeCloseTo(1.0);
    });

    it('weights materiality higher than relevance', () => {
      const matHigh = computeRankScore({ materiality: 1, relevance: 0 });
      const relHigh = computeRankScore({ materiality: 0, relevance: 1 });
      expect(matHigh).toBeGreaterThan(relHigh);
    });
  });
});

// ---------------------------------------------------------------------------
// Guardrails
// ---------------------------------------------------------------------------

describe('@marketbrain/domain guardrails', () => {
  const validItem = {
    headline: 'Apple Q1 Earnings Beat Street Estimates by 5%',
    whyItMatters: 'Strong demand signals.',
    whatToWatch: 'Q2 guidance on earnings call.',
    evidenceQuotes: ['Revenue of $124B, above consensus.'],
    confidenceScore: 0.9,
    tickers: ['AAPL'],
  };

  describe('gateBriefingItem', () => {
    it('passes a valid item', () => {
      const result = gateBriefingItem(validItem);
      expect(result.passed).toBe(true);
      expect(result.failures).toHaveLength(0);
    });

    it('fails missing headline', () => {
      const result = gateBriefingItem({ ...validItem, headline: '' });
      expect(result.passed).toBe(false);
      expect(result.failures).toContain('Missing headline');
    });

    it('fails headline over 200 chars', () => {
      const result = gateBriefingItem({ ...validItem, headline: 'A'.repeat(201) });
      expect(result.passed).toBe(false);
      expect(result.failures.some((f) => f.includes('200'))).toBe(true);
    });

    it('fails missing whyItMatters', () => {
      const result = gateBriefingItem({ ...validItem, whyItMatters: '' });
      expect(result.passed).toBe(false);
    });

    it('fails missing whatToWatch', () => {
      const result = gateBriefingItem({ ...validItem, whatToWatch: '' });
      expect(result.passed).toBe(false);
    });

    it('fails zero evidence', () => {
      const result = gateBriefingItem({ ...validItem, evidenceQuotes: [] });
      expect(result.passed).toBe(false);
      expect(result.failures.some((f) => f.includes('evidence'))).toBe(true);
    });

    it('fails low confidence (<0.3)', () => {
      const result = gateBriefingItem({ ...validItem, confidenceScore: 0.2 });
      expect(result.passed).toBe(false);
      expect(result.failures.some((f) => f.includes('Confidence'))).toBe(true);
    });

    it('passes confidence exactly at threshold (0.3)', () => {
      const result = gateBriefingItem({ ...validItem, confidenceScore: 0.3 });
      expect(result.passed).toBe(true);
    });

    it('can return multiple failures', () => {
      const result = gateBriefingItem({
        headline: '',
        whyItMatters: '',
        whatToWatch: '',
        evidenceQuotes: [],
        confidenceScore: 0.1,
        tickers: [],
      });
      expect(result.passed).toBe(false);
      expect(result.failures.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('gateBriefing', () => {
    it('passes when at least one item survives', () => {
      const result = gateBriefing({
        marketOverview: 'Markets steady.',
        items: [validItem],
      });
      expect(result.passed).toBe(true);
      expect(result.publishableItems).toHaveLength(1);
      expect(result.rejectedItems).toHaveLength(0);
    });

    it('separates publishable from rejected', () => {
      const badItem = { ...validItem, evidenceQuotes: [], confidenceScore: 0.1 };
      const result = gateBriefing({
        marketOverview: 'Markets steady.',
        items: [validItem, badItem],
      });
      expect(result.passed).toBe(true);
      expect(result.publishableItems).toHaveLength(1);
      expect(result.rejectedItems).toHaveLength(1);
    });

    it('fails when all items are rejected', () => {
      const badItem = { ...validItem, evidenceQuotes: [] };
      const result = gateBriefing({
        marketOverview: 'Markets steady.',
        items: [badItem],
      });
      expect(result.passed).toBe(false);
      expect(result.publishableItems).toHaveLength(0);
      expect(result.rejectedItems).toHaveLength(1);
    });

    it('fails with zero items', () => {
      const result = gateBriefing({
        marketOverview: 'Markets steady.',
        items: [],
      });
      expect(result.passed).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Alert Severity Classification
// ---------------------------------------------------------------------------

describe('@marketbrain/domain alert scoring', () => {
  describe('classifyAlertSeverity', () => {
    it('returns s1 for very high composite', () => {
      const result = classifyAlertSeverity({
        confidenceScore: 0.95,
        materiality: 0.9,
        relevance: 0.8,
      });
      expect(result).toBe('s1');
    });

    it('returns s2 for medium composite', () => {
      const result = classifyAlertSeverity({
        confidenceScore: 0.6,
        materiality: 0.5,
        relevance: 0.5,
      });
      expect(result).toBe('s2');
    });

    it('returns s3 for low composite', () => {
      const result = classifyAlertSeverity({
        confidenceScore: 0.3,
        materiality: 0.2,
        relevance: 0.1,
      });
      expect(result).toBe('s3');
    });

    it('uses correct weights (0.5 conf + 0.3 mat + 0.2 rel)', () => {
      // 0.5*1 + 0.3*0 + 0.2*0 = 0.5 → s2
      const result = classifyAlertSeverity({
        confidenceScore: 1,
        materiality: 0,
        relevance: 0,
      });
      expect(result).toBe('s2');
    });

    it('boundary: exactly 0.7 composite → s1', () => {
      // 0.5*1 + 0.3*0.5 + 0.2*0.25 = 0.5 + 0.15 + 0.05 = 0.7
      const result = classifyAlertSeverity({
        confidenceScore: 1,
        materiality: 0.5,
        relevance: 0.25,
      });
      expect(result).toBe('s1');
    });
  });

  describe('shouldAlert', () => {
    it('returns false for confidence below 0.3', () => {
      expect(
        shouldAlert({
          confidenceScore: 0.2,
          eventTickers: ['AAPL'],
          watchlistTickers: ['AAPL'],
        }),
      ).toBe(false);
    });

    it('returns true when tickers overlap and confidence sufficient', () => {
      expect(
        shouldAlert({
          confidenceScore: 0.5,
          eventTickers: ['AAPL'],
          watchlistTickers: ['AAPL', 'MSFT'],
        }),
      ).toBe(true);
    });

    it('returns false when no ticker overlap', () => {
      expect(
        shouldAlert({
          confidenceScore: 0.8,
          eventTickers: ['GOOG'],
          watchlistTickers: ['AAPL', 'MSFT'],
        }),
      ).toBe(false);
    });

    it('returns false when user has no watchlist and event has tickers', () => {
      expect(
        shouldAlert({
          confidenceScore: 0.8,
          eventTickers: ['AAPL'],
          watchlistTickers: [],
        }),
      ).toBe(false);
    });

    it('macro events (no tickers) alert if confidence ≥ 0.5', () => {
      expect(
        shouldAlert({
          confidenceScore: 0.5,
          eventTickers: [],
          watchlistTickers: ['AAPL'],
        }),
      ).toBe(true);
    });

    it('macro events (no tickers) do not alert if confidence < 0.5', () => {
      expect(
        shouldAlert({
          confidenceScore: 0.4,
          eventTickers: [],
          watchlistTickers: ['AAPL'],
        }),
      ).toBe(false);
    });

    it('is case-insensitive on ticker matching', () => {
      expect(
        shouldAlert({
          confidenceScore: 0.5,
          eventTickers: ['aapl'],
          watchlistTickers: ['AAPL'],
        }),
      ).toBe(true);
    });
  });

  describe('isDuplicate', () => {
    it('detects duplicate event+user pair', () => {
      const existing = [
        { eventId: 'e1', userId: 'u1', createdAt: new Date() },
      ];
      expect(isDuplicate('e1', 'u1', existing)).toBe(true);
    });

    it('returns false for different event', () => {
      const existing = [
        { eventId: 'e1', userId: 'u1', createdAt: new Date() },
      ];
      expect(isDuplicate('e2', 'u1', existing)).toBe(false);
    });

    it('returns false for different user', () => {
      const existing = [
        { eventId: 'e1', userId: 'u1', createdAt: new Date() },
      ];
      expect(isDuplicate('e1', 'u2', existing)).toBe(false);
    });

    it('returns false for empty history', () => {
      expect(isDuplicate('e1', 'u1', [])).toBe(false);
    });
  });

  describe('isCoolingDown', () => {
    it('suppresses S1 for same ticker within 4h', () => {
      const now = new Date();
      const recent = [
        {
          severity: 's1' as const,
          tickers: ['AAPL'],
          createdAt: new Date(now.getTime() - 60 * 60 * 1000), // 1h ago
        },
      ];
      expect(isCoolingDown('s1', ['AAPL'], recent, now)).toBe(true);
    });

    it('does not suppress S1 for expired cooldown', () => {
      const now = new Date();
      const recent = [
        {
          severity: 's1' as const,
          tickers: ['AAPL'],
          createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5h ago
        },
      ];
      expect(isCoolingDown('s1', ['AAPL'], recent, now)).toBe(false);
    });

    it('does not suppress S2 alerts', () => {
      const now = new Date();
      const recent = [
        {
          severity: 's1' as const,
          tickers: ['AAPL'],
          createdAt: new Date(now.getTime() - 60 * 60 * 1000),
        },
      ];
      expect(isCoolingDown('s2', ['AAPL'], recent, now)).toBe(false);
    });

    it('does not suppress S1 for different ticker', () => {
      const now = new Date();
      const recent = [
        {
          severity: 's1' as const,
          tickers: ['MSFT'],
          createdAt: new Date(now.getTime() - 60 * 60 * 1000),
        },
      ];
      expect(isCoolingDown('s1', ['AAPL'], recent, now)).toBe(false);
    });

    it('returns false for no event tickers (macro)', () => {
      const now = new Date();
      const recent = [
        {
          severity: 's1' as const,
          tickers: ['AAPL'],
          createdAt: new Date(now.getTime() - 60 * 60 * 1000),
        },
      ];
      expect(isCoolingDown('s1', [], recent, now)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Alert guardrails
// ---------------------------------------------------------------------------

describe('@marketbrain/domain alert guardrails', () => {
  const validAlert = {
    title: 'AAPL beats Q4 estimates',
    summary: 'Strong revenue growth signals sustained demand.',
    evidenceQuotes: ['Revenue of $124B exceeded consensus by 3%.'],
    confidenceScore: 0.8,
    tickers: ['AAPL'],
  };

  describe('gateAlert', () => {
    it('passes a valid alert', () => {
      const result = gateAlert(validAlert);
      expect(result.passed).toBe(true);
      expect(result.failures).toHaveLength(0);
    });

    it('fails for missing title', () => {
      const result = gateAlert({ ...validAlert, title: '' });
      expect(result.passed).toBe(false);
      expect(result.failures).toContain('Missing alert title');
    });

    it('fails for title over 200 chars', () => {
      const result = gateAlert({ ...validAlert, title: 'X'.repeat(201) });
      expect(result.passed).toBe(false);
    });

    it('fails for missing summary', () => {
      const result = gateAlert({ ...validAlert, summary: '' });
      expect(result.passed).toBe(false);
    });

    it('fails for zero evidence', () => {
      const result = gateAlert({ ...validAlert, evidenceQuotes: [] });
      expect(result.passed).toBe(false);
    });

    it('fails for low confidence', () => {
      const result = gateAlert({ ...validAlert, confidenceScore: 0.1 });
      expect(result.passed).toBe(false);
    });

    it('passes at confidence boundary (0.3)', () => {
      const result = gateAlert({ ...validAlert, confidenceScore: 0.3 });
      expect(result.passed).toBe(true);
    });
  });
});
