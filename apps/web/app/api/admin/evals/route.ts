export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@marketbrain/db';
import { auth } from '../../../../lib/auth';
import { z } from 'zod';

const querySchema = z.object({
  taskType: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/** GET /api/admin/evals — list eval cases with their latest runs. */
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

  const { taskType, limit, offset } = parsed.data;
  const where = taskType ? { taskType } : {};

  try {
    const [cases, total] = await Promise.all([
      prisma.evalCase.findMany({
        where,
        include: {
          runs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.evalCase.count({ where }),
    ]);

    // Compute summary stats per task type
    const summary = await prisma.evalRun.groupBy({
      by: ['promptVersion'],
      _avg: { score: true },
      _count: true,
      _min: { score: true },
      _max: { score: true },
    });

    return NextResponse.json({ cases, total, limit, offset, summary });
  } catch (err) {
    console.error('[GET /api/admin/evals]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createCaseSchema = z.object({
  taskType: z.string().min(1),
  input: z.record(z.unknown()),
  expected: z.record(z.unknown()),
  gradingRule: z.string().min(1),
});

/** POST /api/admin/evals — create a new eval case. */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createCaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }

  const { taskType, gradingRule } = parsed.data;
  try {
    const evalCase = await prisma.evalCase.create({
      data: {
        taskType,
        input: JSON.parse(JSON.stringify(parsed.data.input)),
        expected: JSON.parse(JSON.stringify(parsed.data.expected)),
        gradingRule,
      },
    });

    return NextResponse.json(evalCase, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/evals]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
