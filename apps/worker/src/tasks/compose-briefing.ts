/**
 * Compose Briefing Task — takes extracted events and composes a ranked
 * pre-market briefing using the AI model gateway.
 */
import { task } from '@trigger.dev/sdk/v3';
import {
  ModelGateway,
  type ProviderConfig,
  type ProviderId,
  briefingCompositionSchema,
  type BriefingComposition,
  type BriefingInput,
  getPrompt,
} from '@marketbrain/ai';
import {
  computeMateriality,
  computeRelevance,
  computeRankScore,
  gateBriefing,
} from '@marketbrain/domain';

export interface ComposeBriefingPayload {
  market: string;
  tradingDate: string;
  events: Array<{
    title: string;
    summary: string;
    type: string;
    tickers: string[];
    importanceScore: number;
    confidenceScore: number;
    noveltyScore: number;
    evidence: string[];
  }>;
  watchlistTickers?: string[];
  provider?: ProviderId;
}

export interface ComposeBriefingResult {
  composition: BriefingComposition;
  publishableItems: BriefingComposition['items'];
  rejectedItems: Array<{ item: BriefingComposition['items'][number]; failures: string[] }>;
  passed: boolean;
  usage: { inputTokens: number; outputTokens: number; latencyMs: number };
}

export const composeBriefingTask = task({
  id: 'compose-briefing',
  retry: { maxAttempts: 2 },
  run: async (payload: ComposeBriefingPayload): Promise<ComposeBriefingResult> => {
    // 1. Pre-filter: drop low-confidence events
    const filtered = payload.events.filter((e) => e.confidenceScore >= 0.3);

    // 2. Score and rank events
    const scored = filtered.map((e) => {
      const materiality = computeMateriality({
        importanceScore: e.importanceScore,
        confidenceScore: e.confidenceScore,
        noveltyScore: e.noveltyScore,
      });
      const relevance = computeRelevance({
        eventTickers: e.tickers,
        watchlistTickers: payload.watchlistTickers ?? [],
      });
      const rank = computeRankScore({ materiality, relevance });
      return { ...e, materiality, relevance, rank };
    });

    // 3. Sort by rank and take top events
    scored.sort((a, b) => b.rank - a.rank);
    const topEvents = scored.slice(0, 15); // Give model some extra to choose from

    // 4. Compose via AI
    const gateway = buildGateway(payload.provider);
    const prompt = getPrompt<BriefingInput>('compose_briefing');

    const userMessage = prompt.buildUserMessage({
      market: payload.market,
      tradingDate: payload.tradingDate,
      events: topEvents.map((e) => ({
        title: e.title,
        summary: e.summary,
        type: e.type,
        tickers: e.tickers,
        importanceScore: e.importanceScore,
        confidenceScore: e.confidenceScore,
        evidence: e.evidence,
      })),
      watchlistTickers: payload.watchlistTickers,
    });

    const result = await gateway.extractObject({
      taskType: 'compose_briefing',
      schema: briefingCompositionSchema,
      prompt: userMessage,
      system: prompt.system,
      options: { provider: payload.provider },
    });

    // 5. Run guardrails
    const gateResult = gateBriefing({
      marketOverview: result.data.marketOverview,
      items: result.data.items,
    });

    return {
      composition: result.data,
      publishableItems: gateResult.publishableItems as BriefingComposition['items'],
      rejectedItems: gateResult.rejectedItems as ComposeBriefingResult['rejectedItems'],
      passed: gateResult.passed,
      usage: result.usage,
    };
  },
});

function buildGateway(preferredProvider?: ProviderId): ModelGateway {
  const providers: Partial<Record<ProviderId, ProviderConfig>> = {};

  if (process.env.OPENAI_API_KEY) {
    providers.openai = { apiKey: process.env.OPENAI_API_KEY, enabled: true };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    providers.anthropic = { apiKey: process.env.ANTHROPIC_API_KEY, enabled: true };
  }
  if (process.env.GOOGLE_AI_API_KEY) {
    providers.google = { apiKey: process.env.GOOGLE_AI_API_KEY, enabled: true };
  }

  const defaultProvider: ProviderId = preferredProvider
    ?? (process.env.OPENAI_API_KEY ? 'openai'
      : process.env.ANTHROPIC_API_KEY ? 'anthropic'
      : 'google');

  return new ModelGateway({ defaultProvider, providers });
}
