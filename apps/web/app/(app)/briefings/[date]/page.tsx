export const dynamic = 'force-dynamic';

import { prisma } from '@marketbrain/db';
import { notFound } from 'next/navigation';
import { t, formatDateLong, formatDateTime } from '../../../../lib/i18n';

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  generating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

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
          {t.briefings.backToBriefings}
        </a>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            {briefing.market} {t.briefings.title} — {formatDateLong(briefing.tradingDate)}
          </h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[briefing.status] ?? STATUS_STYLES.draft}`}
          >
            {t.briefingStatus[briefing.status] ?? briefing.status}
          </span>
        </div>
        {briefing.generatedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t.briefings.generated} {formatDateTime(briefing.generatedAt)}
            {briefing.promptVersion ? ` · ${t.briefings.promptVersion} v${briefing.promptVersion}` : ''}
          </p>
        )}
      </div>

      {briefing.items.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {briefing.status === 'generating'
              ? t.briefings.briefingGenerating
              : briefing.status === 'failed'
                ? t.briefings.briefingFailed
                : t.briefings.noItems}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {briefing.items.map((item, i) => {
            const evidenceIds = item.evidenceIds as string[] | null;
            return (
              <div key={item.id} className="rounded-lg border bg-card p-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold leading-snug">{item.headline}</h3>

                    <p className="text-sm">{item.whyItMatters}</p>

                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{t.briefings.watch}</span>{' '}
                      {item.whatToWatch}
                    </p>

                    {/* Evidence quotes — stored in evidenceIds as string array */}
                    {evidenceIds && evidenceIds.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {t.briefings.evidence}
                        </p>
                        {evidenceIds.map((quote, qi) => (
                          <blockquote
                            key={qi}
                            className="border-l-2 border-muted-foreground/30 pl-3 text-xs italic text-muted-foreground"
                          >
                            {quote}
                          </blockquote>
                        ))}
                      </div>
                    )}

                    {/* Event metadata if joined */}
                    {item.event && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded border px-1.5 py-0.5 capitalize">
                          {item.event.type}
                        </span>
                        {typeof item.event.confidenceScore === 'number' && (
                          <span
                            className={`rounded px-1.5 py-0.5 ${
                              item.event.confidenceScore >= 0.7
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : item.event.confidenceScore >= 0.4
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {t.briefings.confidence}：{(item.event.confidenceScore * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
