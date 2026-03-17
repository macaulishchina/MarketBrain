export default function ResearchSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Research Session</h1>
      <p className="mt-2 text-gray-500">Research session detail.</p>
    </div>
  );
}
