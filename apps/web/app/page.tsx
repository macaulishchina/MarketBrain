export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold tracking-tight">MarketBrain</h1>
      <p className="mt-4 text-lg text-gray-500">AI 原生投资研究工作站</p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="简报" description="盘前每日简报" href="/briefings" />
        <Card title="告警" description="实时事件告警" href="/alerts" />
        <Card title="研究" description="交互式 AI 研究" href="/research" />
      </div>
    </main>
  );
}

function Card({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-lg border border-gray-200 p-6 transition-colors hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500"
    >
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </a>
  );
}
