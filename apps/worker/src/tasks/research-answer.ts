/**
 * Research Answer Task — orchestrates the research pipeline:
 *
 * 1. Classify user intent (mode, tickers, tools needed, search queries)
 * 2. Retrieve evidence via search queries
 * 3. Generate structured answer with evidence-backed blocks
 * 4. Gate the answer for quality
 * 5. Persist the answer as a research message
 */
import { task } from '@trigger.dev/sdk/v3';
import { prisma } from '@marketbrain/db';
import {
  ModelGateway,
  type ProviderConfig,
  type ProviderId,
  researchAnswerSchema,
  researchIntentSchema,
  type ResearchAnswer,
  type ResearchIntent,
  type ResearchInput,
  type IntentClassificationInput,
  getPrompt,
} from '@marketbrain/ai';
import { gateResearchAnswer, computeResearchQuality, isEvidenceSufficient } from '@marketbrain/domain';

export interface ResearchAnswerPayload {
  sessionId: string;
  messageId: string;
  question: string;
  provider?: ProviderId;
}

export interface ResearchAnswerResult {
  sessionId: string;
  messageId: string;
  answer: ResearchAnswer | null;
  intent: ResearchIntent | null;
  passed: boolean;
  qualityScore: number;
  failures: string[];
}

export const researchAnswerTask = task({
  id: 'research-answer',
  retry: { maxAttempts: 2 },
  run: async (payload: ResearchAnswerPayload): Promise<ResearchAnswerResult> => {
    const { sessionId, messageId, question, provider } = payload;
    const gateway = buildGateway(provider);

    // 1. Load session context (previous messages for multi-turn)
    const session = await prisma.researchSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 20 },
      },
    });

    const conversationHistory = session.messages
      .filter((m) => m.id !== messageId)
      .map((m) => ({ role: m.role, content: m.content }));

    // 2. Classify intent
    const intentPrompt = getPrompt<IntentClassificationInput>('classify', '1.0.0');

    // Get available tickers from user's watchlists
    const watchlistItems = await prisma.watchlistItem.findMany({
      where: { watchlist: { userId: session.userId } },
      include: { instrument: true },
    });
    const availableTickers = watchlistItems.map((wi) => wi.instrument.ticker);

    const intentResult = await gateway.extractObject({
      taskType: 'classify',
      schema: researchIntentSchema,
      prompt: intentPrompt.buildUserMessage({ question, availableTickers }),
      system: intentPrompt.system,
      options: { provider, temperature: 0 },
    });

    const intent = intentResult.data;

    // Update session mode based on classified intent
    await prisma.researchSession.update({
      where: { id: sessionId },
      data: { mode: intent.mode },
    });

    // 3. Retrieve evidence via search queries (simulate document search)
    const retrievedEvidence: Array<{ source: string; text: string }> = [];

    for (const query of intent.searchQueries) {
      const docs = await prisma.documentChunk.findMany({
        where: {
          text: { contains: query.split(' ')[0] ?? '', mode: 'insensitive' },
        },
        include: { document: true },
        take: 3,
      });

      for (const chunk of docs) {
        retrievedEvidence.push({
          source: chunk.document.title ?? chunk.documentId,
          text: chunk.text.slice(0, 500),
        });
      }
    }

    // 4. Gather price snapshots and company profiles if tools are needed
    const priceSnapshots: Array<{ ticker: string; price: number; changePercent: number }> = [];
    const companyProfiles: Array<{ ticker: string; name: string; sector: string | null }> = [];

    if (intent.toolsNeeded.includes('get_price_snapshot')) {
      for (const ticker of intent.tickers) {
        const instrument = await prisma.instrument.findFirst({
          where: { ticker: { equals: ticker, mode: 'insensitive' } },
        });
        if (instrument) {
          priceSnapshots.push({
            ticker: instrument.ticker,
            price: 0,
            changePercent: 0,
          });
        }
      }
    }

    if (intent.toolsNeeded.includes('get_company_profile')) {
      for (const ticker of intent.tickers) {
        const instrument = await prisma.instrument.findFirst({
          where: { ticker: { equals: ticker, mode: 'insensitive' } },
        });
        if (instrument) {
          companyProfiles.push({
            ticker: instrument.ticker,
            name: instrument.name,
            sector: instrument.sector ?? null,
          });
        }
      }
    }

    // 5. Generate structured research answer
    const researchPrompt = getPrompt<ResearchInput>('research_answer');

    const researchResult = await gateway.extractObject({
      taskType: 'research_answer',
      schema: researchAnswerSchema,
      prompt: researchPrompt.buildUserMessage({
        question,
        mode: intent.mode,
        tickers: intent.tickers,
        conversationHistory,
        retrievedEvidence,
        priceSnapshots: priceSnapshots.length > 0 ? priceSnapshots : undefined,
        companyProfiles: companyProfiles.length > 0 ? companyProfiles : undefined,
      }),
      system: researchPrompt.system,
      options: { provider, temperature: 0.2 },
    });

    const answer = researchResult.data;

    // 6. Gate the answer
    const gate = gateResearchAnswer(answer);
    if (!gate.passed) {
      // Store a system message noting the gate failure
      await prisma.researchMessage.create({
        data: {
          sessionId,
          role: 'system',
          content: `Research answer failed quality gate: ${gate.failures.join('; ')}`,
          renderedBlocks: [],
          evidenceIds: [],
        },
      });
      return {
        sessionId,
        messageId,
        answer: null,
        intent,
        passed: false,
        qualityScore: 0,
        failures: gate.failures,
      };
    }

    // 7. Compute quality score
    const avgConfidence =
      answer.supportingEvidence.length > 0
        ? answer.supportingEvidence.reduce((s, e) => s + e.confidence, 0) /
          answer.supportingEvidence.length
        : 0;

    const qualityScore = computeResearchQuality({
      evidenceCount: answer.supportingEvidence.length,
      hasCounterEvidence: answer.counterEvidence.length > 0,
      hasCatalysts: answer.catalysts.length > 0,
      hasUncertainties: answer.uncertainties.length > 0,
      avgEvidenceConfidence: avgConfidence,
    });

    // 8. Persist assistant message with rendered blocks and evidence IDs
    const evidenceIds: string[] = [];

    // Create evidence records from the answer
    for (const ev of [...answer.supportingEvidence, ...answer.counterEvidence]) {
      const evidence = await prisma.evidence.create({
        data: {
          quote: ev.quote,
          locator: ev.source,
          evidenceType: 'primary',
          confidence: ev.confidence,
        },
      });
      evidenceIds.push(evidence.id);
    }

    await prisma.researchMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: answer.coreConclusion,
        renderedBlocks: answer as unknown as object,
        evidenceIds,
      },
    });

    // Update session title if first answer
    if (!session.title && answer.coreConclusion.length > 0) {
      const title = answer.coreConclusion.length > 80
        ? answer.coreConclusion.slice(0, 77) + '...'
        : answer.coreConclusion;
      await prisma.researchSession.update({
        where: { id: sessionId },
        data: { title },
      });
    }

    return {
      sessionId,
      messageId,
      answer,
      intent,
      passed: true,
      qualityScore,
      failures: [],
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

  const defaultProvider: ProviderId =
    preferredProvider ??
    (process.env.OPENAI_API_KEY
      ? 'openai'
      : process.env.ANTHROPIC_API_KEY
        ? 'anthropic'
        : 'google');

  return new ModelGateway({ defaultProvider, providers });
}
