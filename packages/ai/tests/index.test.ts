import { describe, it, expect } from 'vitest';
import {
  TaskType,
  modelCallSchema,
  eventExtractionSchema,
  briefingCompositionSchema,
  judgeResultSchema,
  alertCardSchema,
  getPrompt,
  evalFactuality,
  evalCitationCoverage,
  evalHeadlineQuality,
  evalAlertPrecision,
  type ComposedBriefingItem,
  type EventExtraction,
  type AlertCard,
  type AlertFeedback,
} from '../src/index';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

describe('@marketbrain/ai schemas', () => {
  it('exports TaskType constants', () => {
    expect(TaskType.CLASSIFY).toBe('classify');
    expect(TaskType.RESEARCH_ANSWER).toBe('research_answer');
  });

  it('modelCallSchema parses valid input', () => {
    const result = modelCallSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      provider: 'openai',
      model: 'gpt-4o',
      taskType: 'classify',
      promptVersion: 'v1',
      inputTokens: 100,
      outputTokens: 50,
      latencyMs: 320,
      resultStatus: 'success',
      createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('eventExtractionSchema accepts valid extraction', () => {
    const result = eventExtractionSchema.safeParse({
      events: [
        {
          type: 'earnings',
          title: 'AAPL Q1 Earnings Beat',
          summary: 'Apple reported Q1 revenue of $124B, beating estimates by 5%.',
          instruments: [
            { ticker: 'AAPL', relationType: 'primary', impactDirection: 'positive', impactConfidence: 0.9 },
          ],
          evidence: [
            { quote: 'Apple reported revenue of $124 billion, above analyst consensus of $118 billion.' },
          ],
          importanceScore: 0.8,
          confidenceScore: 0.95,
          noveltyScore: 0.6,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('eventExtractionSchema rejects event without evidence', () => {
    const result = eventExtractionSchema.safeParse({
      events: [
        {
          type: 'earnings',
          title: 'Test',
          summary: 'Test summary',
          instruments: [],
          evidence: [], // Must have at least 1
          importanceScore: 0.5,
          confidenceScore: 0.5,
          noveltyScore: 0.5,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('briefingCompositionSchema accepts valid briefing', () => {
    const result = briefingCompositionSchema.safeParse({
      marketOverview: 'Markets poised for cautious open.',
      items: [
        {
          eventType: 'earnings',
          headline: 'AAPL Q1 Earnings Beat Estimates',
          whyItMatters: 'Signals strong consumer demand.',
          whatToWatch: 'Guidance for Q2 during earnings call.',
          tickers: ['AAPL'],
          evidenceQuotes: ['Revenue of $124B vs $118B expected.'],
          importanceScore: 0.8,
          confidenceScore: 0.9,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('briefingCompositionSchema rejects empty items', () => {
    const result = briefingCompositionSchema.safeParse({
      marketOverview: 'Test',
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('judgeResultSchema accepts valid result', () => {
    const result = judgeResultSchema.safeParse({
      approved: true,
      issues: [],
      overallConfidence: 0.95,
    });
    expect(result.success).toBe(true);
  });

  it('judgeResultSchema accepts result with issues', () => {
    const result = judgeResultSchema.safeParse({
      approved: false,
      issues: [
        { field: 'headline', severity: 'warning', reason: 'Too vague' },
      ],
      overallConfidence: 0.4,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

describe('@marketbrain/ai prompts', () => {
  it('retrieves extraction prompt by task type', () => {
    const prompt = getPrompt('extract');
    expect(prompt.taskType).toBe('extract');
    expect(prompt.version).toBe('1.0.0');
    expect(prompt.system).toContain('financial event extraction');
  });

  it('retrieves briefing composition prompt', () => {
    const prompt = getPrompt('compose_briefing');
    expect(prompt.taskType).toBe('compose_briefing');
    expect(prompt.system).toContain('pre-market briefing');
  });

  it('retrieves judge prompt', () => {
    const prompt = getPrompt('judge');
    expect(prompt.taskType).toBe('judge');
    expect(prompt.system).toContain('quality judge');
  });

  it('throws for unknown task type', () => {
    expect(() => getPrompt('nonexistent' as any)).toThrow('No prompt registered');
  });

  it('extraction prompt builds user message', () => {
    const prompt = getPrompt<{ documentTitle: string; documentSource: string; documentText: string }>('extract');
    const msg = prompt.buildUserMessage({
      documentTitle: 'Q1 Earnings Report',
      documentSource: 'Reuters',
      documentText: 'Apple reported record revenue...',
    });
    expect(msg).toContain('Q1 Earnings Report');
    expect(msg).toContain('Reuters');
    expect(msg).toContain('Apple reported record revenue');
  });
});

// ---------------------------------------------------------------------------
// Evaluators — Fixtures
// ---------------------------------------------------------------------------

const sampleItems: ComposedBriefingItem[] = [
  {
    eventType: 'earnings',
    headline: 'Apple Q1 Earnings Beat Street Estimates by 5%',
    whyItMatters: 'Signals strong consumer demand despite macro headwinds.',
    whatToWatch: 'Guidance for Q2 and services revenue trajectory.',
    tickers: ['AAPL'],
    evidenceQuotes: ['Revenue of $124 billion, above analyst consensus of $118 billion.'],
    importanceScore: 0.8,
    confidenceScore: 0.9,
  },
  {
    eventType: 'regulatory',
    headline: 'Fed Holds Rates Steady, Signals Patience',
    whyItMatters: 'Removes near-term rate cut expectations.',
    whatToWatch: 'Next FOMC meeting and dot plot.',
    tickers: ['SPY'],
    evidenceQuotes: ['The committee decided to maintain the target range at 5.25-5.50 percent.'],
    importanceScore: 0.9,
    confidenceScore: 0.95,
  },
];

const sampleItemNoEvidence: ComposedBriefingItem = {
  eventType: 'macro',
  headline: 'Global Markets Rally on Trade Optimism',
  whyItMatters: 'Broad risk-on sentiment.',
  whatToWatch: 'Follow-through in Asian session.',
  tickers: ['EEM'],
  evidenceQuotes: [],
  importanceScore: 0.5,
  confidenceScore: 0.4,
};

const sampleEvents: EventExtraction['events'] = [
  {
    type: 'earnings',
    title: 'AAPL Q1 Beat',
    summary: 'Apple beat estimates.',
    instruments: [{ ticker: 'AAPL', relationType: 'primary', impactDirection: 'positive', impactConfidence: 0.9 }],
    evidence: [{ quote: 'Revenue of $124 billion, above analyst consensus of $118 billion.' }],
    importanceScore: 0.8,
    confidenceScore: 0.9,
    noveltyScore: 0.6,
  },
  {
    type: 'regulatory',
    title: 'Fed Holds',
    summary: 'Rates unchanged.',
    instruments: [{ ticker: 'SPY', relationType: 'broad', impactDirection: 'neutral', impactConfidence: 0.8 }],
    evidence: [
      { quote: 'The committee decided to maintain the target range at 5.25-5.50 percent.' },
      { quote: 'Economic activity has been expanding at a solid pace.' },
    ],
    importanceScore: 0.9,
    confidenceScore: 0.95,
    noveltyScore: 0.3,
  },
];

// ---------------------------------------------------------------------------
// Evaluators — Tests
// ---------------------------------------------------------------------------

describe('@marketbrain/ai evaluators', () => {
  describe('evalFactuality', () => {
    it('returns 1.0 when all items have evidence', () => {
      const result = evalFactuality(sampleItems);
      expect(result.name).toBe('factuality');
      expect(result.score).toBe(1);
      expect(result.details).toHaveLength(0);
    });

    it('returns partial score when some items lack evidence', () => {
      const result = evalFactuality([...sampleItems, sampleItemNoEvidence]);
      expect(result.score).toBeCloseTo(2 / 3);
      expect(result.details.length).toBeGreaterThan(0);
    });

    it('returns 0 for empty items', () => {
      const result = evalFactuality([]);
      expect(result.score).toBe(0);
    });
  });

  describe('evalCitationCoverage', () => {
    it('returns 1.0 when all source evidence is cited', () => {
      // sampleItems cite 2 of the 3 source quotes
      // Let's make items that cover all 3
      const itemsCoveringAll: ComposedBriefingItem[] = [
        {
          ...sampleItems[0]!,
          evidenceQuotes: ['Revenue of $124 billion, above analyst consensus of $118 billion.'],
        },
        {
          ...sampleItems[1]!,
          evidenceQuotes: [
            'The committee decided to maintain the target range at 5.25-5.50 percent.',
            'Economic activity has been expanding at a solid pace.',
          ],
        },
      ];
      const result = evalCitationCoverage(itemsCoveringAll, sampleEvents);
      expect(result.name).toBe('citation-coverage');
      expect(result.score).toBe(1);
    });

    it('returns partial score when not all evidence is covered', () => {
      // sampleItems cover 2 of 3 source quotes
      const result = evalCitationCoverage(sampleItems, sampleEvents);
      expect(result.score).toBeCloseTo(2 / 3);
    });

    it('returns 0 when no source events provided', () => {
      const result = evalCitationCoverage(sampleItems, []);
      expect(result.score).toBe(0);
    });
  });

  describe('evalHeadlineQuality', () => {
    it('returns 1.0 for good headlines', () => {
      const result = evalHeadlineQuality(sampleItems);
      expect(result.name).toBe('headline-quality');
      expect(result.score).toBe(1);
    });

    it('penalizes short headlines', () => {
      const bad: ComposedBriefingItem = { ...sampleItems[0]!, headline: 'Short' };
      const result = evalHeadlineQuality([bad]);
      expect(result.score).toBe(0);
      expect(result.details[0]).toContain('Too short');
    });

    it('penalizes generic prefixes', () => {
      const bad: ComposedBriefingItem = { ...sampleItems[0]!, headline: 'Breaking: Something happened in the market today' };
      const result = evalHeadlineQuality([bad]);
      expect(result.score).toBe(0);
      expect(result.details[0]).toContain('Generic prefix');
    });

    it('returns 0 for empty items', () => {
      const result = evalHeadlineQuality([]);
      expect(result.score).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Alert Schemas + Prompt
// ---------------------------------------------------------------------------

describe('@marketbrain/ai alert support', () => {
  describe('alertCardSchema', () => {
    it('accepts valid alert card', () => {
      const result = alertCardSchema.safeParse({
        title: 'AAPL beats Q4 earning estimates by 5%',
        summary: 'Strong demand signals sustained iOS revenue.',
        severityReasoning: 'High confidence with strong evidence.',
        tickers: ['AAPL'],
        eventType: 'earnings',
        evidenceQuotes: ['Revenue of $124B exceeded consensus by 3%.'],
        actionItems: ['Monitor Q2 guidance call', 'Review services growth'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing evidence', () => {
      const result = alertCardSchema.safeParse({
        title: 'Test',
        summary: 'Test',
        severityReasoning: 'Test',
        tickers: [],
        eventType: 'earnings',
        evidenceQuotes: [], // min 1 required
        actionItems: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects title over 200 chars', () => {
      const result = alertCardSchema.safeParse({
        title: 'A'.repeat(201),
        summary: 'Summary',
        severityReasoning: 'Reason',
        tickers: [],
        eventType: 'earnings',
        evidenceQuotes: ['quote'],
        actionItems: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('alert generation prompt', () => {
    it('registers and retrieves generate_alert prompt', () => {
      const prompt = getPrompt('generate_alert');
      expect(prompt.taskType).toBe('generate_alert');
      expect(prompt.version).toBe('1.0.0');
      expect(prompt.system).toContain('alert card generator');
    });

    it('builds user message with event details', () => {
      const prompt = getPrompt<{
        eventTitle: string;
        eventSummary: string;
        eventType: string;
        tickers: string[];
        evidenceQuotes: string[];
        importanceScore: number;
        confidenceScore: number;
        noveltyScore: number;
        severity: string;
      }>('generate_alert');

      const msg = prompt.buildUserMessage({
        eventTitle: 'AAPL Q4 Beat',
        eventSummary: 'Apple exceeded estimates.',
        eventType: 'earnings',
        tickers: ['AAPL'],
        evidenceQuotes: ['Revenue of $124B.'],
        importanceScore: 0.85,
        confidenceScore: 0.9,
        noveltyScore: 0.6,
        severity: 's1',
      });

      expect(msg).toContain('AAPL Q4 Beat');
      expect(msg).toContain('s1');
      expect(msg).toContain('Revenue of $124B.');
    });
  });

  describe('evalAlertPrecision', () => {
    const sampleCard: AlertCard = {
      title: 'AAPL beats estimates',
      summary: 'Strong demand.',
      severityReasoning: 'High confidence.',
      tickers: ['AAPL'],
      eventType: 'earnings',
      evidenceQuotes: ['Revenue of $124B.'],
      actionItems: ['Watch Q2'],
    };

    it('returns 1.0 when all delivered alerts are read', () => {
      const feedback: AlertFeedback[] = [
        { alertCard: sampleCard, status: 'read', clicked: true },
        { alertCard: sampleCard, status: 'read', clicked: false },
      ];
      const result = evalAlertPrecision(feedback);
      expect(result.name).toBe('alert-precision');
      expect(result.score).toBe(1);
    });

    it('returns 0 when all delivered alerts are dismissed', () => {
      const feedback: AlertFeedback[] = [
        { alertCard: sampleCard, status: 'dismissed', clicked: false },
      ];
      const result = evalAlertPrecision(feedback);
      expect(result.score).toBe(0);
    });

    it('returns 0.5 for half read, half dismissed', () => {
      const feedback: AlertFeedback[] = [
        { alertCard: sampleCard, status: 'read', clicked: true },
        { alertCard: sampleCard, status: 'dismissed', clicked: false },
      ];
      const result = evalAlertPrecision(feedback);
      expect(result.score).toBe(0.5);
    });

    it('ignores pending/sent alerts', () => {
      const feedback: AlertFeedback[] = [
        { alertCard: sampleCard, status: 'pending', clicked: false },
        { alertCard: sampleCard, status: 'sent', clicked: false },
        { alertCard: sampleCard, status: 'read', clicked: true },
      ];
      const result = evalAlertPrecision(feedback);
      expect(result.score).toBe(1); // Only 1 delivered (read), and it's useful
    });

    it('returns 0 for no feedback', () => {
      const result = evalAlertPrecision([]);
      expect(result.score).toBe(0);
    });
  });
});
