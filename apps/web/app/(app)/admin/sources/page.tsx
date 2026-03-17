export const dynamic = 'force-dynamic';

import { prisma } from '@marketbrain/db';

export default async function AdminSourcesPage() {
  const sources = await prisma.source.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Sources</h1>
        <p className="mt-1 text-muted-foreground">
          Manage data source configuration.
        </p>
      </div>

      {sources.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            No data sources configured yet. Add sources to begin ingesting data.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-left font-medium">Trust Level</th>
                <th className="p-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{source.name}</td>
                  <td className="p-3 capitalize">{source.type}</td>
                  <td className="p-3">{source.trustLevel}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        source.enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {source.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
