'use client';

import { useEffect, useState, useCallback } from 'react';

interface ModelCall {
  id: string;
  provider: string;
  model: string;
  taskType: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  cost: number | null;
  resultStatus: string;
  createdAt: string;
}

interface GroupStat {
  provider: string;
  taskType: string;
  resultStatus: string;
  _count: number;
  _sum: {
    inputTokens: number | null;
    outputTokens: number | null;
    latencyMs: number | null;
    cost: number | null;
  };
  _avg: {
    latencyMs: number | null;
    cost: number | null;
  };
}

export default function AdminOperationsPage() {
  const [calls, setCalls] = useState<ModelCall[]>([]);
  const [stats, setStats] = useState<GroupStat[]>([]);
  const [total, setTotal] = useState(0);
  const [days, setDays] = useState(7);
  const [provider, setProvider] = useState('');
  const [taskType, setTaskType] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ days: String(days) });
    if (provider) params.set('provider', provider);
    if (taskType) params.set('taskType', taskType);
    const res = await fetch(`/api/admin/model-calls?${params}`);
    if (res.ok) {
      const data = await res.json();
      setCalls(data.calls);
      setStats(data.stats);
      setTotal(data.total);
    }
    setLoading(false);
  }, [days, provider, taskType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Aggregate stats for summary cards
  const totalTokens = stats.reduce(
    (acc, s) => acc + (s._sum.inputTokens ?? 0) + (s._sum.outputTokens ?? 0),
    0,
  );
  const totalCost = stats.reduce((acc, s) => acc + (s._sum.cost ?? 0), 0);
  const avgLatency = stats.length > 0
    ? stats.reduce((acc, s) => acc + (s._avg.latencyMs ?? 0) * s._count, 0) /
      stats.reduce((acc, s) => acc + s._count, 0)
    : 0;
  const errorCount = stats
    .filter((s) => s.resultStatus === 'error')
    .reduce((acc, s) => acc + s._count, 0);
  const fallbackCount = stats
    .filter((s) => s.resultStatus === 'fallback')
    .reduce((acc, s) => acc + s._count, 0);
  const totalCalls = stats.reduce((acc, s) => acc + s._count, 0);
  const successRate = totalCalls > 0 ? (totalCalls - errorCount) / totalCalls : 0;

  // Group by provider
  const providerStats = new Map<string, { calls: number; tokens: number; cost: number }>();
  for (const s of stats) {
    const prev = providerStats.get(s.provider) ?? { calls: 0, tokens: 0, cost: 0 };
    prev.calls += s._count;
    prev.tokens += (s._sum.inputTokens ?? 0) + (s._sum.outputTokens ?? 0);
    prev.cost += s._sum.cost ?? 0;
    providerStats.set(s.provider, prev);
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operations Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Model call latency, cost, and reliability.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded border bg-background px-3 py-1.5 text-sm"
          >
            <option value={1}>Last 24h</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="rounded border bg-background px-3 py-1.5 text-sm"
          >
            <option value="">All providers</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google</option>
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Calls</p>
          <p className="text-2xl font-bold">{totalCalls.toLocaleString('zh-CN')}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Success Rate</p>
          <p className={`text-2xl font-bold ${
            successRate >= 0.95 ? 'text-green-600' : successRate >= 0.8 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {(successRate * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Avg Latency</p>
          <p className="text-2xl font-bold">{Math.round(avgLatency)}ms</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Estimated Cost</p>
          <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Tokens</p>
          <p className="text-2xl font-bold">{(totalTokens / 1000).toFixed(1)}k</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Fallbacks</p>
          <p className={`text-2xl font-bold ${fallbackCount === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
            {fallbackCount}
          </p>
        </div>
      </div>

      {/* Provider breakdown */}
      {providerStats.size > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Provider Breakdown</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[...providerStats.entries()].map(([p, s]) => (
              <div key={p} className="rounded-lg border bg-card p-4">
                <p className="font-medium capitalize">{p}</p>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Calls</span><span className="font-mono">{s.calls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tokens</span><span className="font-mono">{(s.tokens / 1000).toFixed(1)}k</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost</span><span className="font-mono">${s.cost.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent calls table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Calls</h2>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : calls.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground">No model calls recorded yet.</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Time</th>
                  <th className="p-3 text-left font-medium">Provider</th>
                  <th className="p-3 text-left font-medium">Model</th>
                  <th className="p-3 text-left font-medium">Task</th>
                  <th className="p-3 text-left font-medium">Prompt</th>
                  <th className="p-3 text-right font-medium">Tokens</th>
                  <th className="p-3 text-right font-medium">Latency</th>
                  <th className="p-3 text-right font-medium">Cost</th>
                  <th className="p-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                    </td>
                    <td className="p-3 capitalize">{c.provider}</td>
                    <td className="p-3 font-mono text-xs">{c.model}</td>
                    <td className="p-3 font-mono text-xs">{c.taskType}</td>
                    <td className="p-3 font-mono text-xs">{c.promptVersion}</td>
                    <td className="p-3 text-right font-mono text-xs">
                      {c.inputTokens + c.outputTokens}
                    </td>
                    <td className="p-3 text-right font-mono text-xs">{c.latencyMs}ms</td>
                    <td className="p-3 text-right font-mono text-xs">
                      {c.cost != null ? `$${c.cost.toFixed(4)}` : '—'}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.resultStatus === 'success'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : c.resultStatus === 'fallback'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                      }`}>
                        {c.resultStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">{total} total records</p>
      </div>
    </div>
  );
}
