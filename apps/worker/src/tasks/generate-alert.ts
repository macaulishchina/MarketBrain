/**
 * Generate Alert Task — uses the AI model gateway to generate an alert card
 * from a pending alert + its event data.
 *
 * After card generation, the alert metadata (title stored on event) is updated
 * and the alert status moves from pending → sent.
 */
import { task } from '@trigger.dev/sdk/v3';
import { prisma } from '@marketbrain/db';
import {
  ModelGateway,
  type ProviderConfig,
  type ProviderId,
  alertCardSchema,
  type AlertCard,
  type AlertGenerationInput,
  getPrompt,
} from '@marketbrain/ai';
import { gateAlert } from '@marketbrain/domain';

export interface GenerateAlertPayload {
  alertId: string;
  provider?: ProviderId;
}

export interface GenerateAlertResult {
  alertId: string;
  card: AlertCard | null;
  passed: boolean;
  failures: string[];
}

export const generateAlertTask = task({
  id: 'generate-alert',
  retry: { maxAttempts: 2 },
  run: async (payload: GenerateAlertPayload): Promise<GenerateAlertResult> => {
    const { alertId, provider } = payload;

    // 1. Fetch alert with event and evidence
    const alert = await prisma.alert.findUniqueOrThrow({
      where: { id: alertId },
      include: {
        event: {
          include: {
            instruments: { include: { instrument: true } },
          },
        },
      },
    });

    const event = alert.event;
    const tickers = event.instruments.map((ei) => ei.instrument.ticker);

    // 2. Gather evidence quotes from briefing items
    const briefingItems = await prisma.briefingItem.findMany({
      where: { eventId: event.id },
      take: 5,
    });

    const evidenceQuotes: string[] = briefingItems.flatMap(
      (bi) => (bi.evidenceIds as string[]) ?? [],
    );

    // 3. Generate alert card via model gateway
    const gateway = buildGateway(provider);
    const prompt = getPrompt<AlertGenerationInput>('generate_alert');

    const userMessage = prompt.buildUserMessage({
      eventTitle: event.title,
      eventSummary: event.summary ?? '',
      eventType: event.type,
      tickers,
      evidenceQuotes: evidenceQuotes.length > 0 ? evidenceQuotes : [event.summary ?? event.title],
      importanceScore: event.importanceScore ?? 0,
      confidenceScore: event.confidenceScore ?? 0,
      noveltyScore: event.noveltyScore ?? 0,
      severity: alert.severity,
    });

    const result = await gateway.extractObject({
      taskType: 'generate_alert',
      schema: alertCardSchema,
      prompt: userMessage,
      system: prompt.system,
      options: { provider, temperature: 0 },
    });

    const card = result.data;

    // 4. Gate the alert card
    const gate = gateAlert({
      title: card.title,
      summary: card.summary,
      evidenceQuotes: card.evidenceQuotes,
      confidenceScore: event.confidenceScore ?? 0,
      tickers: card.tickers,
    });

    if (!gate.passed) {
      // Dismiss ungated alerts
      await prisma.alert.update({
        where: { id: alertId },
        data: { status: 'dismissed' },
      });
      return { alertId, card: null, passed: false, failures: gate.failures };
    }

    // 5. Update alert status to sent and store card metadata
    await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });

    // Store alert card info on the event metadata for display
    await prisma.event.update({
      where: { id: event.id },
      data: {
        metadata: {
          alertCard: {
            title: card.title,
            summary: card.summary,
            severityReasoning: card.severityReasoning,
            actionItems: card.actionItems,
          },
        },
      },
    });

    return { alertId, card, passed: true, failures: [] };
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

  const defaultProvider: ProviderId =
    preferredProvider ??
    (process.env.OPENAI_API_KEY
      ? 'openai'
      : process.env.ANTHROPIC_API_KEY
        ? 'anthropic'
        : 'google');

  return new ModelGateway({ defaultProvider, providers });
}
