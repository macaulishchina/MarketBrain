export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { auth } from '../../../../lib/auth';
import { z } from 'zod';

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});

/** GET /api/admin/alert-precision — alert precision & delivery stats. */
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

  const since = new Date(Date.now() - parsed.data.days * 86_400_000);

  try {
    const [bySeverity, byStatus, byChannel, total] = await Promise.all([
    prisma.alert.groupBy({
      by: ['severity'],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    prisma.alert.groupBy({
      by: ['status'],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    prisma.alert.groupBy({
      by: ['channel'],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    prisma.alert.count({ where: { createdAt: { gte: since } } }),
  ]);

  // Compute precision: read / (read + dismissed)
  const readCount = byStatus.find((s) => s.status === 'read')?._count ?? 0;
  const dismissedCount = byStatus.find((s) => s.status === 'dismissed')?._count ?? 0;
  const delivered = readCount + dismissedCount;
  const precision = delivered > 0 ? readCount / delivered : 0;

  // Mute rate
  const mutedCount = await prisma.alert.count({
    where: { createdAt: { gte: since }, muted: true },
  });
  const muteRate = total > 0 ? mutedCount / total : 0;

  return NextResponse.json({
    period: { days: parsed.data.days, since: since.toISOString() },
    total,
    precision: Math.round(precision * 1000) / 1000,
    muteRate: Math.round(muteRate * 1000) / 1000,
    bySeverity: Object.fromEntries(bySeverity.map((s) => [s.severity, s._count])),
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
    byChannel: Object.fromEntries(byChannel.map((s) => [s.channel, s._count])),
  });
  } catch (err) {
    console.error('[GET /api/admin/alert-precision]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
