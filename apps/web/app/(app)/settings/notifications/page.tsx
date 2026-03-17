export default function SettingsNotificationsPage() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Configure alert and notification preferences.
        </p>
      </div>

      <div className="max-w-lg space-y-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Alert Notifications</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">S1 — Critical Alerts</p>
              <p className="text-xs text-muted-foreground">Must interrupt notifications</p>
            </div>
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">S2 — High Priority</p>
              <p className="text-xs text-muted-foreground">High priority, can be batched</p>
            </div>
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">S3 — In-App Only</p>
              <p className="text-xs text-muted-foreground">Shown in-app, no push</p>
            </div>
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Briefing Delivery</h2>
          <p className="text-sm text-muted-foreground">
            Briefing delivery preferences will be configurable in Phase 4.
          </p>
        </div>
      </div>
    </div>
  );
}
