import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-xl font-semibold">页面未找到</h2>
        <p className="text-muted-foreground">
          您要找的页面不存在或已被移动。
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          前往仪表盘
        </Link>
      </div>
    </div>
  );
}
