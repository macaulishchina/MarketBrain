export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { auth } from '../../../../lib/auth';
import { z } from 'zod';

const querySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  itemType: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/** GET /api/admin/review-queue — list review items. */
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

  const { status, itemType, limit, offset } = parsed.data;

  try {
    const where = {
      status,
      ...(itemType && { itemType }),
    };

    const [items, total, counts] = await Promise.all([
      prisma.reviewItem.findMany({
        where,
        include: { reviewer: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.reviewItem.count({ where }),
      prisma.reviewItem.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const statusCounts = Object.fromEntries(
      counts.map((c) => [c.status, c._count]),
    );

    return NextResponse.json({ items, total, limit, offset, statusCounts });
  } catch (err) {
    console.error('[GET /api/admin/review-queue]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const resolveSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
});

/** PATCH /api/admin/review-queue — resolve a review item. */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const item = await prisma.reviewItem.update({
      where: { id: parsed.data.id },
      data: {
        status: parsed.data.action,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: parsed.data.notes ?? null,
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error('[PATCH /api/admin/review-queue]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
