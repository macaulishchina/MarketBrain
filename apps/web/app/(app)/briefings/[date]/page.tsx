export const dynamic = 'force-dynamic';

import { prisma } from '@marketbrain/db';
import { notFound } from 'next/navigation';

export default async function BriefingDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const tradingDate = new Date(date);

  if (isNaN(tradingDate.getTime())) {
    notFound();
  }

  const briefing = await prisma.briefing.findFirst({
    where: { tradingDate },
    include: {
      items: {
        include: { event: true },
        orderBy: { rank: 'asc' },
      },
    },
  });

  if (!briefing) {
    notFound();
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <a href="/briefings" className="text-sm text-muted-foreground hover:underline">
          ← Back to Briefings
        </a>
        <h1 className="mt-2 text-2xl font-bold">
          {briefing.market} Briefing — {briefing.tradingDate.toLocaleDateString()}
        </h1>
      </div>

      {briefing.items.length === 0 ? (
        <p className="text-muted-foreground">No items in this briefing.</p>
      ) : (
        <div className="space-y-4">
          {briefing.items.map((item, i) => (
            <div key={item.id} className="rounded-lg border bg-card p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.headline}</h3>
                  <p className="mt-2 text-sm">{item.whyItMatters}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <strong>Watch:</strong> {item.whatToWatch}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
