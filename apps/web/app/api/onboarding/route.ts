export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { auth } from '../../../lib/auth';
import { z } from 'zod';

const onboardingSchema = z.object({
  displayName: z.string().max(100).optional(),
  tickers: z.array(z.string().min(1).max(10)).max(50).default([]),
  alertChannels: z.object({
    inApp: z.boolean().default(true),
    email: z.boolean().default(false),
    push: z.boolean().default(false),
  }).default({}),
  briefingTime: z.string().regex(/^\d{2}:\d{2}$/).default('07:00'),
});

/** POST /api/onboarding — complete onboarding setup. */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { displayName, tickers, alertChannels, briefingTime } = parsed.data;

  try {
    // Update user profile + notification preferences
    const existingUser = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { notificationPreferences: true },
    });

    const currentPrefs = (existingUser.notificationPreferences as Record<string, unknown>) ?? {};

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(displayName && { name: displayName }),
        notificationPreferences: {
          ...currentPrefs,
          alertChannels,
          briefingTime,
          onboardingCompleted: true,
        },
      },
    });

  // Create default watchlist with selected tickers
  if (tickers.length > 0) {
    // Find or create instruments for the tickers
    const instruments = await prisma.instrument.findMany({
      where: { ticker: { in: tickers } },
      select: { id: true, ticker: true },
    });

    const watchlist = await prisma.watchlist.create({
      data: {
        userId: session.user.id,
        name: 'My Watchlist',
        description: 'Default watchlist created during onboarding',
      },
    });

    if (instruments.length > 0) {
      await prisma.watchlistItem.createMany({
        data: instruments.map((inst, idx) => ({
          watchlistId: watchlist.id,
          instrumentId: inst.id,
          rank: idx,
        })),
      });
    }
  }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/onboarding]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
