export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { auth } from '../../../../lib/auth';
import { z } from 'zod';

const querySchema = z.object({
  provider: z.string().optional(),
  taskType: z.string().optional(),
  status: z.enum(['success', 'error', 'fallback']).optional(),
  days: z.coerce.number().int().min(1).max(90).default(7),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/** GET /api/admin/model-calls — list model call records with filters. */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 });
  }

  const { provider, taskType, status, days, limit, offset } = parsed.data;
  const since = new Date(Date.now() - days * 86_400_000);

  try {
    const where = {
      createdAt: { gte: since },
      ...(provider && { provider }),
      ...(taskType && { taskType }),
      ...(status && { resultStatus: status }),
    };

    const [calls, total] = await Promise.all([
      prisma.modelCall.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.modelCall.count({ where }),
    ]);

    // Aggregate stats
    const stats = await prisma.modelCall.groupBy({
      by: ['provider', 'taskType', 'resultStatus'],
      where: { createdAt: { gte: since } },
      _count: true,
      _sum: { inputTokens: true, outputTokens: true, latencyMs: true, cost: true },
      _avg: { latencyMs: true, cost: true },
    });

    return NextResponse.json({ calls, total, limit, offset, stats });
  } catch (err) {
    console.error('[GET /api/admin/model-calls]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
