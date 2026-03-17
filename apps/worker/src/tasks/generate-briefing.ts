/**
 * Generate Briefing Task — orchestrates the full briefing workflow:
 *
 * 1. Fetch recent documents from the database
 * 2. Extract events from documents
 * 3. Compose and rank briefing items
 * 4. Persist to database
 *
 * This is the top-level task that cron or admin triggers call.
 */
import { task } from '@trigger.dev/sdk/v3';
import { prisma } from '@marketbrain/db';
import { type ProviderId } from '@marketbrain/ai';
import { extractEventsTask } from './extract-events';
import { composeBriefingTask } from './compose-briefing';

export interface GenerateBriefingPayload {
  market: string;
  tradingDate: string;
  userId?: string;
  provider?: ProviderId;
}

export const generateBriefingTask = task({
  id: 'generate-briefing',
  retry: { maxAttempts: 1 },
  run: async (payload: GenerateBriefingPayload) => {
    const { market, tradingDate, userId, provider } = payload;

    // 1. Create briefing record in draft status
    const briefing = await prisma.briefing.upsert({
      where: { market_tradingDate: { market, tradingDate: new Date(tradingDate) } },
      create: {
        market,
        tradingDate: new Date(tradingDate),
        status: 'DRAFT',
        generatedAt: new Date(),
        promptVersion: '1.0.0',
        modelRouteVersion: '1.0.0',
      },
      update: {
        status: 'DRAFT',
        generatedAt: new Date(),
      },
    });

    // 2. Fetch recent documents (last 24h)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const documents = await prisma.document.findMany({
      where: { fetchedAt: { gte: since } },
      orderBy: { fetchedAt: 'desc' },
      take: 50,
      include: { source: true },
    });

    if (documents.length === 0) {
      // No documents — mark briefing as published with empty content
      await prisma.briefing.update({
        where: { id: briefing.id },
        data: { status: 'PUBLISHED' },
      });
      return { briefingId: briefing.id, itemCount: 0, message: 'No documents available' };
    }

    // 3. Extract events from documents
    const extractResult = await extractEventsTask.triggerAndWait({
      documents: documents.map((d) => ({
        id: d.id,
        title: d.title,
        source: d.source?.name ?? 'Unknown',
        text: d.rawText ?? '',
        publishedAt: d.publishedAt?.toISOString(),
      })),
      provider,
    });

    if (!extractResult.ok) {
      await prisma.briefing.update({
        where: { id: briefing.id },
        data: { status: 'FAILED' },
      });
      return { briefingId: briefing.id, itemCount: 0, message: 'Event extraction failed' };
    }

    // 4. Flatten all extracted events
    const allEvents = extractResult.output.extractions.flatMap((ext) =>
      ext.events.map((event) => ({
        title: event.title,
        summary: event.summary,
        type: event.type,
        tickers: event.instruments.map((i) => i.ticker),
        importanceScore: event.importanceScore,
        confidenceScore: event.confidenceScore,
        noveltyScore: event.noveltyScore,
        evidence: event.evidence.map((e) => e.quote),
      })),
    );

    if (allEvents.length === 0) {
      await prisma.briefing.update({
        where: { id: briefing.id },
        data: { status: 'PUBLISHED' },
      });
      return { briefingId: briefing.id, itemCount: 0, message: 'No events extracted' };
    }

    // 5. Get user watchlist tickers if userId provided
    let watchlistTickers: string[] = [];
    if (userId) {
      const items = await prisma.watchlistItem.findMany({
        where: { watchlist: { userId } },
        include: { instrument: true },
      });
      watchlistTickers = items.map((i) => i.instrument.ticker);
    }

    // 6. Compose briefing
    const composeResult = await composeBriefingTask.triggerAndWait({
      market,
      tradingDate,
      events: allEvents,
      watchlistTickers,
      provider,
    });

    if (!composeResult.ok) {
      await prisma.briefing.update({
        where: { id: briefing.id },
        data: { status: 'FAILED' },
      });
      return { briefingId: briefing.id, itemCount: 0, message: 'Briefing composition failed' };
    }

    const { publishableItems, passed } = composeResult.output;

    // 7. Create Event records and persist briefing items
    for (let i = 0; i < publishableItems.length; i++) {
      const item = publishableItems[i]!;

      // Create an Event record for each briefing item
      const event = await prisma.event.create({
        data: {
          type: item.eventType,
          status: 'published',
          title: item.headline,
          summary: item.whyItMatters,
          importanceScore: item.importanceScore,
          confidenceScore: item.confidenceScore,
          publishable: true,
        },
      });

      await prisma.briefingItem.create({
        data: {
          briefingId: briefing.id,
          eventId: event.id,
          rank: i + 1,
          headline: item.headline,
          whyItMatters: item.whyItMatters,
          whatToWatch: item.whatToWatch,
          evidenceIds: item.evidenceQuotes, // In v1, store quotes as evidence references
        },
      });
    }

    // 8. Update briefing status
    await prisma.briefing.update({
      where: { id: briefing.id },
      data: { status: passed ? 'PUBLISHED' : 'DRAFT' },
    });

    return {
      briefingId: briefing.id,
      itemCount: publishableItems.length,
      passed,
      rejectedCount: composeResult.output.rejectedItems.length,
    };
  },
});
