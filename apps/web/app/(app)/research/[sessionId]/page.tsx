export const dynamic = 'force-dynamic';

import { prisma } from '@marketbrain/db';
import { notFound } from 'next/navigation';

export default async function ResearchSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const session = await prisma.researchSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!session) {
    notFound();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <a href="/research" className="text-sm text-muted-foreground hover:underline">
          ← Back to Research
        </a>
        <h1 className="mt-1 text-lg font-semibold">
          {session.title ?? 'Untitled Session'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {session.messages.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Start your research by asking a question.
          </p>
        ) : (
          session.messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[80%] rounded-lg p-4 ${
                msg.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask a research question…"
            disabled
            className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Research chat will be enabled in Phase 2.
        </p>
      </div>
    </div>
  );
}
