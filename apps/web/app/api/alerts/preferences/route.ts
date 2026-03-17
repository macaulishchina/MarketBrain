export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { auth } from '../../../../lib/auth';
import { z } from 'zod';

const preferencesSchema = z.object({
  s1InApp: z.boolean().default(true),
  s1Email: z.boolean().default(false),
  s1Push: z.boolean().default(false),
  s2InApp: z.boolean().default(true),
  s2Email: z.boolean().default(false),
  s2Push: z.boolean().default(false),
  s3InApp: z.boolean().default(true),
  s3Email: z.boolean().default(false),
  s3Push: z.boolean().default(false),
  mutedTickers: z.array(z.string()).default([]),
  mutedEventTypes: z.array(z.string()).default([]),
});

export type NotificationPreferences = z.infer<typeof preferencesSchema>;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  s1InApp: true,
  s1Email: false,
  s1Push: false,
  s2InApp: true,
  s2Email: false,
  s2Push: false,
  s3InApp: true,
  s3Email: false,
  s3Push: false,
  mutedTickers: [],
  mutedEventTypes: [],
};

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationPreferences: true },
    });

    const prefs = user?.notificationPreferences
      ? preferencesSchema.parse(user.notificationPreferences)
      : DEFAULT_PREFERENCES;

    return NextResponse.json(prefs);
  } catch (err) {
    console.error('[GET /api/alerts/preferences]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { notificationPreferences: parsed.data },
    });

    return NextResponse.json(parsed.data);
  } catch (err) {
    console.error('[PUT /api/alerts/preferences]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
