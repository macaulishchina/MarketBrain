'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Archive, Clock } from 'lucide-react';
import { t, formatDate } from '../../../lib/i18n';

interface SessionSummary {
  id: string;
  title: string | null;
  mode: string;
  status: string;
  query: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

const modeLabels = t.modeLabels;

export default function ResearchPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');

  useEffect(() => {
    fetchSessions();
  }, [filter]);

  async function fetchSessions() {
    setLoading(true);
    const qs = filter !== 'all' ? `?status=${filter}` : '';
    const res = await fetch(`/api/research${qs}`);
    if (res.ok) {
      const data = await res.json();
      setSessions(data.sessions);
    }
    setLoading(false);
  }

  async function createSession() {
    if (!question.trim() || creating) return;
    setCreating(true);

    const res = await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: question.trim() }),
    });

    if (res.ok) {
      const session = await res.json();
      router.push(`/research/${session.id}`);
    }
    setCreating(false);
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t.research.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {t.research.subtitle}
        </p>
      </div>

      {/* New session input */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createSession()}
              placeholder={t.research.placeholder}
              disabled={creating}
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
          </div>
          <button
            onClick={createSession}
            disabled={creating || !question.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t.research.startResearch}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b">
        {(['all', 'active', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === f
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? t.research.allSessions : f === 'active' ? t.research.active : t.research.archived}
          </button>
        ))}
      </div>

      {/* Session list */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">{t.research.loading}</div>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <Search className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            {filter === 'all'
              ? t.research.noSessionsYet
              : `没有${filter === 'active' ? t.research.active : t.research.archived}的会话。`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <a
              key={s.id}
              href={`/research/${s.id}`}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">
                  {s.title ?? s.query ?? t.research.untitledSession}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                    {modeLabels[s.mode] ?? s.mode}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(s.updatedAt)}
                  </span>
                  <span>{s._count.messages} {t.research.messages}</span>
                  {s.status === 'archived' && (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <Archive className="h-3 w-3" /> {t.research.archived}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
