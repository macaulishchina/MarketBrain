export default function ResearchLoading() {
  return (
    <div className="p-6 md:p-8 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-56 bg-muted rounded" />
        <div className="h-9 w-36 bg-muted rounded-md" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}
