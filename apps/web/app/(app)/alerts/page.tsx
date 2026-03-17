export const dynamic = 'force-dynamic';

import { auth } from '../../../lib/auth';
import { prisma } from '@marketbrain/db';
import Link from 'next/link';

interface AlertsSearchParams {
  severity?: string;
  status?: string;
}

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<AlertsSearchParams>;
}) {
  const session = await auth();
  const params = await searchParams;

  const where: Record<string, unknown> = { userId: session!.user.id };
  if (params.severity && ['s1', 's2', 's3'].includes(params.severity)) {
    where.severity = params.severity;
  }
  if (params.status && ['pending', 'sent', 'read', 'dismissed'].includes(params.status)) {
    where.status = params.status;
  }

  const alerts = await prisma.alert.findMany({
    where,
    include: {
      event: {
        include: { instruments: { include: { instrument: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Count by severity for stats
  const counts = await prisma.alert.groupBy({
    by: ['severity'],
    where: { userId: session!.user.id },
    _count: true,
  });

  const countMap: Record<string, number> = {};
  for (const c of counts) {
    countMap[c.severity] = c._count;
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="mt-1 text-muted-foreground">
            Real-time event alerts for your tracked instruments.
          </p>
        </div>
        <Link
          href="/settings/notifications"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Preferences
        </Link>
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-3 gap-4">
        <SeveritySummaryCard
          severity="s1"
          label="Critical"
          count={countMap['s1'] ?? 0}
          active={params.severity === 's1'}
        />
        <SeveritySummaryCard
          severity="s2"
          label="High Priority"
          count={countMap['s2'] ?? 0}
          active={params.severity === 's2'}
        />
        <SeveritySummaryCard
          severity="s3"
          label="Standard"
          count={countMap['s3'] ?? 0}
          active={params.severity === 's3'}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <FilterLink href="/alerts" label="All" active={!params.severity && !params.status} />
        <FilterLink href="/alerts?severity=s1" label="S1 — Critical" active={params.severity === 's1'} />
        <FilterLink href="/alerts?severity=s2" label="S2 — High" active={params.severity === 's2'} />
        <FilterLink href="/alerts?severity=s3" label="S3 — Standard" active={params.severity === 's3'} />
        <span className="border-l mx-1" />
        <FilterLink href="/alerts?status=sent" label="Unread" active={params.status === 'sent'} />
        <FilterLink href="/alerts?status=read" label="Read" active={params.status === 'read'} />
        <FilterLink href="/alerts?status=dismissed" label="Dismissed" active={params.status === 'dismissed'} />
      </div>

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {params.severity || params.status
              ? 'No alerts match your filter.'
              : 'No alerts yet. Alerts will appear here as market events are detected.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const tickers = alert.event.instruments.map((ei) => ei.instrument.ticker);
            const metadata = alert.event.metadata as Record<string, unknown> | null;
            const alertCard = metadata?.alertCard as Record<string, unknown> | undefined;

            return (
              <div
                key={alert.id}
                className="flex items-start gap-4 rounded-lg border bg-card p-4 hover:border-foreground/20 transition-colors"
              >
                <SeverityDot severity={alert.severity} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">
                    {(alertCard?.title as string) ?? alert.event.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {(alertCard?.summary as string) ?? alert.event.summary}
                  </p>
                  {tickers.length > 0 && (
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {tickers.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{alert.createdAt.toLocaleDateString()}</span>
                    <span className="capitalize">{alert.event.type}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={alert.status} />
                  {alert.muted && (
                    <span className="text-xs text-muted-foreground">Muted</span>
                  )}
                  <AlertActions alertId={alert.id} status={alert.status} muted={alert.muted} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SeveritySummaryCard({
  severity,
  label,
  count,
  active,
}: {
  severity: string;
  label: string;
  count: number;
  active: boolean;
}) {
  const colors: Record<string, string> = {
    s1: 'border-red-500/50 bg-red-500/5',
    s2: 'border-yellow-500/50 bg-yellow-500/5',
    s3: 'border-blue-400/50 bg-blue-400/5',
  };
  return (
    <Link
      href={active ? '/alerts' : `/alerts?severity=${severity}`}
      className={`rounded-lg border p-4 text-center transition-colors hover:border-foreground/20 ${
        active ? colors[severity] ?? '' : ''
      }`}
    >
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Link>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const color =
    severity === 's1'
      ? 'bg-red-500'
      : severity === 's2'
        ? 'bg-yellow-500'
        : 'bg-blue-400';
  return <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${color}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'border-yellow-500/50 text-yellow-600',
    sent: 'border-blue-500/50 text-blue-600',
    read: 'border-green-500/50 text-green-600',
    dismissed: 'border-gray-400/50 text-gray-500',
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs capitalize ${styles[status] ?? ''}`}
    >
      {status}
    </span>
  );
}

function AlertActions({
  alertId,
  status,
  muted,
}: {
  alertId: string;
  status: string;
  muted: boolean;
}) {
  return (
    <div className="flex gap-1">
      {(status === 'sent' || status === 'pending') && (
        <form action={`/api/alerts/${alertId}`} method="POST">
          <input type="hidden" name="status" value="read" />
          <button
            type="submit"
            className="rounded px-2 py-0.5 text-xs hover:bg-accent"
            title="Mark as read"
          >
            ✓
          </button>
        </form>
      )}
      {status !== 'dismissed' && (
        <form action={`/api/alerts/${alertId}`} method="POST">
          <input type="hidden" name="status" value="dismissed" />
          <button
            type="submit"
            className="rounded px-2 py-0.5 text-xs hover:bg-accent"
            title="Dismiss"
          >
            ✕
          </button>
        </form>
      )}
      <form action={`/api/alerts/${alertId}`} method="POST">
        <input type="hidden" name="muted" value={muted ? 'false' : 'true'} />
        <button
          type="submit"
          className="rounded px-2 py-0.5 text-xs hover:bg-accent"
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔔' : '🔕'}
        </button>
      </form>
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? 'border-foreground bg-foreground text-background'
          : 'hover:bg-accent'
      }`}
    >
      {label}
    </Link>
  );
}
