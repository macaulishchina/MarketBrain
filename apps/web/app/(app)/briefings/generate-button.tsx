'use client';

import { useState } from 'react';

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
      const data = await res.json() as { briefingId?: string; status?: string; error?: string };

      if (!res.ok) {
        setMessage(data.error ?? 'Failed to trigger generation');
      } else {
        setMessage(`Briefing ${data.status} (${data.briefingId?.slice(0, 8)}…)`);
        // Refresh the page after a short delay to show updated list
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setMessage('Network error');
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
        {loading ? 'Generating…' : 'Generate Briefing'}
      </button>
    </div>
  );
}
