export const dynamic = 'force-dynamic';

import { prisma } from '@marketbrain/db';

export default async function AdminPromptsPage() {
  const templates = await prisma.promptTemplate.findMany({
    orderBy: [{ taskType: 'asc' }, { version: 'desc' }],
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prompt Registry</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage prompt templates.
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            No prompt templates registered yet. Templates will be added when the AI pipeline is built.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Task Type</th>
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Version</th>
                <th className="p-3 text-left font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="p-3 font-mono text-xs">{t.taskType}</td>
                  <td className="p-3">{t.name}</td>
                  <td className="p-3 font-mono text-xs">{t.version}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {t.active ? 'Active' : 'Inactive'}
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
