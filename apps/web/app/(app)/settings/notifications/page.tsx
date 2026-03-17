'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';

interface NotificationPreferences {
  s1InApp: boolean;
  s1Email: boolean;
  s1Push: boolean;
  s2InApp: boolean;
  s2Email: boolean;
  s2Push: boolean;
  s3InApp: boolean;
  s3Email: boolean;
  s3Push: boolean;
  mutedTickers: string[];
  mutedEventTypes: string[];
}

const DEFAULT_PREFS: NotificationPreferences = {
  s1InApp: true,
  s1Email: false,
  s1Push: false,
  s2InApp: true,
  s2Email: false,
  s2Push: false,
  s3InApp: true,
  s3Email: false,
  s3Push: false,
  mutedTickers: [],
  mutedEventTypes: [],
};

export default function SettingsNotificationsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mutedInput, setMutedInput] = useState('');

  useEffect(() => {
    fetch('/api/alerts/preferences')
      .then((r) => r.json())
      .then((data) => {
        setPrefs({ ...DEFAULT_PREFS, ...data });
        setMutedInput((data.mutedTickers ?? []).join(', '));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function save() {
    setSaving(true);
    const updated: NotificationPreferences = {
      ...prefs,
      mutedTickers: mutedInput
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean),
    };
    await fetch('/api/alerts/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    setPrefs(updated);
    setSaving(false);
  }

  function toggle(key: keyof NotificationPreferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (!loaded) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-muted-foreground">Loading preferences…</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Configure alert and notification preferences.
        </p>
      </div>

      <div className="max-w-lg space-y-6">
        {/* Alert channel matrix */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Alert Channels</h2>
          <p className="text-xs text-muted-foreground">
            Choose how you receive alerts for each severity level.
          </p>

          {/* Header */}
          <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground">
            <span />
            <span className="text-center">In-App</span>
            <span className="text-center">Email</span>
            <span className="text-center">Push</span>
          </div>

          {/* S1 */}
          <div className="grid grid-cols-4 gap-2 items-center">
            <div>
              <p className="text-sm font-medium">S1 — Critical</p>
              <p className="text-xs text-muted-foreground">Must interrupt</p>
            </div>
            <ChannelToggle checked={prefs.s1InApp} onToggle={() => toggle('s1InApp')} />
            <ChannelToggle checked={prefs.s1Email} onToggle={() => toggle('s1Email')} disabled label="Soon" />
            <ChannelToggle checked={prefs.s1Push} onToggle={() => toggle('s1Push')} disabled label="Soon" />
          </div>

          {/* S2 */}
          <div className="grid grid-cols-4 gap-2 items-center">
            <div>
              <p className="text-sm font-medium">S2 — High Priority</p>
              <p className="text-xs text-muted-foreground">Can be batched</p>
            </div>
            <ChannelToggle checked={prefs.s2InApp} onToggle={() => toggle('s2InApp')} />
            <ChannelToggle checked={prefs.s2Email} onToggle={() => toggle('s2Email')} disabled label="Soon" />
            <ChannelToggle checked={prefs.s2Push} onToggle={() => toggle('s2Push')} disabled label="Soon" />
          </div>

          {/* S3 */}
          <div className="grid grid-cols-4 gap-2 items-center">
            <div>
              <p className="text-sm font-medium">S3 — Standard</p>
              <p className="text-xs text-muted-foreground">In-app only</p>
            </div>
            <ChannelToggle checked={prefs.s3InApp} onToggle={() => toggle('s3InApp')} />
            <ChannelToggle checked={prefs.s3Email} onToggle={() => toggle('s3Email')} disabled label="Soon" />
            <ChannelToggle checked={prefs.s3Push} onToggle={() => toggle('s3Push')} disabled label="Soon" />
          </div>
        </div>

        {/* Muted tickers */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Muted Tickers</h2>
          <p className="text-xs text-muted-foreground">
            Comma-separated list of tickers to suppress alerts for.
          </p>
          <input
            type="text"
            value={mutedInput}
            onChange={(e) => setMutedInput(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
            placeholder="e.g. AAPL, TSLA, MSFT"
          />
        </div>

        {/* Briefing delivery */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Briefing Delivery</h2>
          <p className="text-sm text-muted-foreground">
            Briefing delivery preferences will be configurable in Phase 4.
          </p>
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}

function ChannelToggle({
  checked,
  onToggle,
  disabled,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label?: string;
}) {
  if (disabled) {
    return (
      <div className="flex justify-center">
        <span className="text-xs text-muted-foreground">{label ?? '—'}</span>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onToggle}
        className={`h-5 w-9 rounded-full transition-colors ${
          checked ? 'bg-foreground' : 'bg-muted'
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-background transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
