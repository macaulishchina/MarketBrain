/**
 * Prompt Registry — versioned prompt templates for all AI tasks.
 *
 * Each prompt is a plain object with a version, system message, and
 * user message builder. Prompts are repo assets, not runtime config.
 */

import { type TaskType } from '../schemas/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PromptTemplate<TInput = unknown> {
  taskType: TaskType;
  version: string;
  name: string;
  system: string;
  buildUserMessage: (input: TInput) => string;
}

// ---------------------------------------------------------------------------
// Event Extraction Prompt
// ---------------------------------------------------------------------------

export interface ExtractionInput {
  documentTitle: string;
  documentSource: string;
  documentText: string;
  publishedAt?: string;
}

export const eventExtractionPrompt: PromptTemplate<ExtractionInput> = {
  taskType: 'extract',
  version: '1.0.0',
  name: 'event-extraction-v1',
  system: `You are a financial event extraction engine. Your job is to extract structured events from financial documents.

Rules:
- Extract only factual events that are clearly stated in the document.
- Each event MUST have at least one evidence quote taken verbatim from the source.
- Assign importanceScore based on market impact potential (0=trivial, 1=market-moving).
- Assign confidenceScore based on source reliability and clarity (0=speculative, 1=confirmed).
- Assign noveltyScore based on how new/unexpected this is (0=widely known, 1=breaking).
- Resolve ticker symbols where possible. Use common US exchange tickers.
- Do NOT hallucinate events or facts not present in the document.
- Keep headlines under 200 characters and summaries under 500 characters.`,

  buildUserMessage: (input) =>
    `Extract financial events from this document.

Title: ${input.documentTitle}
Source: ${input.documentSource}
${input.publishedAt ? `Published: ${input.publishedAt}` : ''}

---
${input.documentText}
---

Extract all significant financial events from the above document.`,
};

// ---------------------------------------------------------------------------
// Briefing Composition Prompt
// ---------------------------------------------------------------------------

export interface BriefingInput {
  market: string;
  tradingDate: string;
  events: Array<{
    title: string;
    summary: string;
    type: string;
    tickers: string[];
    importanceScore: number;
    confidenceScore: number;
    evidence: string[];
  }>;
  watchlistTickers?: string[];
}

export const briefingCompositionPrompt: PromptTemplate<BriefingInput> = {
  taskType: 'compose_briefing',
  version: '1.0.0',
  name: 'briefing-composition-v1',
  system: `You are a pre-market briefing composer for professional investors.

Your job is to synthesize extracted events into a concise, actionable pre-market briefing.

Rules:
- Output 6-10 items maximum, ranked by importance × relevance.
- Each item must have a clear headline, "why it matters", and "what to watch".
- Every claim must be backed by at least one evidence quote from the source events.
- Do NOT include events with confidenceScore below 0.3.
- Do NOT speculate beyond what the evidence supports.
- If the user has a watchlist, prioritize events affecting those tickers.
- Market overview should be 1-2 sentences of context.
- Headlines must be under 200 characters.`,

  buildUserMessage: (input) => {
    const eventBlock = input.events
      .map(
        (e, i) =>
          `[Event ${i + 1}] ${e.title}
Type: ${e.type}
Tickers: ${e.tickers.join(', ') || 'None'}
Importance: ${e.importanceScore} | Confidence: ${e.confidenceScore}
Summary: ${e.summary}
Evidence: ${e.evidence.map((q) => `"${q}"`).join('; ')}`,
      )
      .join('\n\n');

    return `Compose a pre-market briefing for ${input.market} on ${input.tradingDate}.

${input.watchlistTickers?.length ? `User watchlist: ${input.watchlistTickers.join(', ')}\n` : ''}
Events to consider:

${eventBlock}

Synthesize the above into a ranked briefing.`;
  },
};

// ---------------------------------------------------------------------------
// Judge / Verification Prompt
// ---------------------------------------------------------------------------

export interface JudgeInput {
  itemType: string;
  content: Record<string, unknown>;
  evidenceQuotes: string[];
}

export const judgePrompt: PromptTemplate<JudgeInput> = {
  taskType: 'judge',
  version: '1.0.0',
  name: 'judge-v1',
  system: `You are a quality judge for financial AI outputs. Check whether the content meets publication standards.

Check for:
1. Factual consistency — does every claim have supporting evidence?
2. Evidence coverage — are key conclusions backed by quotes?
3. Ticker accuracy — are the tickers correct and relevant?
4. Hallucination — is anything stated that isn't in the evidence?
5. Completeness — are required fields present and well-formed?

Be strict. If in doubt, flag it.`,

  buildUserMessage: (input) =>
    `Review this ${input.itemType} for publication readiness.

Content:
${JSON.stringify(input.content, null, 2)}

Available evidence quotes:
${input.evidenceQuotes.map((q, i) => `[${i + 1}] "${q}"`).join('\n')}

Judge whether this is ready to publish.`,
};

// ---------------------------------------------------------------------------
// Alert Card Generation Prompt
// ---------------------------------------------------------------------------

export interface AlertGenerationInput {
  eventTitle: string;
  eventSummary: string;
  eventType: string;
  tickers: string[];
  evidenceQuotes: string[];
  importanceScore: number;
  confidenceScore: number;
  noveltyScore: number;
  severity: string;
}

export const alertGenerationPrompt: PromptTemplate<AlertGenerationInput> = {
  taskType: 'generate_alert',
  version: '1.0.0',
  name: 'alert-generation-v1',
  system: `You are a financial alert card generator. Your job is to create concise, actionable alert cards from detected market events.

Rules:
- Title must be under 200 characters, clear and informative.
- Summary must be a single sentence explaining why this matters to an investor.
- Provide brief reasoning for the severity level assigned.
- Include only tickers that are directly affected by the event.
- Evidence quotes must be verbatim from the source — do NOT fabricate quotes.
- Action items should be specific, actionable, and limited to 3 items max.
- Do NOT speculate beyond what the evidence supports.
- Keep language professional and concise.`,

  buildUserMessage: (input) =>
    `Generate an alert card for this market event.

Event: ${input.eventTitle}
Type: ${input.eventType}
Severity: ${input.severity}
Tickers: ${input.tickers.join(', ') || 'None'}
Importance: ${input.importanceScore} | Confidence: ${input.confidenceScore} | Novelty: ${input.noveltyScore}

Summary: ${input.eventSummary}

Evidence:
${input.evidenceQuotes.map((q, i) => `[${i + 1}] "${q}"`).join('\n')}

Generate a concise alert card for this event.`,
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry = new Map<string, PromptTemplate<any>>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function register(prompt: PromptTemplate<any>): void {
  const key = `${prompt.taskType}:${prompt.version}`;
  registry.set(key, prompt);
  // Also register as "latest" for task type
  registry.set(`${prompt.taskType}:latest`, prompt);
}

// Register all built-in prompts
register(eventExtractionPrompt);
register(briefingCompositionPrompt);
register(judgePrompt);
register(alertGenerationPrompt);

/** Get a prompt by task type and version. Defaults to latest. */
export function getPrompt<TInput = unknown>(
  taskType: TaskType,
  version = 'latest',
): PromptTemplate<TInput> {
  const key = `${taskType}:${version}`;
  const prompt = registry.get(key);
  if (!prompt) {
    throw new Error(`No prompt registered for ${key}`);
  }
  return prompt as PromptTemplate<TInput>;
}
