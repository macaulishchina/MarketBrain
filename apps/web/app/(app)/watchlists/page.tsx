export const dynamic = 'force-dynamic';

import { auth } from '../../../lib/auth';
import { prisma } from '@marketbrain/db';
import { t } from '../../../lib/i18n';

export default async function WatchlistsPage() {
  const session = await auth();

  const watchlists = await prisma.watchlist.findMany({
    where: { userId: session!.user.id },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.watchlists.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {t.watchlists.subtitle}
          </p>
        </div>
      </div>

      {watchlists.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {t.watchlists.noWatchlistsYet}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {watchlists.map((wl) => (
            <div key={wl.id} className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">{wl.name}</h3>
              {wl.description && (
                <p className="mt-1 text-sm text-muted-foreground">{wl.description}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {wl._count.items} {t.watchlists.instruments}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
