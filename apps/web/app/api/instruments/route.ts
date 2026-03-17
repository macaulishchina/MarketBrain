export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { auth } from '../../../lib/auth';
import { z } from 'zod';

const createInstrumentSchema = z.object({
  ticker: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  exchange: z.string().optional(),
  assetType: z.string().default('stock'),
  country: z.string().optional(),
  sector: z.string().optional(),
  industry: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const query = searchParams.get('q');
  const take = Math.min(Number(searchParams.get('limit')) || 50, 200);

  const instruments = await prisma.instrument.findMany({
    where: query
      ? {
          OR: [
            { ticker: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { ticker: 'asc' },
    take,
  });

  return NextResponse.json(instruments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createInstrumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const instrument = await prisma.instrument.create({
    data: parsed.data,
  });

  return NextResponse.json(instrument, { status: 201 });
}
