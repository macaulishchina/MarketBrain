export const dynamic = 'force-dynamic';

import { auth } from '../../../lib/auth';
import { prisma } from '@marketbrain/db';

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
          Welcome back, {session!.user.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your investment research workspace overview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Watchlists"
          value={watchlistCount}
          description="Active watchlists"
          href="/watchlists"
        />
        <DashboardCard
          title="Pending Alerts"
          value={alertCount}
          description="Unread alerts"
          href="/alerts"
        />
        <DashboardCard
          title="Briefings"
          value={briefingCount}
          description="Published briefings"
          href="/briefings"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Recent Briefings</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No briefings yet. Briefings will appear here once the AI pipeline is active.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Recent Alerts</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No alerts yet. Alerts will appear here as events are detected.
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
