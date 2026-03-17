export const dynamic = 'force-dynamic';

import { prisma } from '@marketbrain/db';

export default async function AdminPromptsPage() {
  const templates = await prisma.promptTemplate.findMany({
    orderBy: [{ taskType: 'asc' }, { version: 'desc' }],
  });

  // Group by taskType for comparison view
  const grouped: Record<string, typeof templates> = {};
  for (const t of templates) {
    if (!grouped[t.taskType]) grouped[t.taskType] = [];
    grouped[t.taskType]!.push(t);
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prompt Registry</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage prompt templates. Compare versions side-by-side.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Templates</p>
          <p className="text-2xl font-bold">{templates.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Task Types</p>
          <p className="text-2xl font-bold">{Object.keys(grouped).length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Versions</p>
          <p className="text-2xl font-bold">{templates.filter((t) => t.active).length}</p>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            No prompt templates registered yet.
          </p>
        </div>
      ) : (
        <>
          {/* Flat table view */}
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Task Type</th>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Version</th>
                  <th className="p-3 text-left font-medium">Active</th>
                  <th className="p-3 text-left font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="p-3 font-mono text-xs">{t.taskType}</td>
                    <td className="p-3">{t.name}</td>
                    <td className="p-3 font-mono text-xs">{t.version}</td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                      }`}>
                        {t.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(t.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Version diff view grouped by task type */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Version Comparison</h2>
            <div className="space-y-6">
              {Object.entries(grouped).map(([taskType, versions]) => (
                <div key={taskType} className="rounded-lg border">
                  <div className="border-b bg-muted/50 px-4 py-3">
                    <h3 className="font-mono text-sm font-semibold">{taskType}</h3>
                    <p className="text-xs text-muted-foreground">
                      {versions.length} version{versions.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="divide-y">
                    {versions.map((v) => (
                      <div key={v.id} className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-medium">
                            v{v.version}
                          </span>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            v.active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                          }`}>
                            {v.active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(v.updatedAt).toLocaleString()}
                          </span>
                        </div>
                        {v.template && (
                          <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
                            {typeof v.template === 'string' ? v.template : JSON.stringify(v.template, null, 2)}
                          </pre>
                        )}
                        {v.schema && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              Output Schema
                            </summary>
                            <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted p-3 text-xs font-mono">
                              {typeof v.schema === 'string' ? v.schema : JSON.stringify(v.schema, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
