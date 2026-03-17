export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { auth } from '../../../../../lib/auth';
import {
  ModelGateway,
  type ProviderConfig,
  type ProviderId,
  researchAnswerSchema,
  researchIntentSchema,
  type ResearchInput,
  type IntentClassificationInput,
  getPrompt,
} from '@marketbrain/ai';
import { gateResearchAnswer, computeResearchQuality } from '@marketbrain/domain';
import { z } from 'zod';
import { featureFlags } from '@marketbrain/config';

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

/** POST /api/research/[id]/messages — send a message and get AI response */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!featureFlags.interactiveResearch) {
    return NextResponse.json({ error: 'Interactive research is currently disabled' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Verify session ownership
  const researchSession = await prisma.researchSession.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 20 },
    },
  });

  if (!researchSession || researchSession.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (researchSession.status !== 'active') {
    return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { content } = parsed.data;

  try {
    // 1. Persist user message
  const userMessage = await prisma.researchMessage.create({
    data: {
      sessionId: id,
      role: 'user',
      content,
      renderedBlocks: [],
      evidenceIds: [],
    },
  });

  // 2. Classify intent
  const gateway = buildGateway();
  const intentPrompt = getPrompt<IntentClassificationInput>('classify', '1.0.0');

  const watchlistItems = await prisma.watchlistItem.findMany({
    where: { watchlist: { userId: session.user.id } },
    include: { instrument: true },
  });
  const availableTickers = watchlistItems.map((wi) => wi.instrument.ticker);

  const intentResult = await gateway.extractObject({
    taskType: 'classify',
    schema: researchIntentSchema,
    prompt: intentPrompt.buildUserMessage({ question: content, availableTickers }),
    system: intentPrompt.system,
    options: { temperature: 0 },
  });

  const intent = intentResult.data;

  // Update session mode
  await prisma.researchSession.update({
    where: { id },
    data: { mode: intent.mode },
  });

  // 3. Retrieve evidence
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

  // 4. Gather price/profile context
  const priceSnapshots: Array<{ ticker: string; price: number; changePercent: number }> = [];
  const companyProfiles: Array<{ ticker: string; name: string; sector: string | null }> = [];

  for (const ticker of intent.tickers) {
    const instrument = await prisma.instrument.findFirst({
      where: { ticker: { equals: ticker, mode: 'insensitive' } },
    });
    if (instrument) {
      if (intent.toolsNeeded.includes('get_price_snapshot')) {
        priceSnapshots.push({ ticker: instrument.ticker, price: 0, changePercent: 0 });
      }
      if (intent.toolsNeeded.includes('get_company_profile')) {
        companyProfiles.push({
          ticker: instrument.ticker,
          name: instrument.name,
          sector: instrument.sector ?? null,
        });
      }
    }
  }

  // 5. Build conversation history
  const conversationHistory = researchSession.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // 6. Generate structured answer
  const researchPrompt = getPrompt<ResearchInput>('research_answer');

  const researchResult = await gateway.extractObject({
    taskType: 'research_answer',
    schema: researchAnswerSchema,
    prompt: researchPrompt.buildUserMessage({
      question: content,
      mode: intent.mode,
      tickers: intent.tickers,
      conversationHistory,
      retrievedEvidence,
      priceSnapshots: priceSnapshots.length > 0 ? priceSnapshots : undefined,
      companyProfiles: companyProfiles.length > 0 ? companyProfiles : undefined,
    }),
    system: researchPrompt.system,
    options: { temperature: 0.2 },
  });

  const answer = researchResult.data;

  // 7. Gate the answer
  const gate = gateResearchAnswer(answer);

  // 8. Persist evidence records
  const evidenceIds: string[] = [];
  if (gate.passed) {
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
  }

  // 9. Persist assistant message
  const assistantMessage = await prisma.researchMessage.create({
    data: {
      sessionId: id,
      role: 'assistant',
      content: gate.passed ? answer.coreConclusion : `Unable to generate a quality answer. ${gate.failures.join('; ')}`,
      renderedBlocks: gate.passed ? (answer as unknown as object) : {},
      evidenceIds,
    },
  });

  // 10. Update session title if first real answer
  if (!researchSession.title && gate.passed && answer.coreConclusion.length > 0) {
    const title =
      content.length > 80 ? content.slice(0, 77) + '...' : content;
    await prisma.researchSession.update({
      where: { id },
      data: { title },
    });
  }

  // 11. Compute quality metrics
  const avgConfidence =
    answer.supportingEvidence.length > 0
      ? answer.supportingEvidence.reduce((s, e) => s + e.confidence, 0) /
        answer.supportingEvidence.length
      : 0;

  const qualityScore = gate.passed
    ? computeResearchQuality({
        evidenceCount: answer.supportingEvidence.length,
        hasCounterEvidence: answer.counterEvidence.length > 0,
        hasCatalysts: answer.catalysts.length > 0,
        hasUncertainties: answer.uncertainties.length > 0,
        avgEvidenceConfidence: avgConfidence,
      })
    : 0;

  return NextResponse.json({
    userMessage,
    assistantMessage,
    answer: gate.passed ? answer : null,
    intent,
    passed: gate.passed,
    qualityScore,
    failures: gate.failures,
  });
  } catch (err) {
    console.error('[POST /api/research/[id]/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** GET /api/research/[id]/messages — get messages for a session */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const researchSession = await prisma.researchSession.findUnique({
    where: { id },
  });

  if (!researchSession || researchSession.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '50');
  const offset = Number(req.nextUrl.searchParams.get('offset') ?? '0');

  try {
    const messages = await prisma.researchMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
      take: Math.min(limit, 100),
      skip: offset,
    });

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('[GET /api/research/[id]/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildGateway(): ModelGateway {
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

  const defaultProvider: ProviderId = process.env.OPENAI_API_KEY
    ? 'openai'
    : process.env.ANTHROPIC_API_KEY
      ? 'anthropic'
      : 'google';

  return new ModelGateway({ defaultProvider, providers });
}
