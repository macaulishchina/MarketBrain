export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { auth } from '../../../../../lib/auth';
import { z } from 'zod';

const addItemSchema = z.object({
  instrumentId: z.string().uuid(),
  note: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const watchlist = await prisma.watchlist.findUnique({
    where: { id },
  });
  if (!watchlist || watchlist.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const maxRank = await prisma.watchlistItem.aggregate({
    where: { watchlistId: id },
    _max: { rank: true },
  });

  const item = await prisma.watchlistItem.create({
    data: {
      watchlistId: id,
      instrumentId: parsed.data.instrumentId,
      note: parsed.data.note,
      rank: (maxRank._max.rank ?? 0) + 1,
    },
    include: { instrument: true },
  });

  return NextResponse.json(item, { status: 201 });
}
