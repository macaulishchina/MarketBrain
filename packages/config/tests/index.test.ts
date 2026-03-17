import { describe, it, expect } from 'vitest';
import { featureFlags } from '../src/feature-flags';

describe('@marketbrain/config', () => {
  it('exports featureFlags with beta defaults', () => {
    expect(featureFlags.realtimeAlerts).toBe(true);
    expect(featureFlags.webPush).toBe(true);
    expect(featureFlags.interactiveResearch).toBe(true);
    expect(featureFlags.multiModelRouting).toBe(true);
    expect(featureFlags.betaAccess).toBe(true);
  });

  it('respects env var overrides', () => {
    process.env.FEATURE_REALTIME_ALERTS = 'false';
    expect(featureFlags.realtimeAlerts).toBe(false);
    delete process.env.FEATURE_REALTIME_ALERTS;
  });
});
