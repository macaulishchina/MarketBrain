export const dynamic = 'force-dynamic';

import { prisma } from '@marketbrain/db';

export default async function BriefingsPage() {
  const briefings = await prisma.briefing.findMany({
    where: { status: 'published' },
    orderBy: { tradingDate: 'desc' },
    take: 30,
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Briefings</h1>
        <p className="mt-1 text-muted-foreground">
          Pre-market daily briefings powered by AI analysis.
        </p>
      </div>

      {briefings.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            No briefings published yet. Briefings will appear here once the AI pipeline generates them.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {briefings.map((b) => (
            <a
              key={b.id}
              href={`/briefings/${b.tradingDate.toISOString().slice(0, 10)}`}
              className="block rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {b.market} — {b.tradingDate.toLocaleDateString()}
                </h3>
                <span className="rounded-full border px-2 py-0.5 text-xs capitalize">
                  {b.status}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
