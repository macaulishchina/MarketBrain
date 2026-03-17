'use client';

import { useEffect, useState, useCallback } from 'react';

interface EvalCase {
  id: string;
  taskType: string;
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
  gradingRule: string;
  createdAt: string;
  runs: EvalRun[];
}

interface EvalRun {
  id: string;
  promptVersion: string;
  modelRouteVersion: string;
  score: number;
  notes: string | null;
  createdAt: string;
}

interface VersionSummary {
  promptVersion: string;
  _avg: { score: number | null };
  _count: number;
  _min: { score: number | null };
  _max: { score: number | null };
}

export default function AdminEvalsPage() {
  const [cases, setCases] = useState<EvalCase[]>([]);
  const [summary, setSummary] = useState<VersionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [taskType, setTaskType] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (taskType) params.set('taskType', taskType);
    const res = await fetch(`/api/admin/evals?${params}`);
    if (res.ok) {
      const data = await res.json();
      setCases(data.cases);
      setSummary(data.summary);
      setTotal(data.total);
    }
    setLoading(false);
  }, [taskType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const taskTypes = [...new Set(cases.map((c) => c.taskType))];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Evaluation Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Track AI output quality across prompt versions.
        </p>
      </div>

      {/* Score summary by prompt version */}
      {summary.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Score by Prompt Version</h2>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {summary.map((s) => (
              <div key={s.promptVersion} className="rounded-lg border bg-card p-4">
                <p className="font-mono text-sm font-medium">{s.promptVersion}</p>
                <p className="text-2xl font-bold mt-1">
                  {s._avg.score != null ? (s._avg.score * 100).toFixed(1) : '—'}%
                </p>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  <span>{s._count} runs</span>
                  <span>min {s._min.score != null ? (s._min.score * 100).toFixed(0) : '—'}%</span>
                  <span>max {s._max.score != null ? (s._max.score * 100).toFixed(0) : '—'}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium">Filter by task:</label>
        <select
          value={taskType}
          onChange={(e) => setTaskType(e.target.value)}
          className="rounded border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All</option>
          {taskTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground ml-2">{total} cases</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : cases.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No eval cases yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <div key={c.id} className="rounded-lg border">
              <div className="border-b bg-muted/50 px-4 py-3 flex items-center gap-3">
                <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {c.taskType}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {c.runs.length} run{c.runs.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="text-xs">
                  <span className="font-medium">Grading rule:</span>{' '}
                  <span className="text-muted-foreground">{c.gradingRule}</span>
                </div>
                {c.runs.length > 0 && (
                  <div className="space-y-2">
                    {c.runs.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 text-sm">
                        <div className="w-16">
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                r.score >= 0.8 ? 'bg-green-500' : r.score >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${r.score * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="font-mono text-xs w-12">
                          {(r.score * 100).toFixed(0)}%
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {r.promptVersion}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                        {r.notes && (
                          <span className="text-xs text-muted-foreground truncate max-w-48">
                            {r.notes}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
