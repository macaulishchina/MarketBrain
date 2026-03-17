import { describe, it, expect } from 'vitest';
import { featureFlags } from '../src/feature-flags.js';

describe('@marketbrain/config', () => {
  it('exports featureFlags', () => {
    expect(featureFlags.realtimeAlerts).toBe(false);
    expect(featureFlags.webPush).toBe(false);
  });
});
