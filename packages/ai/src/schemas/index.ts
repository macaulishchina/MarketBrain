import { z } from 'zod';

/** Task types that the model gateway can handle. */
export const TaskType = {
  CLASSIFY: 'classify',
  EXTRACT: 'extract',
  SUMMARIZE: 'summarize',
  COMPOSE_BRIEFING: 'compose_briefing',
  GENERATE_ALERT: 'generate_alert',
  RESEARCH_ANSWER: 'research_answer',
  JUDGE: 'judge',
} as const;

export type TaskType = (typeof TaskType)[keyof typeof TaskType];

/** Schema for a model call record (AI-specific audit trail). */
export const modelCallSchema = z.object({
  id: z.string().uuid(),
  provider: z.string(),
  model: z.string(),
  taskType: z.string(),
  promptVersion: z.string(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  latencyMs: z.number().nonnegative(),
  cost: z.number().nonnegative().optional(),
  resultStatus: z.enum(['success', 'error', 'fallback']),
  createdAt: z.date(),
});

export type ModelCall = z.infer<typeof modelCallSchema>;

// ---------------------------------------------------------------------------
// Event extraction output — model returns this from raw documents
// ---------------------------------------------------------------------------

/** A single instrument mention extracted by the model. */
export const extractedInstrumentSchema = z.object({
  ticker: z.string().describe('Stock ticker symbol, e.g. AAPL'),
  exchange: z.string().optional().describe('Exchange code, e.g. NASDAQ'),
  relationType: z.string().describe('How this instrument relates to the event'),
  impactDirection: z.enum(['positive', 'negative', 'neutral', 'unknown']),
  impactConfidence: z.number().min(0).max(1),
});

export type ExtractedInstrument = z.infer<typeof extractedInstrumentSchema>;

/** A single evidence citation extracted by the model. */
export const extractedEvidenceSchema = z.object({
  quote: z.string().describe('Verbatim quote from the source document'),
  locator: z.string().optional().describe('Page, paragraph, or section locator'),
  documentId: z.string().optional().describe('If known, the document ID'),
});

export type ExtractedEvidence = z.infer<typeof extractedEvidenceSchema>;

/** Full event extraction result from a single document. */
export const eventExtractionSchema = z.object({
  events: z.array(
    z.object({
      type: z.string().describe('Event category: earnings, regulatory, macro, product, etc.'),
      title: z.string().max(200).describe('Concise event headline'),
      summary: z.string().max(500).describe('Brief factual summary'),
      occurredAt: z.string().optional().describe('ISO date string when the event happened'),
      instruments: z.array(extractedInstrumentSchema),
      evidence: z.array(extractedEvidenceSchema).min(1),
      importanceScore: z.number().min(0).max(1).describe('How important is this event (0-1)'),
      confidenceScore: z.number().min(0).max(1).describe('How confident are you (0-1)'),
      noveltyScore: z.number().min(0).max(1).describe('How novel is this vs recent events (0-1)'),
    }),
  ),
});

export type EventExtraction = z.infer<typeof eventExtractionSchema>;

// ---------------------------------------------------------------------------
// Briefing composition output — model returns this for daily briefing
// ---------------------------------------------------------------------------

/** A single briefing item composed by the model. */
export const composedBriefingItemSchema = z.object({
  eventType: z.string(),
  headline: z.string().max(200).describe('One-line headline'),
  whyItMatters: z.string().max(500).describe('Why this matters to the investor'),
  whatToWatch: z.string().max(300).describe('What to watch today'),
  tickers: z.array(z.string()).describe('Affected tickers'),
  evidenceQuotes: z.array(z.string()).describe('Key supporting quotes'),
  importanceScore: z.number().min(0).max(1),
  confidenceScore: z.number().min(0).max(1),
});

export type ComposedBriefingItem = z.infer<typeof composedBriefingItemSchema>;

/** Full briefing composition result. */
export const briefingCompositionSchema = z.object({
  marketOverview: z.string().max(500).describe('1-2 sentence market context'),
  items: z
    .array(composedBriefingItemSchema)
    .min(1)
    .max(12)
    .describe('Ranked briefing items, max 12'),
});

export type BriefingComposition = z.infer<typeof briefingCompositionSchema>;

// ---------------------------------------------------------------------------
// Judge / verification output
// ---------------------------------------------------------------------------

export const judgeResultSchema = z.object({
  approved: z.boolean(),
  issues: z.array(
    z.object({
      field: z.string(),
      severity: z.enum(['critical', 'warning', 'info']),
      reason: z.string(),
    }),
  ),
  overallConfidence: z.number().min(0).max(1),
});

export type JudgeResult = z.infer<typeof judgeResultSchema>;
