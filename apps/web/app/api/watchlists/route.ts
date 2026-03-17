export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { auth } from '../../../lib/auth';
import { z } from 'zod';

const createWatchlistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const addItemSchema = z.object({
  watchlistId: z.string().uuid(),
  instrumentId: z.string().uuid(),
  note: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const watchlists = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { instrument: true },
          orderBy: { rank: 'asc' },
        },
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(watchlists);
  } catch (err) {
    console.error('[GET /api/watchlists]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createWatchlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const watchlist = await prisma.watchlist.create({
      data: {
        ...parsed.data,
        userId: session.user.id,
      },
    });

    return NextResponse.json(watchlist, { status: 201 });
  } catch (err) {
    console.error('[POST /api/watchlists]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
