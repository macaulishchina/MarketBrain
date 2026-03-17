export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { z } from 'zod';
import { auth } from '../../../../lib/auth';

const generateBodySchema = z.object({
  market: z.string().min(1).max(10).default('US'),
  tradingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

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

  try {
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

    // In production, this triggers the Trigger.dev generate-briefing task.
    // For now, return the record so the UI can poll for status.
    return NextResponse.json({
      briefingId: briefing.id,
      status: briefing.status,
      tradingDate,
      market,
    });
  } catch (err) {
    console.error('[POST /api/briefings/generate]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
