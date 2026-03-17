export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { auth } from '../../../../lib/auth';
import { z } from 'zod';

const patchSchema = z.object({
  status: z.enum(['read', 'dismissed']).optional(),
  muted: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert || alert.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const data: Record<string, unknown> = {};
    if (parsed.data.status) {
      data.status = parsed.data.status;
      if (parsed.data.status === 'read') {
        data.clickedAt = new Date();
      }
    }
    if (parsed.data.muted !== undefined) {
      data.muted = parsed.data.muted;
    }

    const updated = await prisma.alert.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/alerts/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        event: {
          include: { instruments: { include: { instrument: true } } },
        },
      },
    });

    if (!alert || alert.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(alert);
  } catch (err) {
    console.error('[GET /api/alerts/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
