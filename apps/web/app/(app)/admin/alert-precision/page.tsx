'use client';

import { useEffect, useState, useCallback } from 'react';

interface AlertPrecisionData {
  period: { days: number; since: string };
  total: number;
  precision: number;
  muteRate: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  byChannel: Record<string, number>;
}

export default function AdminAlertPrecisionPage() {
  const [data, setData] = useState<AlertPrecisionData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/alert-precision?days=${days}`);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Alert Precision</h1>
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Alert Precision</h1>
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">Failed to load data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alert Precision</h1>
          <p className="mt-1 text-muted-foreground">
            Monitoring alert usefulness and delivery quality.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded border bg-background px-3 py-1.5 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Alerts</p>
          <p className="text-2xl font-bold">{data.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Precision</p>
          <p className={`text-2xl font-bold ${
            data.precision >= 0.7 ? 'text-green-600' : data.precision >= 0.5 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {(data.precision * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">read / (read + dismissed)</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Mute Rate</p>
          <p className={`text-2xl font-bold ${
            data.muteRate <= 0.1 ? 'text-green-600' : data.muteRate <= 0.3 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {(data.muteRate * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Period</p>
          <p className="text-lg font-semibold">{days} days</p>
          <p className="text-xs text-muted-foreground">自 {new Date(data.period.since).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })} 起</p>
        </div>
      </div>

      {/* Breakdown tables */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* By Severity */}
        <div className="rounded-lg border">
          <div className="border-b bg-muted/50 px-4 py-3">
            <h3 className="text-sm font-semibold">By Severity</h3>
          </div>
          <div className="p-4 space-y-2">
            {['s1', 's2', 's3'].map((s) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                  s === 's1' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  : s === 's2' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                }`}>
                  {s}
                </span>
                <span className="font-mono">{data.bySeverity[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Status */}
        <div className="rounded-lg border">
          <div className="border-b bg-muted/50 px-4 py-3">
            <h3 className="text-sm font-semibold">By Status</h3>
          </div>
          <div className="p-4 space-y-2">
            {['pending', 'sent', 'read', 'dismissed'].map((s) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className="capitalize">{s}</span>
                <span className="font-mono">{data.byStatus[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Channel */}
        <div className="rounded-lg border">
          <div className="border-b bg-muted/50 px-4 py-3">
            <h3 className="text-sm font-semibold">By Channel</h3>
          </div>
          <div className="p-4 space-y-2">
            {['in_app', 'email', 'push'].map((c) => (
              <div key={c} className="flex items-center justify-between text-sm">
                <span className="capitalize">{c.replace('_', ' ')}</span>
                <span className="font-mono">{data.byChannel[c] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
