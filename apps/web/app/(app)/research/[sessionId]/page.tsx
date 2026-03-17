'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Download, Archive, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EvidenceBlock {
  claim: string;
  quote: string;
  source: string;
  confidence: number;
}

interface ResearchAnswer {
  coreConclusion: string;
  supportingEvidence: EvidenceBlock[];
  counterEvidence: EvidenceBlock[];
  catalysts: string[];
  uncertainties: string[];
  followUps: string[];
}

interface Message {
  id: string;
  role: string;
  content: string;
  renderedBlocks: ResearchAnswer | Record<string, never>;
  evidenceIds: string[];
  createdAt: string;
}

interface SessionData {
  id: string;
  title: string | null;
  mode: string;
  query: string | null;
  status: string;
  messages: Message[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ResearchSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceBlock[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  async function fetchSession() {
    setLoading(true);
    const res = await fetch(`/api/research/${sessionId}`);
    if (res.ok) {
      const data = await res.json();
      setSession(data);
    }
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    // Optimistic: add user message immediately
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      renderedBlocks: {},
      evidenceIds: [],
      createdAt: new Date().toISOString(),
    };

    setSession((prev) =>
      prev ? { ...prev, messages: [...prev.messages, tempUserMsg] } : prev,
    );

    const res = await fetch(`/api/research/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      const data = await res.json();
      // Replace temp message and add assistant response
      setSession((prev) => {
        if (!prev) return prev;
        const msgs = prev.messages.filter((m) => m.id !== tempUserMsg.id);
        return {
          ...prev,
          messages: [...msgs, data.userMessage, data.assistantMessage],
          title: prev.title ?? data.assistantMessage.content?.slice(0, 60) ?? prev.title,
        };
      });
    }

    setSending(false);
  }

  async function handleExport() {
    window.open(`/api/research/${sessionId}/export`, '_blank');
  }

  async function handleArchive() {
    await fetch(`/api/research/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });
    router.push('/research');
  }

  function selectMessageEvidence(msg: Message) {
    const blocks = msg.renderedBlocks as ResearchAnswer;
    if (blocks?.supportingEvidence || blocks?.counterEvidence) {
      setSelectedEvidence([
        ...(blocks.supportingEvidence ?? []),
        ...(blocks.counterEvidence ?? []),
      ]);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground">Session not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <button onClick={() => router.push('/research')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate font-semibold">{session.title ?? 'New Research Session'}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize">{session.mode.replace('_', ' ')}</span>
            <span>·</span>
            <span className="capitalize">{session.status}</span>
          </div>
        </div>
        <button onClick={handleExport} className="rounded-md p-2 text-muted-foreground hover:bg-muted" title="Export">
          <Download className="h-4 w-4" />
        </button>
        <button onClick={handleArchive} className="rounded-md p-2 text-muted-foreground hover:bg-muted" title="Archive">
          <Archive className="h-4 w-4" />
        </button>
      </div>

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center panel — chat */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {session.messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <UserMessage content={msg.content} />
                ) : msg.role === 'assistant' ? (
                  <AssistantMessage
                    msg={msg}
                    onShowEvidence={() => selectMessageEvidence(msg)}
                  />
                ) : (
                  <SystemMessage content={msg.content} />
                )}
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Researching...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {session.status === 'active' && (
            <div className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask a research question..."
                  disabled={sending}
                  className="flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="rounded-lg bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right panel — evidence */}
        <div className="hidden w-80 flex-shrink-0 border-l overflow-y-auto lg:block">
          <div className="p-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
              Evidence Panel
            </h2>
            {selectedEvidence.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Click on an answer to view its evidence here.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedEvidence.map((ev, i) => (
                  <EvidenceCard key={i} evidence={ev} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
        {content}
      </div>
    </div>
  );
}

function AssistantMessage({
  msg,
  onShowEvidence,
}: {
  msg: Message;
  onShowEvidence: () => void;
}) {
  const blocks = msg.renderedBlocks as ResearchAnswer;
  const hasBlocks = blocks?.coreConclusion;

  if (!hasBlocks) {
    return (
      <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm">
        {msg.content}
      </div>
    );
  }

  return (
    <div
      className="max-w-[90%] space-y-3 rounded-2xl rounded-bl-md bg-muted px-4 py-3 cursor-pointer hover:ring-1 hover:ring-primary/30"
      onClick={onShowEvidence}
    >
      {/* Core conclusion */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
          Conclusion
        </div>
        <p className="text-sm">{blocks.coreConclusion}</p>
      </div>

      {/* Supporting evidence summary */}
      {blocks.supportingEvidence?.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">
            Supporting Evidence ({blocks.supportingEvidence.length})
          </div>
          {blocks.supportingEvidence.slice(0, 2).map((ev, i) => (
            <p key={i} className="text-xs text-muted-foreground mb-1">
              • {ev.claim}
            </p>
          ))}
          {blocks.supportingEvidence.length > 2 && (
            <p className="text-xs text-muted-foreground">
              +{blocks.supportingEvidence.length - 2} more...
            </p>
          )}
        </div>
      )}

      {/* Counter evidence summary */}
      {blocks.counterEvidence?.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-1">
            Counter Evidence ({blocks.counterEvidence.length})
          </div>
          {blocks.counterEvidence.slice(0, 2).map((ev, i) => (
            <p key={i} className="text-xs text-muted-foreground mb-1">
              • {ev.claim}
            </p>
          ))}
        </div>
      )}

      {/* Catalysts */}
      {blocks.catalysts?.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">
            Catalysts
          </div>
          {blocks.catalysts.map((c, i) => (
            <p key={i} className="text-xs text-muted-foreground mb-1">• {c}</p>
          ))}
        </div>
      )}

      {/* Uncertainties */}
      {blocks.uncertainties?.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-1">
            Uncertainties
          </div>
          {blocks.uncertainties.map((u, i) => (
            <p key={i} className="text-xs text-muted-foreground mb-1">• {u}</p>
          ))}
        </div>
      )}

      {/* Follow-ups */}
      {blocks.followUps?.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Suggested Follow-ups
          </div>
          {blocks.followUps.map((f, i) => (
            <p key={i} className="text-xs text-primary/80 mb-1">
              <ChevronRight className="inline h-3 w-3" /> {f}
            </p>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground/60 mt-2">
        Click to view evidence details →
      </p>
    </div>
  );
}

function SystemMessage({ content }: { content: string }) {
  return (
    <div className="text-center">
      <p className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
        {content}
      </p>
    </div>
  );
}

function EvidenceCard({ evidence }: { evidence: EvidenceBlock }) {
  const confidenceColor =
    evidence.confidence >= 0.7
      ? 'text-green-600'
      : evidence.confidence >= 0.4
        ? 'text-amber-600'
        : 'text-red-600';

  return (
    <div className="rounded-lg border bg-card p-3 text-sm">
      <div className="font-medium mb-1">{evidence.claim}</div>
      <blockquote className="border-l-2 border-primary/30 pl-2 text-xs text-muted-foreground italic mb-2">
        &ldquo;{evidence.quote}&rdquo;
      </blockquote>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{evidence.source}</span>
        <span className={confidenceColor}>
          {(evidence.confidence * 100).toFixed(0)}% confidence
        </span>
      </div>
    </div>
  );
}
