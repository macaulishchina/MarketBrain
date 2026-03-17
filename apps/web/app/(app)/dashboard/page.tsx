export const dynamic = 'force-dynamic';

import { auth } from '../../../lib/auth';
import { prisma } from '@marketbrain/db';
import { t } from '../../../lib/i18n';

export default async function DashboardPage() {
  const session = await auth();

  const [watchlistCount, alertCount, briefingCount] = await Promise.all([
    prisma.watchlist.count({ where: { userId: session!.user.id } }),
    prisma.alert.count({ where: { userId: session!.user.id, status: 'pending' } }),
    prisma.briefing.count({ where: { status: 'published' } }),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t.dashboard.welcomeBack}，{session!.user.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t.dashboard.overview}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title={t.dashboard.watchlists}
          value={watchlistCount}
          description={t.dashboard.activeWatchlists}
          href="/watchlists"
        />
        <DashboardCard
          title={t.dashboard.pendingAlerts}
          value={alertCount}
          description={t.dashboard.unreadAlerts}
          href="/alerts"
        />
        <DashboardCard
          title={t.dashboard.briefings}
          value={briefingCount}
          description={t.dashboard.publishedBriefings}
          href="/briefings"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">{t.dashboard.recentBriefings}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.dashboard.noBriefingsYet}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">{t.dashboard.recentAlerts}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.dashboard.noAlertsYet}
          </p>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-lg border bg-card p-6 transition-colors hover:border-primary/50"
    >
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </a>
  );
}
