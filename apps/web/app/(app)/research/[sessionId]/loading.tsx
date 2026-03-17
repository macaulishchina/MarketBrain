export default function ResearchSessionLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] animate-pulse">
      <div className="flex-1 p-6 space-y-4">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="space-y-3 flex-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`h-20 bg-muted rounded-xl ${i % 2 === 0 ? 'w-3/4' : 'w-2/3 ml-auto'}`} />
          ))}
        </div>
        <div className="h-12 bg-muted rounded-xl" />
      </div>
      <div className="hidden w-80 border-l p-4 space-y-3 lg:block">
        <div className="h-5 w-24 bg-muted rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
