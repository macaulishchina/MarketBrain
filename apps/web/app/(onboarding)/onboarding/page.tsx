'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '../../../lib/i18n';

type Step = 'welcome' | 'watchlist' | 'notifications' | 'complete';

const POPULAR_TICKERS = [
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'MSFT', name: 'Microsoft Corp.' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.' },
  { ticker: 'META', name: 'Meta Platforms Inc.' },
  { ticker: 'TSLA', name: 'Tesla Inc.' },
  { ticker: 'JPM', name: 'JPMorgan Chase' },
  { ticker: 'V', name: 'Visa Inc.' },
  { ticker: 'JNJ', name: 'Johnson & Johnson' },
  { ticker: 'WMT', name: 'Walmart Inc.' },
  { ticker: 'UNH', name: 'UnitedHealth Group' },
];

const STEPS: Step[] = ['welcome', 'watchlist', 'notifications', 'complete'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [displayName, setDisplayName] = useState('');
  const [selectedTickers, setSelectedTickers] = useState<Set<string>>(new Set());
  const [alertChannels, setAlertChannels] = useState({
    inApp: true,
    email: false,
    push: false,
  });
  const [briefingTime, setBriefingTime] = useState('07:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentIdx = STEPS.indexOf(step);

  const toggleTicker = useCallback((ticker: string) => {
    setSelectedTickers((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  }, []);

  async function handleComplete() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          tickers: Array.from(selectedTickers),
          alertChannels,
          briefingTime,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? '保存偏好设置失败');
      }
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.onboarding.somethingWrong);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 md:min-h-screen">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="flex gap-2" role="progressbar" aria-valuenow={currentIdx + 1} aria-valuemin={1} aria-valuemax={STEPS.length} aria-label="Onboarding progress">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= currentIdx ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{t.onboarding.welcome}</h1>
              <p className="mt-2 text-muted-foreground">
                {t.onboarding.welcomeDesc}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="display-name" className="text-sm font-medium">
                {t.onboarding.displayName}
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={t.onboarding.displayNamePlaceholder}
                autoFocus
              />
            </div>

            <button
              type="button"
              onClick={() => setStep('watchlist')}
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t.onboarding.getStarted}
            </button>
          </div>
        )}

        {/* Step: Watchlist */}
        {step === 'watchlist' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{t.onboarding.buildWatchlist}</h1>
              <p className="mt-2 text-muted-foreground">
                {t.onboarding.watchlistDesc}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {POPULAR_TICKERS.map((item) => (
                <button
                  key={item.ticker}
                  type="button"
                  onClick={() => toggleTicker(item.ticker)}
                  aria-pressed={selectedTickers.has(item.ticker)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    selectedTickers.has(item.ticker)
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="block text-sm font-bold">{item.ticker}</span>
                  <span className="block truncate text-xs">{item.name}</span>
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              {selectedTickers.size} {t.onboarding.selected}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
              >
                {t.onboarding.back}
              </button>
              <button
                type="button"
                onClick={() => setStep('notifications')}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {selectedTickers.size > 0 ? t.onboarding.continue : t.onboarding.skip}
              </button>
            </div>
          </div>
        )}

        {/* Step: Notifications */}
        {step === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{t.onboarding.notificationPrefs}</h1>
              <p className="mt-2 text-muted-foreground">
                {t.onboarding.notifDesc}
              </p>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">{t.onboarding.notificationPrefs}</legend>
              {([
                { key: 'inApp' as const, label: t.onboarding.inAppNotif, desc: t.onboarding.inAppNotifDesc },
                { key: 'email' as const, label: t.onboarding.emailAlerts, desc: t.onboarding.emailAlertsDesc },
                { key: 'push' as const, label: t.onboarding.pushNotif, desc: t.onboarding.pushNotifDesc },
              ]).map((ch) => (
                <label key={ch.key} className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={alertChannels[ch.key]}
                    onChange={(e) =>
                      setAlertChannels((prev) => ({ ...prev, [ch.key]: e.target.checked }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium">{ch.label}</span>
                    <span className="block text-xs text-muted-foreground">{ch.desc}</span>
                  </div>
                </label>
              ))}
            </fieldset>

            <div className="space-y-2">
              <label htmlFor="briefing-time" className="text-sm font-medium">
                {t.onboarding.dailyBriefingTime}
              </label>
              <input
                id="briefing-time"
                type="time"
                value={briefingTime}
                onChange={(e) => setBriefingTime(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {t.onboarding.briefingTimeDesc}
              </p>
            </div>

            {error && (
              <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('watchlist')}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
              >
                {t.onboarding.back}
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={saving}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? t.onboarding.saving : t.onboarding.completeSetup}
              </button>
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t.onboarding.allSet}</h1>
              <p className="mt-2 text-muted-foreground">
                {t.onboarding.allSetDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t.onboarding.goToDashboard}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
