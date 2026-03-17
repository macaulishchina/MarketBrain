export const dynamic = 'force-dynamic';

import { auth } from '../../../lib/auth';
import { prisma } from '@marketbrain/db';

export default async function ResearchPage() {
  const session = await auth();

  const sessions = await prisma.researchSession.findMany({
    where: { userId: session!.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Research</h1>
          <p className="mt-1 text-muted-foreground">
            Interactive AI-powered research sessions.
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            No research sessions yet. Start a new session to begin AI-powered analysis.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <a
              key={s.id}
              href={`/research/${s.id}`}
              className="block rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <h3 className="font-medium">{s.title ?? 'Untitled Session'}</h3>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="capitalize">{s.mode}</span>
                <span>{s.updatedAt.toLocaleDateString()}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
