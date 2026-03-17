export const dynamic = 'force-dynamic';

import { auth } from '../../../lib/auth';
import { prisma } from '@marketbrain/db';

export default async function AlertsPage() {
  const session = await auth();

  const alerts = await prisma.alert.findMany({
    where: { userId: session!.user.id },
    include: { event: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="mt-1 text-muted-foreground">
          Real-time event alerts for your tracked instruments.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            No alerts yet. Alerts will appear here as market events are detected.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-4 rounded-lg border bg-card p-4"
            >
              <SeverityDot severity={alert.severity} />
              <div className="flex-1">
                <h3 className="font-medium">{alert.event.title}</h3>
                {alert.event.summary && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {alert.event.summary}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {alert.createdAt.toLocaleDateString()}
                </p>
              </div>
              <span className="rounded-full border px-2 py-0.5 text-xs capitalize">
                {alert.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
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
