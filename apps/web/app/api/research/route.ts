export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { auth } from '../../../lib/auth';
import { z } from 'zod';

const listQuerySchema = z.object({
  status: z.enum(['active', 'completed', 'archived']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const createSessionSchema = z.object({
  question: z.string().min(1).max(2000),
  mode: z.enum(['single_instrument', 'theme', 'comparison', 'freeform']).default('freeform'),
});

/** GET /api/research — list user's research sessions */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = listQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { status, limit, offset } = parsed.data;

  const where: Record<string, unknown> = { userId: session.user.id };
  if (status) where.status = status;

  const [sessions, total] = await Promise.all([
    prisma.researchSession.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        _count: { select: { messages: true } },
      },
    }),
    prisma.researchSession.count({ where }),
  ]);

  return NextResponse.json({ sessions, total, limit, offset });
}

/** POST /api/research — create a new research session with initial question */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { question, mode } = parsed.data;

  // Create session + initial user message in a transaction
  const researchSession = await prisma.$transaction(async (tx) => {
    const s = await tx.researchSession.create({
      data: {
        userId: session.user.id,
        mode,
        query: question,
        status: 'active',
      },
    });

    await tx.researchMessage.create({
      data: {
        sessionId: s.id,
        role: 'user',
        content: question,
        renderedBlocks: [],
        evidenceIds: [],
      },
    });

    return s;
  });

  return NextResponse.json(researchSession, { status: 201 });
}
