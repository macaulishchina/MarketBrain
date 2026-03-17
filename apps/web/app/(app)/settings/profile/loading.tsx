export default function SettingsLoading() {
  return (
    <div className="p-6 md:p-8 space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-muted rounded" />
      <div className="space-y-4 max-w-lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-11 bg-muted rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
