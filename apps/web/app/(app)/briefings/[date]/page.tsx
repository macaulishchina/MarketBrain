export default function BriefingDetailPage({ params }: { params: Promise<{ date: string }> }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Briefing</h1>
      <p className="mt-2 text-gray-500">Briefing detail page.</p>
    </div>
  );
}
