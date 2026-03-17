'use client';

import { useState } from 'react';
import { t } from '../../../lib/i18n';

export function GenerateBriefingButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/briefings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market: 'US' }),
      });
      const data = await res.json() as { briefingId?: string; status?: string; itemCount?: number; error?: string };

      if (!res.ok) {
        setMessage(data.error ?? '生成失败');
      } else {
        setMessage(`${t.briefingStatus[data.status ?? ''] ?? data.status} — ${data.itemCount ?? 0}${t.briefings.items}`);
        window.location.reload();
      }
    } catch {
      setMessage('网络错误');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? t.briefings.generating : t.briefings.generate}
      </button>
    </div>
  );
}
