'use client';

import { useEffect, useState, useCallback } from 'react';

interface ReviewItem {
  id: string;
  itemType: string;
  itemId: string;
  reason: string;
  status: string;
  reviewedAt: string | null;
  reviewNotes: string | null;
  snapshot: Record<string, unknown> | null;
  createdAt: string;
  reviewer: { id: string; name: string; email: string } | null;
}

export default function AdminReviewQueuePage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/review-queue?status=${filter}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
      setStatusCounts(data.statusCounts);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resolve = async (id: string, action: 'approved' | 'rejected') => {
    setResolving(id);
    await fetch('/api/admin/review-queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    await fetchData();
    setResolving(null);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manual Review Queue</h1>
        <p className="mt-1 text-muted-foreground">
          Content that failed gates or needs human verification.
        </p>
      </div>

      {/* Status counts */}
      <div className="grid gap-4 md:grid-cols-3">
        {(['pending', 'approved', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg border p-4 text-left transition-colors ${
              filter === s ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted/50'
            }`}
          >
            <p className="text-sm text-muted-foreground capitalize">{s}</p>
            <p className="text-2xl font-bold">{statusCounts[s] ?? 0}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            No {filter} items in the review queue.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{total} items</p>
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border">
              <div className="border-b bg-muted/50 px-4 py-3 flex items-center gap-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.itemType === 'alert' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  : item.itemType === 'briefing_item' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
                }`}>
                  {item.itemType.replace('_', ' ')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
                {item.reviewer && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Reviewed by {item.reviewer.name}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium">Reason</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.reason}</p>
                </div>
                {item.snapshot && (
                  <details>
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      View snapshot
                    </summary>
                    <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-3 text-xs font-mono">
                      {JSON.stringify(item.snapshot, null, 2)}
                    </pre>
                  </details>
                )}
                {item.reviewNotes && (
                  <div>
                    <p className="text-xs font-medium">Review notes</p>
                    <p className="text-xs text-muted-foreground">{item.reviewNotes}</p>
                  </div>
                )}
                {item.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => resolve(item.id, 'approved')}
                      disabled={resolving === item.id}
                      className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => resolve(item.id, 'rejected')}
                      disabled={resolving === item.id}
                      className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
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
