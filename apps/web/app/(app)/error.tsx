'use client';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold">出了点问题</h1>
        <p className="text-muted-foreground">
          {error.message || '发生了意外错误。'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">错误 ID: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          重试
        </button>
      </div>
    </div>
  );
}
