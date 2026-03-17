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

// ---------------------------------------------------------------------------
// Alert card generation output — model returns this for alert cards
// ---------------------------------------------------------------------------

/** Output schema for alert card generation from an event. */
export const alertCardSchema = z.object({
  title: z.string().max(200).describe('Concise alert headline'),
  summary: z.string().max(500).describe('One-sentence importance statement'),
  severityReasoning: z
    .string()
    .max(300)
    .describe('Brief reasoning for the assigned severity level'),
  tickers: z.array(z.string()).describe('Affected ticker symbols'),
  eventType: z.string().describe('Event category: earnings, regulatory, macro, product, etc.'),
  evidenceQuotes: z.array(z.string()).min(1).describe('Key quotes supporting this alert'),
  actionItems: z
    .array(z.string())
    .max(3)
    .describe('Suggested next actions for the investor'),
});

export type AlertCard = z.infer<typeof alertCardSchema>;

// ---------------------------------------------------------------------------
// Research answer output — structured answer blocks for interactive research
// ---------------------------------------------------------------------------

/** A single evidence block within a research answer. */
export const researchEvidenceBlockSchema = z.object({
  claim: z.string().describe('The specific claim being supported'),
  quote: z.string().describe('Verbatim quote from source'),
  source: z.string().describe('Source document or tool name'),
  confidence: z.number().min(0).max(1).describe('Confidence in this evidence'),
});

export type ResearchEvidenceBlock = z.infer<typeof researchEvidenceBlockSchema>;

/** Full structured answer from the research model. */
export const researchAnswerSchema = z.object({
  coreConclusion: z.string().max(1000).describe('The main answer to the user question'),
  supportingEvidence: z
    .array(researchEvidenceBlockSchema)
    .min(1)
    .describe('Evidence supporting the conclusion'),
  counterEvidence: z
    .array(researchEvidenceBlockSchema)
    .describe('Evidence that contradicts or qualifies the conclusion'),
  catalysts: z
    .array(z.string().max(300))
    .describe('Key upcoming catalysts that could change the picture'),
  uncertainties: z
    .array(z.string().max(300))
    .describe('Areas of uncertainty or insufficient evidence'),
  followUps: z
    .array(z.string().max(200))
    .describe('Suggested follow-up questions for deeper analysis'),
});

export type ResearchAnswer = z.infer<typeof researchAnswerSchema>;

// ---------------------------------------------------------------------------
// Intent classification output — parse user query into research plan
// ---------------------------------------------------------------------------

export const researchIntentSchema = z.object({
  mode: z.enum(['single_instrument', 'theme', 'comparison', 'freeform']),
  tickers: z.array(z.string()).describe('Tickers mentioned in the query'),
  topics: z.array(z.string()).describe('Key topics or themes to investigate'),
  toolsNeeded: z
    .array(z.enum(['search_documents', 'get_price_snapshot', 'get_company_profile']))
    .describe('Which tools the research plan should use'),
  searchQueries: z
    .array(z.string())
    .max(5)
    .describe('Concrete search queries to gather evidence'),
});

export type ResearchIntent = z.infer<typeof researchIntentSchema>;
