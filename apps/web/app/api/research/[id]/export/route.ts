export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { auth } from '../../../../../lib/auth';

/** GET /api/research/[id]/export — export session as JSON */
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
    const researchSession = await prisma.researchSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!researchSession || researchSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Fetch evidence for all messages
    const allEvidenceIds = researchSession.messages.flatMap(
      (m) => (m.evidenceIds as string[]) ?? [],
    );

    const evidenceRecords =
      allEvidenceIds.length > 0
        ? await prisma.evidence.findMany({
            where: { id: { in: allEvidenceIds } },
          })
        : [];

    const exportData = {
      exportedAt: new Date().toISOString(),
      session: {
        id: researchSession.id,
        title: researchSession.title,
        mode: researchSession.mode,
        query: researchSession.query,
        status: researchSession.status,
        createdAt: researchSession.createdAt,
        updatedAt: researchSession.updatedAt,
      },
      messages: researchSession.messages.map((m) => ({
        role: m.role,
        content: m.content,
        renderedBlocks: m.renderedBlocks,
        evidenceIds: m.evidenceIds,
        createdAt: m.createdAt,
      })),
      evidence: evidenceRecords.map((e) => ({
        id: e.id,
        quote: e.quote,
        locator: e.locator,
        evidenceType: e.evidenceType,
        confidence: e.confidence,
      })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="research-${id}.json"`,
      },
    });
  } catch (err) {
    console.error('[GET /api/research/[id]/export]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
