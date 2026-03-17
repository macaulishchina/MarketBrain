/**
 * Classify Event Task — determines severity, scores, and whether alerts
 * should be sent for a published event.
 *
 * Called after an event is published. Looks up all users with relevant
 * watchlists and creates alert records for qualifying users.
 */
import { task } from '@trigger.dev/sdk/v3';
import { prisma } from '@marketbrain/db';
import {
  computeMateriality,
  computeRelevance,
  classifyAlertSeverity,
  shouldAlert,
  isDuplicate,
  isCoolingDown,
  type DedupEntry,
  type CooldownEntry,
} from '@marketbrain/domain';

export interface ClassifyEventPayload {
  eventId: string;
}

export interface ClassifyEventResult {
  eventId: string;
  alertsCreated: number;
  skipped: { userId: string; reason: string }[];
}

export const classifyEventTask = task({
  id: 'classify-event',
  retry: { maxAttempts: 2 },
  run: async (payload: ClassifyEventPayload): Promise<ClassifyEventResult> => {
    const { eventId } = payload;

    // 1. Fetch the event with instruments
    const event = await prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      include: { instruments: { include: { instrument: true } } },
    });

    const eventTickers = event.instruments.map((ei) => ei.instrument.ticker);

    // 2. Compute materiality
    const materiality = computeMateriality({
      importanceScore: event.importanceScore ?? 0,
      confidenceScore: event.confidenceScore ?? 0,
      noveltyScore: event.noveltyScore ?? 0,
    });

    // 3. Find all users with watchlists
    const users = await prisma.user.findMany({
      include: {
        watchlists: {
          include: { items: { include: { instrument: true } } },
        },
      },
    });

    const skipped: ClassifyEventResult['skipped'] = [];
    let alertsCreated = 0;
    const now = new Date();

    for (const user of users) {
      const watchlistTickers = user.watchlists.flatMap((w) =>
        w.items.map((i) => i.instrument.ticker),
      );

      // 4. Should this user get an alert?
      if (
        !shouldAlert({
          confidenceScore: event.confidenceScore ?? 0,
          eventTickers,
          watchlistTickers,
        })
      ) {
        skipped.push({ userId: user.id, reason: 'does-not-qualify' });
        continue;
      }

      // 5. Compute relevance for this user's watchlist
      const relevance = computeRelevance({ eventTickers, watchlistTickers });

      // 6. Classify severity
      let severity = classifyAlertSeverity({
        confidenceScore: event.confidenceScore ?? 0,
        materiality,
        relevance,
      });

      // 7. Dedup check
      const existingAlerts = await prisma.alert.findMany({
        where: { userId: user.id, eventId },
        select: { eventId: true, userId: true, createdAt: true },
      });

      if (isDuplicate(eventId, user.id, existingAlerts as DedupEntry[])) {
        skipped.push({ userId: user.id, reason: 'duplicate' });
        continue;
      }

      // 8. Cooldown check (S1 → S2 downgrade if cooling down)
      if (severity === 's1') {
        const recentS1 = await prisma.alert.findMany({
          where: {
            userId: user.id,
            severity: 's1',
            createdAt: { gte: new Date(now.getTime() - 4 * 60 * 60 * 1000) },
          },
          include: { event: { include: { instruments: { include: { instrument: true } } } } },
        });

        const cooldownEntries: CooldownEntry[] = recentS1.map((a) => ({
          severity: 's1' as const,
          tickers: a.event.instruments.map((ei) => ei.instrument.ticker),
          createdAt: a.createdAt,
        }));

        if (isCoolingDown(severity, eventTickers, cooldownEntries, now)) {
          severity = 's2'; // Downgrade to S2
        }
      }

      // 9. Create alert record
      await prisma.alert.create({
        data: {
          eventId,
          userId: user.id,
          severity,
          channel: severity === 's1' ? 'in_app' : 'in_app', // Phase 3: in_app only
          status: 'pending',
        },
      });

      alertsCreated++;
    }

    return { eventId, alertsCreated, skipped };
  },
});
