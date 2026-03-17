/**
 * Extract Events Task — uses the AI model gateway to extract structured
 * events from financial documents.
 */
import { task } from '@trigger.dev/sdk/v3';
import {
  ModelGateway,
  type ProviderConfig,
  type ProviderId,
  eventExtractionSchema,
  type EventExtraction,
  type ExtractionInput,
  getPrompt,
} from '@marketbrain/ai';

export interface ExtractEventsPayload {
  documents: Array<{
    id: string;
    title: string;
    source: string;
    text: string;
    publishedAt?: string;
  }>;
  provider?: ProviderId;
}

export interface ExtractEventsResult {
  extractions: Array<{
    documentId: string;
    events: EventExtraction['events'];
    usage: { inputTokens: number; outputTokens: number; latencyMs: number };
  }>;
}

export const extractEventsTask = task({
  id: 'extract-events',
  retry: { maxAttempts: 2 },
  run: async (payload: ExtractEventsPayload): Promise<ExtractEventsResult> => {
    const gateway = buildGateway(payload.provider);
    const prompt = getPrompt<ExtractionInput>('extract');

    const extractions: ExtractEventsResult['extractions'] = [];

    for (const doc of payload.documents) {
      const userMessage = prompt.buildUserMessage({
        documentTitle: doc.title,
        documentSource: doc.source,
        documentText: doc.text.slice(0, 12000), // Cap context size
        publishedAt: doc.publishedAt,
      });

      const result = await gateway.extractObject({
        taskType: 'extract',
        schema: eventExtractionSchema,
        prompt: userMessage,
        system: prompt.system,
        options: { provider: payload.provider, temperature: 0 },
      });

      extractions.push({
        documentId: doc.id,
        events: result.data.events,
        usage: result.usage,
      });
    }

    return { extractions };
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
