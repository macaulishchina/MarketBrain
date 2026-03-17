export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { auth } from '../../../lib/auth';
import { z } from 'zod';

const listQuerySchema = z.object({
  severity: z.enum(['s1', 's2', 's3']).optional(),
  status: z.enum(['pending', 'sent', 'read', 'dismissed']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

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

  const { severity, status, limit, offset } = parsed.data;

  const where: Record<string, unknown> = { userId: session.user.id };
  if (severity) where.severity = severity;
  if (status) where.status = status;

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      include: {
        event: {
          include: { instruments: { include: { instrument: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.alert.count({ where }),
  ]);

  return NextResponse.json({ alerts, total, limit, offset });
}
