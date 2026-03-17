export const dynamic = 'force-dynamic';

import { prisma } from '@marketbrain/db';
import { auth } from '../../../lib/auth';
import { GenerateBriefingButton } from './generate-button';
import { t, formatDateShort, formatTime } from '../../../lib/i18n';

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  generating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default async function BriefingsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';

  const briefings = await prisma.briefing.findMany({
    orderBy: { tradingDate: 'desc' },
    take: 30,
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.briefings.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {t.briefings.subtitle}
          </p>
        </div>
        {isAdmin && <GenerateBriefingButton />}
      </div>

      {briefings.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {t.briefings.noBriefingsYet} {isAdmin ? t.briefings.noBriefingsAdmin : t.briefings.noBriefingsUser}
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
                <div>
                  <h3 className="font-medium">
                    {b.market} — {formatDateShort(b.tradingDate)}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {b._count.items} {t.briefings.items}
                    {b.generatedAt ? ` · ${t.briefings.generated} ${formatTime(b.generatedAt)}` : ''}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status] ?? STATUS_STYLES.draft}`}
                >
                  {t.briefingStatus[b.status] ?? b.status}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
