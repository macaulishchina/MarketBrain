export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { z } from 'zod';
import { auth } from '../../../../lib/auth';
import {
  ModelGateway,
  type ProviderId,
  type ProviderConfig,
  briefingCompositionSchema,
} from '@marketbrain/ai';

const generateBodySchema = z.object({
  market: z.string().min(1).max(10).default('US'),
  tradingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

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

/**
 * POST /api/briefings/generate — Trigger briefing generation for a date.
 * Only admin users can trigger generation.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const raw = await request.json();
  const parsed = generateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const market = parsed.data.market;
  const tradingDate = parsed.data.tradingDate ?? new Date().toISOString().split('T')[0]!;

  // Upsert briefing in GENERATING status
  const briefing = await prisma.briefing.upsert({
    where: {
      market_tradingDate: {
        market,
        tradingDate: new Date(tradingDate),
      },
    },
    create: {
      market,
      tradingDate: new Date(tradingDate),
      status: 'generating',
      generatedAt: new Date(),
      promptVersion: '1.0.0',
      modelRouteVersion: '1.0.0',
    },
    update: {
      status: 'generating',
      generatedAt: new Date(),
    },
  });

  // Inline generation — call AI directly (no Trigger.dev dependency)
  try {
    const gateway = buildGateway();

    // Fetch user's watchlist tickers for relevance
    const watchlistItems = await prisma.watchlistItem.findMany({
      where: { watchlist: { userId: session.user.id } },
      include: { instrument: true },
    });
    const watchlistTickers = watchlistItems.map((i) => i.instrument.ticker);

    // Fetch recent documents if any exist
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const documents = await prisma.document.findMany({
      where: { fetchedAt: { gte: since } },
      orderBy: { fetchedAt: 'desc' },
      take: 30,
    });

    const docContext =
      documents.length > 0
        ? documents
            .map((d, i) => `[Doc ${i + 1}] ${d.title}\n${(d.rawText ?? '').slice(0, 500)}`)
            .join('\n\n')
        : '';

    const prompt = `Compose a pre-market briefing for the ${market} market on ${tradingDate}.

${watchlistTickers.length > 0 ? `User watchlist: ${watchlistTickers.join(', ')}\n` : ''}
${docContext ? `Recent news documents:\n\n${docContext}\n\n` : ''}
${!docContext ? 'No ingested documents available. Use your general knowledge of current market conditions to produce a useful briefing based on well-known recent events and macro trends.\n' : ''}
Synthesize into a ranked briefing with 4-8 items. Each item must have a clear headline, why it matters, what to watch, affected tickers, and at least one evidence quote or reasoning.`;

    const result = await gateway.extractObject({
      taskType: 'compose_briefing',
      schema: briefingCompositionSchema,
      prompt,
      system: `You are a pre-market briefing composer for professional investors. Output actionable, evidence-backed briefing items ranked by importance. Each headline must be under 200 characters. IMPORTANT: All output text (headlines, summaries, analysis) MUST be written in Chinese (简体中文). Ticker symbols and proper nouns may remain in English.`,
    });

    // Delete old items for this briefing (in case of regeneration)
    await prisma.briefingItem.deleteMany({ where: { briefingId: briefing.id } });

    // Create Event + BriefingItem for each composed item
    for (let i = 0; i < result.data.items.length; i++) {
      const item = result.data.items[i]!;

      const event = await prisma.event.create({
        data: {
          type: item.eventType || 'market_move',
          status: 'published',
          title: item.headline,
          summary: item.whyItMatters,
          importanceScore: item.importanceScore,
          confidenceScore: item.confidenceScore,
          publishable: true,
        },
      });

      // Link event to matching instruments
      if (item.tickers.length > 0) {
        const instruments = await prisma.instrument.findMany({
          where: { ticker: { in: item.tickers } },
        });
        if (instruments.length > 0) {
          await prisma.eventInstrument.createMany({
            data: instruments.map((inst) => ({
              eventId: event.id,
              instrumentId: inst.id,
            })),
          });
        }
      }

      await prisma.briefingItem.create({
        data: {
          briefingId: briefing.id,
          eventId: event.id,
          rank: i + 1,
          headline: item.headline,
          whyItMatters: item.whyItMatters,
          whatToWatch: item.whatToWatch,
          evidenceIds: item.evidenceQuotes,
        },
      });
    }

    // Mark briefing as published
    await prisma.briefing.update({
      where: { id: briefing.id },
      data: { status: 'published' },
    });

    return NextResponse.json({
      briefingId: briefing.id,
      status: 'published',
      tradingDate,
      market,
      itemCount: result.data.items.length,
    });
  } catch (err) {
    console.error('[POST /api/briefings/generate]', err);
    // Mark briefing as failed so UI doesn't hang on "generating"
    await prisma.briefing
      .update({ where: { id: briefing.id }, data: { status: 'failed' } })
      .catch(() => {});
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
